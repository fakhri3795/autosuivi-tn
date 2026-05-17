const db = require('../config/db');
const logger = require('../utils/logger');

exports.getDeadlines = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *, DATEDIFF(expiry_date, NOW()) as days_remaining 
       FROM deadlines 
       WHERE vehicle_id = ?
       ORDER BY expiry_date ASC`,
      [req.params.vehicleId]
    );
    res.json(rows);
  } catch (error) {
    logger.error(`getDeadlines error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateDeadline = async (req, res) => {
  const { id, vehicle_id, type, expiry_date } = req.body;
  try {
    await db.query(
      `INSERT INTO deadlines (id, vehicle_id, type, expiry_date) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE expiry_date = VALUES(expiry_date), updated_at = NOW()`,
      [id, vehicle_id, type, expiry_date]
    );
    const [rows] = await db.query(
      `SELECT *, DATEDIFF(expiry_date, NOW()) as days_remaining 
       FROM deadlines WHERE id = ? OR (vehicle_id = ? AND type = ?)
       LIMIT 1`,
      [id, vehicle_id, type]
    );
    logger.info(`Deadline upserted: ${type} for vehicle ${vehicle_id}`);
    res.json({ message: 'Échéance mise à jour', deadline: rows[0] });
  } catch (error) {
    logger.error(`updateDeadline error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDeadline = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM deadlines WHERE id = ?', [id]);
    logger.info(`Deadline deleted: ${id}`);
    res.json({ message: 'Échéance supprimée' });
  } catch (error) {
    logger.error(`deleteDeadline error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
