/**
 * Email service for sending transactional emails
 * Supports SMTP via nodemailer
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // Only create transporter if SMTP is configured
  if (!config.auth.user || !config.auth.pass) {
    console.warn('SMTP not configured. Emails will be logged to console only.');
    return null;
  }

  transporter = nodemailer.createTransporter(config);
  return transporter;
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  
  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME || 'Forum'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html: html || text,
  };

  // If SMTP not configured, log to console
  if (!transport) {
    console.log('📧 Email (not sent - SMTP not configured):');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', text);
    return { messageId: 'dev-mode', accepted: [to] };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetToken, username) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset Request';
  const text = `
Hello ${username},

You requested to reset your password. Click the link below to reset it:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

---
${process.env.SITE_NAME || 'Forum'}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #2B4F81; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hello ${username},</p>
    <p>You requested to reset your password. Click the button below to reset it:</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p>Or copy and paste this link into your browser:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p>If you didn't request this, please ignore this email.</p>
    <div class="footer">
      <p>${process.env.SITE_NAME || 'Forum'}<br>
      ${process.env.NEXTAUTH_URL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email, verificationToken, username) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify Your Email Address';
  const text = `
Hello ${username},

Thank you for registering! Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.

---
${process.env.SITE_NAME || 'Forum'}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #2B4F81; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to ${process.env.SITE_NAME || 'Forum'}!</h2>
    <p>Hello ${username},</p>
    <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
    <a href="${verifyUrl}" class="button">Verify Email</a>
    <p>Or copy and paste this link into your browser:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p><strong>This link will expire in 24 hours.</strong></p>
    <div class="footer">
      <p>${process.env.SITE_NAME || 'Forum'}<br>
      ${process.env.NEXTAUTH_URL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email, username) {
  const subject = `Welcome to ${process.env.SITE_NAME || 'Forum'}!`;
  const text = `
Hello ${username},

Welcome to ${process.env.SITE_NAME || 'Forum'}!

Your account has been successfully created. You can now:
- Create and reply to threads
- Customize your profile
- Join discussions with the community

Visit: ${process.env.NEXTAUTH_URL}

We're glad to have you here!

---
${process.env.SITE_NAME || 'Forum'}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #2B4F81; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to ${process.env.SITE_NAME || 'Forum'}!</h2>
    <p>Hello ${username},</p>
    <p>Your account has been successfully created. You can now:</p>
    <ul>
      <li>Create and reply to threads</li>
      <li>Customize your profile</li>
      <li>Join discussions with the community</li>
    </ul>
    <a href="${process.env.NEXTAUTH_URL}" class="button">Visit Forum</a>
    <p>We're glad to have you here!</p>
    <div class="footer">
      <p>${process.env.SITE_NAME || 'Forum'}<br>
      ${process.env.NEXTAUTH_URL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail
};

