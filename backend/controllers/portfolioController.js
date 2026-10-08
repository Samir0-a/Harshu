'use strict';

const Portfolio = require('../models/Portfolio');
const { DEFAULT_PORTFOLIO } = require('../seedData');
const { getDBStatus } = require('../config/db');

// In-memory cache & fallback store when DB is disconnected
let memoryPortfolio = { ...DEFAULT_PORTFOLIO };

const getPortfolio = async (req, res, next) => {
  try {
    const { isConnected } = getDBStatus();
    if (!isConnected) {
      return res.json(memoryPortfolio);
    }

    let doc = await Portfolio.findOne();
    if (!doc) {
      doc = await Portfolio.create(DEFAULT_PORTFOLIO);
    }
    res.json(doc);
  } catch (error) {
    console.error('Error in getPortfolio:', error);
    res.json(memoryPortfolio);
  }
};

const updatePortfolio = async (req, res, next) => {
  try {
    const data = req.body;
    const { isConnected } = getDBStatus();

    if (!isConnected) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: 'MongoDB is not connected. Portfolio changes cannot be saved. Set MONGODB_URI in Vercel and redeploy.'
        });
      }

      memoryPortfolio = { ...memoryPortfolio, ...data };
      return res.json(memoryPortfolio);
    }

    let doc = await Portfolio.findOne();
    if (!doc) {
      doc = new Portfolio(data);
    } else {
      Object.assign(doc, data);
    }
    await doc.save();
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPortfolio, updatePortfolio };
