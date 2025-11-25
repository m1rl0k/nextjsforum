import crypto from 'crypto';

// Store captcha challenges in memory (use Redis in production for multi-server)
const captchaChallenges = new Map();
const CAPTCHA_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Clean up expired captchas periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of captchaChallenges.entries()) {
    if (now > data.expiry) {
      captchaChallenges.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * Generate a simple math captcha
 */
export function generateMathCaptcha() {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, answer;

  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 20) + 10;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      break;
  }

  const question = `${num1} ${operation} ${num2} = ?`;
  const captchaId = crypto.randomBytes(16).toString('hex');

  // Store the answer
  captchaChallenges.set(captchaId, {
    answer: answer.toString(),
    expiry: Date.now() + CAPTCHA_EXPIRY
  });

  return {
    captchaId,
    question,
    expiresIn: CAPTCHA_EXPIRY
  };
}

/**
 * Verify a captcha answer
 */
export function verifyCaptcha(captchaId, userAnswer) {
  if (!captchaId || !userAnswer) {
    return { valid: false, error: 'Captcha ID and answer are required' };
  }

  const challenge = captchaChallenges.get(captchaId);

  if (!challenge) {
    return { valid: false, error: 'Captcha expired or invalid. Please try again.' };
  }

  if (Date.now() > challenge.expiry) {
    captchaChallenges.delete(captchaId);
    return { valid: false, error: 'Captcha expired. Please try again.' };
  }

  const isValid = challenge.answer === userAnswer.toString().trim();

  // Delete the captcha after use (one-time use)
  captchaChallenges.delete(captchaId);

  if (!isValid) {
    return { valid: false, error: 'Incorrect answer. Please try again.' };
  }

  return { valid: true };
}

/**
 * Check if captcha is enabled (from site settings)
 */
export async function isCaptchaEnabled(prisma) {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'captcha_enabled' }
    });
    return setting?.value === 'true';
  } catch (e) {
    return false; // Default to disabled
  }
}

/**
 * Check if captcha is required for guests only
 */
export async function isCaptchaGuestOnly(prisma) {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'captcha_guest_only' }
    });
    return setting?.value === 'true';
  } catch (e) {
    return true; // Default to guests only
  }
}

/**
 * Honeypot field validation
 * If the honeypot field is filled, it's likely a bot
 */
export function checkHoneypot(honeypotValue) {
  // If honeypot field has any value, it's a bot
  if (honeypotValue && honeypotValue.trim().length > 0) {
    return { isBot: true, error: 'Spam detected' };
  }
  return { isBot: false };
}

/**
 * Check submission timing
 * If form was submitted too quickly, it's likely a bot
 */
export function checkSubmitTiming(formLoadTime, minSeconds = 3) {
  if (!formLoadTime) {
    return { isSuspicious: false };
  }

  const loadTime = parseInt(formLoadTime, 10);
  const submitTime = Date.now();
  const elapsedSeconds = (submitTime - loadTime) / 1000;

  if (elapsedSeconds < minSeconds) {
    return {
      isSuspicious: true,
      error: 'Please take your time filling out the form'
    };
  }

  return { isSuspicious: false };
}

export default {
  generateMathCaptcha,
  verifyCaptcha,
  isCaptchaEnabled,
  isCaptchaGuestOnly,
  checkHoneypot,
  checkSubmitTiming
};
