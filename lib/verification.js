import crypto from 'crypto';

/**
 * Generate a secure verification token
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate token expiry (24 hours from now)
 */
export function generateTokenExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiryDate) {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
}
