const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import middleware
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const resourceRoutes = require('./routes/resourceRoutes');

// Initialize Express app
const app = express();

// ---------------------
// Configuration
// ---------------------
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/developer-resource-manager';

// ---------------------
// Middleware
// ---------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(logger);

// ---------------------
// Routes
// ---------------------

// API Routes
app.use('/api/resources', resourceRoutes);

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
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️  Server running without database — frontend only');
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
