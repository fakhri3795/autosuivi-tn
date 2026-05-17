/**
 * IVehicleRepository - Domain-layer contract for vehicle operations.
 *
 * Implementations may use a remote API, local cache, or mock data.
 * The presentation layer depends ONLY on this interface, never on concrete classes.
 */

import { Vehicle } from '../entities/Vehicle';

export interface IVehicleRepository {
  /** Fetch all vehicles belonging to the authenticated user */
  getAll(): Promise<Vehicle[]>;

  /** Fetch a single vehicle by ID */
  getById(id: string): Promise<Vehicle>;

  /** Create a new vehicle and return the server-created entity */
  create(data: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Vehicle>;

  /** Update an existing vehicle (partial update supported) */
  update(id: string, data: Partial<Vehicle>): Promise<Vehicle>;

  /** Delete a vehicle by ID */
  delete(id: string): Promise<void>;

  /** Set a vehicle as the active one (local or server-side) */
  setActive(id: string): Promise<void>;
}
