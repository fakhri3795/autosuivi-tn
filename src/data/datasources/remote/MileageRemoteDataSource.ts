/**
 * MileageRemoteDataSource
 *
 * Handles all HTTP requests related to mileage readings against the backend API.
 */

import apiClient from '../../../core/network/ApiClient';
import { MileageReading, MileageStats } from '../../../domain/entities/MileageReading';

export class MileageRemoteDataSource {
  /** POST /api/vehicles/:vehicleId/mileage — Add a new reading */
  async addReading(
    vehicleId: string,
    value: number,
    date: string,
  ): Promise<MileageReading> {
    const response = await apiClient.post(`/vehicles/${vehicleId}/mileage`, {
      value,
      date,
    });
    const data = response.data;
    return data.reading ?? data.data ?? data;
  }

  /** GET /api/vehicles/:vehicleId/mileage — Get history of readings */
  async getHistory(vehicleId: string): Promise<MileageReading[]> {
    const response = await apiClient.get(`/vehicles/${vehicleId}/mileage`);
    const data = response.data;
    return Array.isArray(data) ? data : (data.readings ?? data.data ?? []);
  }

  /** GET /api/vehicles/:vehicleId/mileage/stats — Get computed stats */
  async getStats(vehicleId: string): Promise<MileageStats> {
    try {
      const response = await apiClient.get(`/vehicles/${vehicleId}/mileage/stats`);
      const data = response.data;
      return data.stats ?? data.data ?? data;
    } catch {
      // If the stats endpoint doesn't exist, calculate locally from history
      const readings = await this.getHistory(vehicleId);
      return this.calculateStatsLocally(readings);
    }
  }

  /** Fallback: compute stats from readings on the client side */
  private calculateStatsLocally(readings: MileageReading[]): MileageStats {
    if (!readings?.length) {
      return { currentMileage: 0, avgKmPerDay: 0, totalReadings: 0, lastUpdate: null };
    }

    const sorted = [...readings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const latest = sorted[0];
    const oldest = sorted[sorted.length - 1];

    const daysDiff = Math.max(
      1,
      Math.ceil(
        (new Date(latest.date).getTime() - new Date(oldest.date).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const kmDiff = latest.value - oldest.value;

    return {
      currentMileage: latest.value,
      avgKmPerDay: Math.round((kmDiff / daysDiff) * 10) / 10,
      totalReadings: readings.length,
      lastUpdate: latest.date,
    };
  }
}
