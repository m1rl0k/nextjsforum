import { getEnv } from './env';

// In-memory store for rate limiting
// In production, you should use Redis or a similar solution
class RateLimitStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
  }

  increment(key) {
    const now = Date.now();
    const resetTime = this.resetTime.get(key);

    // Reset if window has passed
    if (!resetTime || now > resetTime) {
      this.hits.set(key, 1);
      this.resetTime.set(key, now + parseInt(getEnv('RATE_LIMIT_WINDOW_MS')));
      return { count: 1, resetTime: this.resetTime.get(key) };
    }

    // Increment hit count
    const count = (this.hits.get(key) || 0) + 1;
    this.hits.set(key, count);
    return { count, resetTime };
  }

  get(key) {
    const now = Date.now();
    const resetTime = this.resetTime.get(key);

    // Reset if window has passed
    if (!resetTime || now > resetTime) {
      return { count: 0, resetTime: now + parseInt(getEnv('RATE_LIMIT_WINDOW_MS')) };
    }

    return { count: this.hits.get(key) || 0, resetTime };
  }

  reset(key) {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, resetTime] of this.resetTime.entries()) {
      if (now > resetTime) {
        this.hits.delete(key);
        this.resetTime.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

// Cleanup every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

/**
 * Get client identifier from request
 * @param {Object} req - Request object
 * @returns {string} Client identifier
 */
function getClientId(req) {
  // Try to get IP from various headers (for proxies)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';
  
  return ip;
}

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message when limit is exceeded
 * @param {Function} options.keyGenerator - Custom key generator function
 * @returns {Function} Middleware function
 */
export function rateLimit(options = {}) {
  const {
    windowMs = parseInt(getEnv('RATE_LIMIT_WINDOW_MS')),
    max = parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS')),
    message = 'Too many requests, please try again later.',
    keyGenerator = getClientId,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req, res, next) => {
    const key = keyGenerator(req);
    const { count, resetTime } = store.get(key);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

    if (count >= max) {
      res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      });
    }

    // Increment counter
    store.increment(key);

    // Handle response to potentially skip counting
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        const statusCode = res.statusCode;
        
        // Decrement if we should skip this request
        if (
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          const current = store.get(key);
          store.hits.set(key, Math.max(0, current.count - 1));
        }
        
        return originalJson(data);
      };
    }

    next();
  };
}

/**
 * Strict rate limit for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Standard rate limit for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

/**
 * Strict rate limit for content creation
 */
export const createRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 posts/threads per minute
  message: 'You are posting too quickly, please slow down.',
});

/**
 * Rate limit for search endpoints
 */
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
});

/**
 * Reset rate limit for a specific key
 * @param {string} key - The key to reset
 */
export function resetRateLimit(key) {
  store.reset(key);
}

/**
 * Get current rate limit status for a key
 * @param {string} key - The key to check
 * @returns {Object} Current status
 */
export function getRateLimitStatus(key) {
  return store.get(key);
}

