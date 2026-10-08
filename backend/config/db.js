'use strict';

const mongoose = require('mongoose');

let isConnected = false;
let fallbackMode = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;

  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_portfolio';

  connectionPromise = mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
  }).then((db) => {
    isConnected = db.connections[0].readyState === 1;
    fallbackMode = !isConnected;
    console.log(`[MongoDB] Connected successfully to: ${db.connection.host}`);
  }).catch((error) => {
    isConnected = false;
    fallbackMode = true;
    console.warn(`[MongoDB] Connection failed: ${error.message}`);
    console.warn('[MongoDB] API is using temporary in-memory data. Set MONGODB_URI in .env and restart to persist changes.');
  }).finally(() => {
    connectionPromise = null;
  });

  return connectionPromise;
};

const getDBStatus = () => ({ isConnected, fallbackMode });

module.exports = { connectDB, getDBStatus };
