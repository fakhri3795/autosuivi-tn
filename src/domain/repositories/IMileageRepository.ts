/**
 * IMileageRepository - Domain-layer contract for mileage/kilométrage operations.
 */

import { MileageReading, MileageStats } from '../entities/MileageReading';

export interface IMileageRepository {
  /** Add a new mileage reading for a vehicle */
  addReading(vehicleId: string, value: number, date: string): Promise<MileageReading>;

  /** Get the full mileage history for a vehicle */
  getHistory(vehicleId: string): Promise<MileageReading[]>;

  /** Get computed mileage statistics for a vehicle */
  getStats(vehicleId: string): Promise<MileageStats>;
}
