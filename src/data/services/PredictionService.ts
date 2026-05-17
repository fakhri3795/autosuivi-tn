/**
 * PredictionService
 *
 * Calls the backend prediction endpoint and falls back to local calculation.
 * Backend: GET /api/vehicles/:id/predictions
 *
 * Tunisian specificity:
 * - Oil change every 10,000 km (synthetic) or 7,000 km (mineral)
 * - Alert if > 1 year since last maintenance
 * - Dusty conditions → shorter air filter intervals
 */

import apiClient from '../../core/network/ApiClient';
import { MaintenanceRecord, MaintenancePrediction, PredictionItem } from '../../domain/entities/Maintenance';
import { MileageStats } from '../../domain/entities/MileageReading';
import {
  getFullPrediction,
  getUpcomingMaintenanceItems,
  DrivingType,
  CustomIntervals,
} from './KmCalculator';

export interface PredictionResponse {
  prediction: MaintenancePrediction;
  upcomingItems: PredictionItem[];
  alerts: PredictionAlert[];
}

export interface PredictionAlert {
  type: 'time_exceeded' | 'km_exceeded' | 'urgent';
  message: string;
  severity: 'warning' | 'critical';
}

export class PredictionService {
  /**
   * Fetch predictions from the backend.
   * Falls back to local calculation if the endpoint is not available.
   */
  async getPredictions(
    vehicleId: string,
    maintenanceRecords: MaintenanceRecord[],
    currentMileage: number,
    stats: MileageStats,
    drivingType: DrivingType = 'mixte',
    customIntervals?: CustomIntervals,
  ): Promise<PredictionResponse> {
    try {
      const response = await apiClient.get(`/vehicles/${vehicleId}/predictions`);
      const data = response.data;
      return {
        prediction: data.prediction ?? data,
        upcomingItems: data.upcomingItems ?? [],
        alerts: data.alerts ?? [],
      };
    } catch {
      // Backend endpoint not available — compute locally
      return this.computeLocally(
        maintenanceRecords,
        currentMileage,
        stats,
        drivingType,
        customIntervals,
      );
    }
  }

  /** Local prediction computation (fallback) */
  computeLocally(
    maintenanceRecords: MaintenanceRecord[],
    currentMileage: number,
    stats: MileageStats,
    drivingType: DrivingType = 'mixte',
    customIntervals?: CustomIntervals,
  ): PredictionResponse {
    const prediction = getFullPrediction(
      maintenanceRecords,
      currentMileage,
      stats,
      drivingType,
      customIntervals,
    );

    const upcomingItems = getUpcomingMaintenanceItems(
      maintenanceRecords,
      currentMileage,
      stats,
      drivingType,
      customIntervals,
    );

    // Generate Tunisian-specific alerts
    const alerts = this.generateAlerts(maintenanceRecords, prediction);

    return { prediction, upcomingItems, alerts };
  }

  /** Generate alerts based on Tunisian maintenance patterns */
  private generateAlerts(
    records: MaintenanceRecord[],
    prediction: MaintenancePrediction,
  ): PredictionAlert[] {
    const alerts: PredictionAlert[] = [];

    // Alert: > 1 year since any maintenance (Tunisian specificity)
    if (records.length > 0) {
      const latestRecord = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0];
      const daysSinceLast = Math.ceil(
        (Date.now() - new Date(latestRecord.date).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLast > 365) {
        alerts.push({
          type: 'time_exceeded',
          message: `Plus d'un an depuis le dernier entretien (${daysSinceLast} jours). En Tunisie, le climat chaud exige un suivi régulier.`,
          severity: 'critical',
        });
      }
    }

    // Alert: urgency score high
    if (prediction.urgencyScore >= 80) {
      alerts.push({
        type: 'urgent',
        message: 'Vidange urgente recommandée ! Risque d\'usure moteur.',
        severity: 'critical',
      });
    } else if (prediction.urgencyScore >= 60) {
      alerts.push({
        type: 'km_exceeded',
        message: 'Vidange à planifier prochainement.',
        severity: 'warning',
      });
    }

    // Alert: km remaining very low
    if (prediction.kmRemaining <= 500 && prediction.kmRemaining > 0) {
      alerts.push({
        type: 'km_exceeded',
        message: `Seulement ${prediction.kmRemaining} km avant la prochaine vidange !`,
        severity: 'critical',
      });
    }

    return alerts;
  }
}
