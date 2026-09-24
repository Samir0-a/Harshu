'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { login, changePassword } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/login', loginLimiter, login);
router.post('/admin/password', requireAuth, loginLimiter, changePassword);

// Photo upload endpoint (returns base64 Data URI or uploaded URL)
router.post('/admin/upload/photo', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  const mimeType = req.file.mimetype;
  const base64 = req.file.buffer.toString('base64');
  const url = `data:${mimeType};base64,${base64}`;
  res.json({ url });
});

module.exports = router;
