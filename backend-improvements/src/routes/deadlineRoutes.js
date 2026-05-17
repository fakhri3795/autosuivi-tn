const express = require('express');
const router = express.Router();
const deadlineController = require('../controllers/deadlineController');
const { validate, deadlineSchema } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

// All deadline routes require authentication
router.use(authenticateToken);

// GET /api/deadlines/:vehicleId - Get all deadlines for a vehicle
router.get('/:vehicleId', deadlineController.getDeadlines);

// POST /api/deadlines - Create/update a deadline
router.post('/', validate(deadlineSchema), deadlineController.updateDeadline);

// DELETE /api/deadlines/:id - Delete a deadline
router.delete('/:id', deadlineController.deleteDeadline);

module.exports = router;
