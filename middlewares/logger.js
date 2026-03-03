/**
 * Logger Middleware
 * Logs HTTP method, URL, and timestamp for every incoming request.
 */
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;

  console.log(`[${timestamp}] ${method} ${url}`);
  next();
};

module.exports = logger;
