/**
 * VehicleRemoteDataSource
 *
 * Handles all HTTP requests related to vehicles against the backend API.
 * Responses are automatically mapped from snake_case to camelCase by the ApiClient interceptor.
 */

import apiClient from '../../../core/network/ApiClient';
import { Vehicle } from '../../../domain/entities/Vehicle';

const generateUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export class VehicleRemoteDataSource {
  private readonly basePath = '/vehicles';

  /** GET /api/vehicles — Fetch all vehicles for the authenticated user */
  async getAll(): Promise<Vehicle[]> {
    const response = await apiClient.get(this.basePath);
    // Backend may return { vehicles: [...] } or [...] directly
    const data = response.data;
    return Array.isArray(data) ? data : (data.vehicles ?? data.data ?? []);
  }

  /** GET /api/vehicles/:id — Fetch a single vehicle */
  async getById(id: string): Promise<Vehicle> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    const data = response.data;
    return data.vehicle ?? data.data ?? data;
  }

  /** POST /api/vehicles — Create a new vehicle.
   *  The backend expects an `id` field — we generate a UUID client-side. */
  async create(
    vehicleData: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>,
  ): Promise<Vehicle> {
    const payload = { id: generateUUID(), ...vehicleData };
    const response = await apiClient.post(this.basePath, payload);
    const data = response.data;
    return data.vehicle ?? data.data ?? data;
  }

  /** PUT /api/vehicles/:id — Update an existing vehicle */
  async update(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const response = await apiClient.put(`${this.basePath}/${id}`, vehicleData);
    const data = response.data;
    return data.vehicle ?? data.data ?? data;
  }

  /** DELETE /api/vehicles/:id — Delete a vehicle */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}
