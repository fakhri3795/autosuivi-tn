/**
 * MaintenanceRemoteDataSource
 *
 * Handles HTTP requests related to maintenance records.
 * Backend endpoints:
 *   GET  /api/maintenance/:vehicleId  → list records
 *   POST /api/maintenance             → create record
 *   PUT  /api/maintenance/:id         → update record
 *   DELETE /api/maintenance/:id       → delete record
 */

import apiClient from '../../../core/network/ApiClient';
import { MaintenanceRecord } from '../../../domain/entities/Maintenance';

export class MaintenanceRemoteDataSource {
  private readonly basePath = '/maintenance';

  /** GET /api/maintenance/:vehicleId — Fetch all records for a vehicle */
  async getByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    const response = await apiClient.get(`${this.basePath}/${vehicleId}`);
    const data = response.data;
    return Array.isArray(data) ? data : (data.records ?? data.data ?? []);
  }

  /** POST /api/maintenance — Create a new maintenance record */
  async add(record: Omit<MaintenanceRecord, 'createdAt'>): Promise<MaintenanceRecord> {
    const response = await apiClient.post(this.basePath, record);
    const data = response.data;
    return data.record ?? data.data ?? data;
  }

  /** PUT /api/maintenance/:id — Update an existing record */
  async update(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const response = await apiClient.put(`${this.basePath}/${id}`, data);
    const result = response.data;
    return result.record ?? result.data ?? result;
  }

  /** DELETE /api/maintenance/:id — Delete a record */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}
