/**
 * DeadlineRemoteDataSource
 *
 * Handles HTTP requests related to deadlines/échéances.
 * Backend endpoints:
 *   GET  /api/deadlines/:vehicleId  → list deadlines (includes computed daysRemaining)
 *   POST /api/deadlines             → create/update deadline (upsert via ON DUPLICATE KEY)
 *   DELETE /api/deadlines/:id       → delete deadline
 */

import apiClient from '../../../core/network/ApiClient';
import { Deadline } from '../../../domain/entities/Deadline';

export class DeadlineRemoteDataSource {
  private readonly basePath = '/deadlines';

  /** GET /api/deadlines/:vehicleId — Fetch all deadlines for a vehicle */
  async getByVehicle(vehicleId: string): Promise<Deadline[]> {
    const response = await apiClient.get(`${this.basePath}/${vehicleId}`);
    const data = response.data;
    const deadlines = Array.isArray(data) ? data : (data.deadlines ?? data.data ?? []);

    // Compute status client-side (backend gives daysRemaining via SQL)
    return deadlines.map((d: any) => ({
      ...d,
      status: this.computeStatus(d.daysRemaining ?? 0),
    }));
  }

  /** POST /api/deadlines — Create or update a deadline */
  async upsert(
    deadline: Pick<Deadline, 'id' | 'vehicleId' | 'type' | 'expiryDate'>,
  ): Promise<Deadline> {
    const response = await apiClient.post(this.basePath, deadline);
    const data = response.data;
    return data.deadline ?? data.data ?? data;
  }

  /** DELETE /api/deadlines/:id — Delete a deadline */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  private computeStatus(daysRemaining: number): 'valid' | 'expiring_soon' | 'expired' {
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 60) return 'expiring_soon';
    return 'valid';
  }
}
