export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Clear the HTTP-only cookie with proper SameSite and Secure attributes
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      'token=',
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'HttpOnly',
      'SameSite=Strict'
    ];

    // Add Secure flag in production
    if (isProduction) {
      cookieOptions.push('Secure');
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while logging out'
    });
  }
}
