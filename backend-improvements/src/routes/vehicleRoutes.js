const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { validate, vehicleSchema } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

// All vehicle routes require authentication
router.use(authenticateToken);

// GET /api/vehicles - Get all vehicles for the authenticated user (from JWT)
router.get('/', vehicleController.getVehicles);

// GET /api/vehicles/:id - Get a single vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// POST /api/vehicles - Create a new vehicle
router.post('/', validate(vehicleSchema), vehicleController.addVehicle);

// PUT /api/vehicles/:id - Update a vehicle
router.put('/:id', vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Delete a vehicle
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
