'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { getDBStatus } = require('../config/db');

let memoryAdminHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 12);

const ensureAdmin = async () => {
  const { isConnected } = getDBStatus();
  if (!isConnected) return memoryAdminHash;

  let admin = await Admin.findOne({ username: 'admin' });
  if (!admin) {
    const initialPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    admin = await Admin.create({ username: 'admin', passwordHash });
  }
  return admin.passwordHash;
};

const login = async (req, res, next) => {
  try {
    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const passwordHash = await ensureAdmin();
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const secret = getJwtSecret();
    const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' });

    res.json({ ok: true, token });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current, next: newPassword } = req.body || {};
    const { isConnected } = getDBStatus();

    const passwordHash = await ensureAdmin();
    const isValid = await bcrypt.compare(String(current || ''), passwordHash);

    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    if (!isConnected) {
      memoryAdminHash = newHash;
    } else {
      await Admin.updateOne({ username: 'admin' }, { passwordHash: newHash }, { upsert: true });
    }

    res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, changePassword };
