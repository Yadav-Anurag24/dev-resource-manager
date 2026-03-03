/**
 * Centralized Error Handling Middleware
 * Catches all errors and renders a user-friendly error page or sends JSON.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // If the request expects JSON, send JSON response
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  // Otherwise render error in the view
  res.status(statusCode).render('error', {
    title: 'Error',
    message,
    statusCode,
  });
};

module.exports = errorHandler;
