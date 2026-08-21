const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  // Phase 2: honour ApiError.statusCode so 401/403/404/409/422 are not
  // flattened into 500 by the fallback above.
  if (Number.isInteger(err.statusCode) && err.statusCode >= 400) {
    statusCode = err.statusCode;
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate field value: ${Object.keys(err.keyValue)}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Field-level detail from express-validator, when present.
    errors: Array.isArray(err.errors) && err.errors.length ? err.errors : undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
