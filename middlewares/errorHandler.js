/**
 * Centralized Error Handling Middleware
 * Catches all errors and renders a user-friendly error page or sends JSON.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Uploaded file is too large. Maximum allowed size is 15MB.',
    });
  }

  if (err.message && err.message.includes('Only PDF, DOC, DOCX, EPUB, and TXT files are allowed')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorHandler;
