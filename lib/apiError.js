class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Validation Error', errors = []) {
    super(400, message);
    this.errors = errors;
  }
}

const errorHandler = (err, req, res, next) => {
  // Set default values for unexpected errors
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    err = new UnauthorizedError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    err = new UnauthorizedError('Token expired');
  } else if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    err = new ValidationError('Validation failed', errors);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new ConflictError(`${field} already exists`);
  } else if (!err.isOperational) {
    // For unhandled errors, don't leak details in production
    if (process.env.NODE_ENV === 'production') {
      err = new ApiError(500, 'Something went wrong!');
    }
  }

  // Send error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(err.errors && { errors: err.errors })
  });
};

export {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  errorHandler
};
