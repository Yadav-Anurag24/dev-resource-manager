const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
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
// View Engine Setup
// ---------------------
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------
// Middleware
// ---------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

// ---------------------
// Routes
// ---------------------

// Home route - redirect to resources
app.get('/', (req, res) => {
  res.redirect('/resources');
});

// Resource routes
app.use('/resources', resourceRoutes);

// 404 handler - for unmatched routes
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 Not Found',
    message: 'The page you are looking for does not exist.',
    statusCode: 404,
  });
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
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
