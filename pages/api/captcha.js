import { generateMathCaptcha } from '../../lib/captcha';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const captcha = generateMathCaptcha();

    res.status(200).json({
      captchaId: captcha.captchaId,
      question: captcha.question
    });
  } catch (error) {
    console.error('Error generating captcha:', error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
}
