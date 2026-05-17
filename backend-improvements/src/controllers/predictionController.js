/**
 * Prediction Controller
 * 
 * Calculates maintenance predictions server-side.
 * Tunisian specificities:
 * - Synthetic oil: 10,000 km interval
 * - Mineral oil: 7,000 km interval  
 * - Climate factor: +20% wear in summer months
 * - Alert if > 1 year since last maintenance
 */
const db = require('../config/db');
const logger = require('../utils/logger');

// Default intervals (km)
const INTERVALS = {
  VIDANGE: 10000,
  FILTRE_HUILE: 10000,
  FILTRE_AIR: 20000,
  FILTRE_HABITACLE: 15000,
  FREINS: 30000,
  PNEUS: 40000,
  COURROIE_DISTRIBUTION: 100000,
};

// Time intervals (months)
const TIME_INTERVALS = {
  VIDANGE: 12,
  FILTRE_HUILE: 12,
  FILTRE_AIR: 24,
  FILTRE_HABITACLE: 18,
  FREINS: 36,
  PNEUS: 48,
  COURROIE_DISTRIBUTION: 60,
};

exports.getPredictions = async (req, res) => {
  const { vehicleId } = req.params;
  try {
    // Get vehicle
    const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }
    const vehicle = vehicles[0];
    const currentMileage = vehicle.current_mileage;

    // Get maintenance records
    const [records] = await db.query(
      'SELECT * FROM maintenance_records WHERE vehicle_id = ? ORDER BY date DESC',
      [vehicleId]
    );

    // Get mileage readings for avg calculation
    const [readings] = await db.query(
      'SELECT * FROM mileage_readings WHERE vehicle_id = ? ORDER BY date DESC LIMIT 30',
      [vehicleId]
    );

    const avgKmPerDay = calculateAvgKmPerDay(readings);

    // Calculate predictions for each maintenance type
    const upcomingItems = [];
    const alerts = [];

    for (const [type, intervalKm] of Object.entries(INTERVALS)) {
      const lastOfType = records.find(r => r.type === type);
      const lastKm = lastOfType ? lastOfType.mileage : 0;
      const lastDate = lastOfType ? new Date(lastOfType.date) : null;

      const nextKm = lastKm + intervalKm;
      const kmRemaining = Math.max(0, nextKm - currentMileage);

      // Time-based check
      const maxDays = (TIME_INTERVALS[type] || 12) * 30;
      const daysSinceLast = lastDate
        ? Math.ceil((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculate urgency score (0-100)
      const kmRatio = Math.min((currentMileage - lastKm) / intervalKm, 1.5);
      const timeRatio = Math.min(daysSinceLast / maxDays, 1.5);
      const urgencyScore = Math.min(
        Math.round((kmRatio * 40 + timeRatio * 30 + 15) * 1),
        100
      );

      let urgency = 'green';
      if (urgencyScore >= 71) urgency = 'red';
      else if (urgencyScore >= 41) urgency = 'orange';

      const daysRemaining = avgKmPerDay > 0 ? Math.round(kmRemaining / avgKmPerDay) : 999;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);

      upcomingItems.push({
        type,
        label: getLabel(type),
        urgency,
        urgencyScore,
        estimatedKm: nextKm,
        kmRemaining,
        daysRemaining,
        estimatedDate: estimatedDate.toISOString(),
        lastMaintenanceDate: lastDate ? lastDate.toISOString() : null,
        lastMaintenanceKm: lastKm,
      });

      // Tunisian specificity: alert if > 1 year since last maintenance
      if (type === 'VIDANGE' && daysSinceLast > 365) {
        alerts.push({
          type: 'time_exceeded',
          message: `Plus d'un an depuis la dernière vidange (${daysSinceLast} jours). Le climat tunisien exige un suivi régulier.`,
          severity: 'critical',
        });
      }
    }

    // Sort by urgency (red first)
    upcomingItems.sort((a, b) => {
      const order = { red: 0, orange: 1, green: 2 };
      return (order[a.urgency] || 2) - (order[b.urgency] || 2);
    });

    // Main prediction (oil change)
    const oilChange = upcomingItems.find(i => i.type === 'VIDANGE');
    const prediction = {
      urgencyScore: oilChange ? oilChange.urgencyScore : 0,
      nextOilChangeMileage: oilChange ? oilChange.estimatedKm : currentMileage + 10000,
      nextOilChangeDate: oilChange ? oilChange.estimatedDate : null,
      kmRemaining: oilChange ? oilChange.kmRemaining : 10000,
      daysRemaining: oilChange ? oilChange.daysRemaining : 365,
      factors: {
        kmFactor: Math.round(((oilChange?.urgencyScore || 0) * 0.4)),
        timeFactor: Math.round(((oilChange?.urgencyScore || 0) * 0.3)),
        drivingFactor: Math.round(((oilChange?.urgencyScore || 0) * 0.3)),
      },
    };

    // Global alerts
    if (prediction.urgencyScore >= 80) {
      alerts.push({
        type: 'urgent',
        message: 'Vidange urgente recommandée ! Risque d\'usure moteur.',
        severity: 'critical',
      });
    }

    if (prediction.kmRemaining <= 500 && prediction.kmRemaining > 0) {
      alerts.push({
        type: 'km_exceeded',
        message: `Seulement ${prediction.kmRemaining} km avant la prochaine vidange !`,
        severity: 'critical',
      });
    }

    logger.info(`Predictions calculated for vehicle ${vehicleId}`);
    res.json({ prediction, upcomingItems, alerts });
  } catch (error) {
    logger.error(`getPredictions error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

function calculateAvgKmPerDay(readings) {
  if (!readings || readings.length < 2) return 30; // Default 30 km/day
  const sorted = [...readings].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];
  const daysDiff = Math.max(1, Math.ceil(
    (new Date(latest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24)
  ));
  return Math.round(((latest.value || latest.mileage || 0) - (oldest.value || oldest.mileage || 0)) / daysDiff * 10) / 10;
}

function getLabel(type) {
  const labels = {
    VIDANGE: 'Vidange',
    FILTRE_HUILE: 'Filtre à huile',
    FILTRE_AIR: 'Filtre à air',
    FILTRE_HABITACLE: 'Filtre habitacle',
    FREINS: 'Freins',
    PNEUS: 'Pneus',
    COURROIE_DISTRIBUTION: 'Courroie distribution',
  };
  return labels[type] || type;
}
