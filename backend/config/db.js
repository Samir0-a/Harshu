'use strict';

const mongoose = require('mongoose');

let isConnected = false;
let fallbackMode = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://samirsatgauwa00_db_user:<db_password>@cluster0.rmm12y0.mongodb.net/?appName=Cluster0';
  
  try {
    const db = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState === 1;
    fallbackMode = false;
    console.log(`[MongoDB] Connected successfully to: ${db.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB (${error.message}). Running in hybrid/fallback mode with initial dataset.`);
    isConnected = false;
    fallbackMode = true;
  }
};

const getDBStatus = () => ({ isConnected, fallbackMode });

module.exports = { connectDB, getDBStatus };
