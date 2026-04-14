const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Security packages
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Import middleware
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const resourceRoutes = require('./routes/resourceRoutes');
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes');

// ---------------------
// .env Validation — crash early if critical vars are missing
// ---------------------
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('   Create a .env file with these values before starting the server.');
  process.exit(1);
}

// Initialize Express app
const app = express();

// ---------------------
// Configuration
// ---------------------
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/developer-resource-manager';

// ---------------------
// Security Middleware
// ---------------------

// Helmet — sets secure HTTP headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// CORS — configure allowed origins
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Prevent NoSQL injection — sanitizes req.body, req.query, req.params
app.use(mongoSanitize());

// Rate limiting for auth endpoints (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attempts. Please try again after 15 minutes.',
  },
});

// ---------------------
// General Middleware
// ---------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(logger);

// ---------------------
// Routes
// ---------------------

// API Routes
app.use('/api/resources', resourceRoutes);
app.use('/api/audit-log', auditRoutes);
if (process.env.NODE_ENV === 'test') {
  app.use('/api/auth', authRoutes);
} else {
  app.use('/api/auth', authLimiter, authRoutes);
}

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Centralized error handler
app.use(errorHandler);

// ---------------------
// Database Connection & Server Start
// ---------------------
// Skip auto-connect and listen when imported by tests
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB successfully');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.warn('⚠️  Server running without database — frontend only');
    });

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Kill the other process or use a different port.`);
      process.exit(1);
    }
    throw err;
  });
}

module.exports = app;
