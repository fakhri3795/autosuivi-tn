/**
 * IMaintenanceRepository - Domain-layer contract for maintenance operations.
 */

import { MaintenanceRecord } from '../entities/Maintenance';

export interface IMaintenanceRepository {
  /** Fetch all maintenance records for a vehicle */
  getByVehicle(vehicleId: string): Promise<MaintenanceRecord[]>;

  /** Add a new maintenance record */
  add(record: Omit<MaintenanceRecord, 'createdAt'>): Promise<MaintenanceRecord>;

  /** Update an existing maintenance record */
  update(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord>;

  /** Delete a maintenance record */
  delete(id: string): Promise<void>;
}
