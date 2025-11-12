import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  TOKEN_EXPIRY: z.string().default('7d'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  
  // Features
  USE_DATABASE_SETTINGS: z.string().transform(val => val === 'true').default('false'),
  FORUM_INSTALLED: z.string().transform(val => val === 'true').default('false'),
  
  // Upload Configuration
  USE_S3_UPLOAD: z.string().transform(val => val === 'true').default('false'),
  S3_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val) || 900000).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val) || 100).default('100'),
});

let validatedEnv = null;

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 * @returns {Object} Validated environment variables
 */
export function validateEnv() {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      console.error('❌ Environment validation failed:');
      console.error(errorMessages);
      
      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Environment validation failed:\n${errorMessages}`);
      }
      
      // In development, warn but continue
      console.warn('⚠️  Continuing with invalid environment in development mode');
      console.warn('⚠️  Please fix these issues before deploying to production');
      
      // Return process.env as fallback in development
      return process.env;
    }
    throw error;
  }
}

/**
 * Get a validated environment variable
 * @param {string} key - The environment variable key
 * @returns {any} The environment variable value
 */
export function getEnv(key) {
  const env = validateEnv();
  return env[key];
}

/**
 * Check if we're in production
 * @returns {boolean}
 */
export function isProduction() {
  return getEnv('NODE_ENV') === 'production';
}

/**
 * Check if we're in development
 * @returns {boolean}
 */
export function isDevelopment() {
  return getEnv('NODE_ENV') === 'development';
}

/**
 * Check if S3 upload is enabled and configured
 * @returns {boolean}
 */
export function isS3Enabled() {
  const env = validateEnv();
  return env.USE_S3_UPLOAD && 
         !!env.S3_BUCKET_NAME && 
         !!env.AWS_ACCESS_KEY_ID && 
         !!env.AWS_SECRET_ACCESS_KEY;
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}

