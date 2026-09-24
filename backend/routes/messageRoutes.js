'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createMessage, getMessages, updateMessageRead, deleteMessage } = require('../controllers/messageController');
const { requireAuth } = require('../middleware/authMiddleware');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many contact submissions. Please try again later.' }
});

router.post('/contact', contactLimiter, createMessage);
router.get('/admin/messages', requireAuth, getMessages);
router.patch('/admin/messages/:id', requireAuth, updateMessageRead);
router.delete('/admin/messages/:id', requireAuth, deleteMessage);

module.exports = router;
