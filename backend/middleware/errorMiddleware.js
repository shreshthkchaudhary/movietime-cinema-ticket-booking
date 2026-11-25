// Handle requests to routes that do not exist
function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

// Centralised error handler so every controller can pass errors via next(error)
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose invalid ObjectId error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // MongoDB duplicate key error (e.g. duplicate email, ticketCode, or show slot)
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyPattern || {});
    if (
      fields.includes('theatre') &&
      fields.includes('screenName') &&
      fields.includes('startTime')
    ) {
      message = 'A show already exists on this theatre screen at that start time';
    } else {
      message = `Duplicate value for: ${fields.join(', ')}`;
    }
  }

  // JWT verification or expiration errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  res.status(statusCode).json({
    message,
  });
}

module.exports = { notFound, errorHandler };
