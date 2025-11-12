import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  location: z.string().max(100, 'Location must be at most 100 characters').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  signature: z.string().max(200, 'Signature must be at most 200 characters').optional(),
  displayName: z.string().max(50, 'Display name must be at most 50 characters').optional(),
});

// Thread validation schemas
export const createThreadSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be at most 50000 characters'),
  subjectId: z.number().int().positive('Invalid subject ID'),
});

export const updateThreadSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be at most 50000 characters')
    .optional(),
  sticky: z.boolean().optional(),
  locked: z.boolean().optional(),
});

// Post validation schemas
export const createPostSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be at most 50000 characters'),
  threadId: z.number().int().positive('Invalid thread ID'),
  replyToId: z.number().int().positive().optional(),
});

export const updatePostSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be at most 50000 characters'),
  editReason: z.string().max(200, 'Edit reason must be at most 200 characters').optional(),
});

// Report validation schemas
export const createReportSchema = z.object({
  type: z.enum(['thread', 'post', 'user'], {
    errorMap: () => ({ message: 'Invalid report type' })
  }),
  targetId: z.number().int().positive('Invalid target ID'),
  reason: z.string()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must be at most 500 characters'),
  description: z.string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
});

// Category/Subject validation schemas
export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  order: z.number().int().nonnegative().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  categoryId: z.number().int().positive('Invalid category ID'),
  order: z.number().int().nonnegative().optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Search validation
export const searchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query must be at most 200 characters'),
  type: z.enum(['all', 'threads', 'posts', 'users']).default('all'),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * Validate data against a schema
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {any} data - The data to validate
 * @returns {Object} - { success: boolean, data?: any, errors?: any }
 */
export function validate(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // ZodError has an 'issues' property, not 'errors'
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.') || 'unknown',
        message: issue.message
      }));

      return {
        success: false,
        errors
      };
    }

    console.error('Non-Zod validation error:', error);
    return {
      success: false,
      errors: [{ field: 'unknown', message: error?.message || 'Validation failed' }]
    };
  }
}

/**
 * Middleware to validate request body
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} - Express middleware function
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const result = validate(schema, req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors
      });
    }
    
    // Replace req.body with validated data
    req.body = result.data;
    next();
  };
}

/**
 * Validate query parameters
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {Object} query - The query parameters to validate
 * @returns {Object} - { success: boolean, data?: any, errors?: any }
 */
export function validateQuery(schema, query) {
  // Convert string numbers to actual numbers for common fields
  const processed = { ...query };
  
  if (processed.page) processed.page = parseInt(processed.page);
  if (processed.limit) processed.limit = parseInt(processed.limit);
  if (processed.id) processed.id = parseInt(processed.id);
  if (processed.subjectId) processed.subjectId = parseInt(processed.subjectId);
  if (processed.categoryId) processed.categoryId = parseInt(processed.categoryId);
  if (processed.threadId) processed.threadId = parseInt(processed.threadId);
  if (processed.userId) processed.userId = parseInt(processed.userId);
  
  return validate(schema, processed);
}

