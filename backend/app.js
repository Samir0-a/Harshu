'use strict';

const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();

// Enable Trust Proxy for rate-limiting on cloud providers (Vercel/Heroku/Render)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api', require('./routes/portfolioRoutes'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api', require('./routes/messageRoutes'));

// Serve Static Frontend Assets in Production / Local Build
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// SPA fallback for non-API client side routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend asset not found. Please run "npm run build" to build the React application.');
    }
  });
});

// Global Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'An unexpected server error occurred.' });
});

module.exports = app;
