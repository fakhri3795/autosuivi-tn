const db = require('../config/db');
const logger = require('../utils/logger');

exports.getVehicles = async (req, res) => {
  try {
    // Get userId from JWT token (set by authenticateToken middleware)
    const userId = req.user?.id || req.params.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const [rows] = await db.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    logger.error(`getVehicles error: ${error.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des véhicules' });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    logger.error(`getVehicleById error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.addVehicle = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const { id, brand, model, year, plate, initial_mileage, current_mileage } = req.body;
    
    // Generate UUID server-side if not provided by client
    const vehicleId = id || require('uuid').v4();
    const mileage = current_mileage || initial_mileage || 0;

    await db.query(
      `INSERT INTO vehicles (id, user_id, brand, model, year, plate, initial_mileage, current_mileage, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [vehicleId, userId, brand, model, year, plate, initial_mileage, mileage]
    );

    const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    logger.info(`Vehicle added: ${vehicleId} by user ${userId}`);
    res.status(201).json({ message: 'Véhicule ajouté', vehicle: rows[0] });
  } catch (error) {
    logger.error(`addVehicle error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    const fields = req.body;
    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (key === 'id') continue; // Don't update ID
      setClauses.push(`${key} = ?`);
      values.push(value);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    values.push(id);
    await db.query(`UPDATE vehicles SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    logger.info(`Vehicle updated: ${id}`);
    res.json({ message: 'Véhicule mis à jour', vehicle: rows[0] });
  } catch (error) {
    logger.error(`updateVehicle error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM maintenance_records WHERE vehicle_id = ?', [id]);
    await db.query('DELETE FROM deadlines WHERE vehicle_id = ?', [id]);
    await db.query('DELETE FROM mileage_readings WHERE vehicle_id = ?', [id]);
    await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
    logger.info(`Vehicle deleted: ${id}`);
    res.json({ message: 'Véhicule supprimé' });
  } catch (error) {
    logger.error(`deleteVehicle error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
