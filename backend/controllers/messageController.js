'use strict';

const crypto = require('crypto');
const Message = require('../models/Message');
const { getDBStatus } = require('../config/db');

let memoryMessages = [];

const createMessage = async (req, res, next) => {
  try {
    const { name, email, message, website } = req.body || {};
    
    // Honeypot check for spam bots
    if (website) return res.json({ ok: true });

    const cleanName = (typeof name === 'string' ? name.trim() : '').slice(0, 100);
    const cleanEmail = (typeof email === 'string' ? email.trim() : '').slice(0, 150);
    const cleanMsg = (typeof message === 'string' ? message.trim() : '').slice(0, 3000);

    if (!cleanName || !cleanMsg) {
      return res.status(400).json({ error: 'Please enter your name and a message.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const newMessage = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      message: cleanMsg,
      date: new Date(),
      read: false
    };

    const { isConnected } = getDBStatus();
    if (!isConnected) {
      memoryMessages.unshift(newMessage);
      if (memoryMessages.length > 500) memoryMessages = memoryMessages.slice(0, 500);
    } else {
      await Message.create(newMessage);
    }

    res.json({ ok: true, message: 'Your message has been sent successfully!' });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { isConnected } = getDBStatus();
    if (!isConnected) {
      return res.json(memoryMessages);
    }

    const messages = await Message.find().sort({ createdAt: -1 }).limit(500);
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const updateMessageRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { read } = req.body || {};
    const { isConnected } = getDBStatus();

    if (!isConnected) {
      const msg = memoryMessages.find(m => m.id === id);
      if (!msg) return res.status(404).json({ error: 'Message not found.' });
      msg.read = read !== false;
      return res.json(msg);
    }

    const updated = await Message.findOneAndUpdate(
      { id },
      { read: read !== false },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Message not found.' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isConnected } = getDBStatus();

    if (!isConnected) {
      memoryMessages = memoryMessages.filter(m => m.id !== id);
      return res.json({ ok: true });
    }

    await Message.deleteOne({ id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMessage, getMessages, updateMessageRead, deleteMessage };
