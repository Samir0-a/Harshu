'use strict';

const express = require('express');
const router = express.Router();
const { getPortfolio, updatePortfolio } = require('../controllers/portfolioController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/portfolio', getPortfolio);
router.get('/admin/portfolio', requireAuth, getPortfolio);
router.put('/admin/portfolio', requireAuth, updatePortfolio);

module.exports = router;
