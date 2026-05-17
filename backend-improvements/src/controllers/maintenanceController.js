const db = require('../config/db');
const logger = require('../utils/logger');

exports.getMaintenanceByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      'SELECT * FROM maintenance_records WHERE vehicle_id = ? ORDER BY date DESC LIMIT ? OFFSET ?',
      [vehicleId, limit, offset]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM maintenance_records WHERE vehicle_id = ?',
      [vehicleId]
    );

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    logger.error(`getMaintenanceByVehicle error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.addMaintenance = async (req, res) => {
  const { id, vehicle_id, type, date, mileage, cost, notes } = req.body;
  try {
    await db.query(
      'INSERT INTO maintenance_records (id, vehicle_id, type, date, mileage, cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, vehicle_id, type, date, mileage, cost || null, notes || null]
    );
    const [rows] = await db.query('SELECT * FROM maintenance_records WHERE id = ?', [id]);
    logger.info(`Maintenance record created: ${id} for vehicle ${vehicle_id}`);
    res.status(201).json({ message: 'Entretien ajouté', record: rows[0] });
  } catch (error) {
    logger.error(`addMaintenance error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  try {
    const setClauses = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (['type', 'date', 'mileage', 'cost', 'notes'].includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
    }
    values.push(id);
    await db.query(`UPDATE maintenance_records SET ${setClauses.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM maintenance_records WHERE id = ?', [id]);
    logger.info(`Maintenance updated: ${id}`);
    res.json({ message: 'Entretien mis à jour', record: rows[0] });
  } catch (error) {
    logger.error(`updateMaintenance error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMaintenance = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM maintenance_records WHERE id = ?', [id]);
    logger.info(`Maintenance deleted: ${id}`);
    res.json({ message: 'Entretien supprimé' });
  } catch (error) {
    logger.error(`deleteMaintenance error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
