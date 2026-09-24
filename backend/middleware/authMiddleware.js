'use strict';

const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'finance_portfolio_jwt_secret_key_2026';

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. Authentication token missing.' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
  }
};

module.exports = { requireAuth, getJwtSecret };
