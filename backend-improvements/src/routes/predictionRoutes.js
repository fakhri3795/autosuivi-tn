const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { authenticateToken } = require('../middleware/auth');

// All prediction routes require authentication
router.use(authenticateToken);

// GET /api/predictions/:vehicleId - Get maintenance predictions
router.get('/:vehicleId', predictionController.getPredictions);

module.exports = router;
