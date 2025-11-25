import { hashPassword, generateToken } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { registerSchema, validate } from '../../../lib/validation';
import { authRateLimit } from '../../../lib/rateLimit';
import { isProduction } from '../../../lib/env';
import { generateVerificationToken, generateTokenExpiry } from '../../../lib/verification';
import { sendVerificationEmail } from '../../../lib/email';
import { verifyCaptcha, isCaptchaEnabled, checkHoneypot, checkSubmitTiming } from '../../../lib/captcha';
import { getClientIp, isIpBanned } from '../../../lib/ipBan';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    authRateLimit(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    // Check IP ban
    const clientIp = getClientIp(req);
    const ipBanStatus = await isIpBanned(clientIp);
    if (ipBanStatus.banned) {
      const message = ipBanStatus.isPermanent
        ? `Your IP address has been permanently banned. Reason: ${ipBanStatus.reason}`
        : `Your IP address is banned until ${new Date(ipBanStatus.expiresAt).toLocaleString()}. Reason: ${ipBanStatus.reason}`;
      return res.status(403).json({ error: message, ipBanned: true });
    }

    const { captchaId, captchaAnswer, formLoadTime, honeypot } = req.body;

    // Check honeypot (spam protection)
    const honeypotCheck = checkHoneypot(honeypot);
    if (honeypotCheck.isBot) {
      return res.status(400).json({ error: 'Spam detected' });
    }

    // Check submit timing (bot detection)
    const timingCheck = checkSubmitTiming(formLoadTime, 2);
    if (timingCheck.isSuspicious) {
      return res.status(400).json({ error: timingCheck.error });
    }

    // Verify captcha if enabled
    const captchaRequired = await isCaptchaEnabled(prisma);
    if (captchaRequired) {
      const captchaResult = verifyCaptcha(captchaId, captchaAnswer);
      if (!captchaResult.valid) {
        return res.status(400).json({ error: captchaResult.error });
      }
    }

    // Validate input
    const validation = validate(registerSchema, req.body);
    if (!validation.success) {
      console.error('Validation failed:', validation.errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { email, username, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = generateTokenExpiry();

    // Check if email verification is required (from site settings)
    let requireEmailVerification = false;
    try {
      const setting = await prisma.siteSettings.findUnique({
        where: { key: 'email_verification' }
      });
      requireEmailVerification = setting?.value === 'true';
    } catch (e) {
      // Default to false if setting doesn't exist
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
        emailVerified: !requireEmailVerification, // Auto-verify if verification not required
        verificationToken: requireEmailVerification ? verificationToken : null,
        verificationExpires: requireEmailVerification ? verificationExpires : null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        bio: true,
        avatar: true,
        location: true,
        signature: true,
        postCount: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Send verification email if required
    if (requireEmailVerification) {
      try {
        await sendVerificationEmail(email, verificationToken, username);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie with token
    const cookieOptions = [
      `token=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=604800', // 7 days
      isProduction() ? 'Secure' : '' // Only use Secure flag in production
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    res.status(201).json({
      success: true,
      user,
      token,
      requiresVerification: requireEmailVerification && !user.emailVerified,
      message: requireEmailVerification ? 'Please check your email to verify your account' : undefined
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
