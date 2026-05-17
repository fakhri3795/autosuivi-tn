const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { validate, maintenanceSchema } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

// All maintenance routes require authentication
router.use(authenticateToken);

// GET /api/maintenance/:vehicleId - Get all maintenance records for a vehicle
router.get('/:vehicleId', maintenanceController.getMaintenanceByVehicle);

// POST /api/maintenance - Create a new maintenance record
router.post('/', validate(maintenanceSchema), maintenanceController.addMaintenance);

// PUT /api/maintenance/:id - Update a maintenance record
router.put('/:id', maintenanceController.updateMaintenance);

// DELETE /api/maintenance/:id - Delete a maintenance record
router.delete('/:id', maintenanceController.deleteMaintenance);

module.exports = router;
