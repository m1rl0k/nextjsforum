/**
 * Utility functions for handling BigInt serialization in API responses
 */

/**
 * Recursively converts BigInt values to strings for JSON serialization
 * @param {any} obj - The object to serialize
 * @returns {any} - The serialized object with BigInt values converted to strings
 */
export function serializeBigInt(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Wrapper for res.json() that automatically handles BigInt serialization
 * @param {NextApiResponse} res - The Next.js API response object
 * @param {any} data - The data to send as JSON
 * @param {number} statusCode - Optional status code (default: 200)
 */
export function sendJson(res, data, statusCode = 200) {
  const serializedData = serializeBigInt(data);
  return res.status(statusCode).json(serializedData);
}

/**
 * Middleware to add BigInt-safe JSON response method to res object
 * @param {NextApiRequest} req - The Next.js API request object
 * @param {NextApiResponse} res - The Next.js API response object
 * @param {Function} next - The next middleware function
 */
export function bigintMiddleware(req, res, next) {
  // Add a safe JSON method to the response object
  res.jsonSafe = (data, statusCode = 200) => {
    return sendJson(res, data, statusCode);
  };
  
  if (next) {
    next();
  }
}

/**
 * Convert Prisma query results to JSON-safe format
 * Specifically handles common Prisma BigInt fields
 * @param {any} data - Prisma query result
 * @returns {any} - JSON-safe data
 */
export function prismaToJson(data) {
  return serializeBigInt(data);
}

/**
 * Handle BigInt serialization for raw SQL query results
 * @param {Array} rows - Raw SQL query results
 * @returns {Array} - Serialized rows
 */
export function serializeRawQuery(rows) {
  return rows.map(row => {
    const serialized = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'bigint') {
        serialized[key] = value.toString();
      } else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  });
}
