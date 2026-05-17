/**
 * IDeadlineRepository - Domain-layer contract for deadline operations.
 */

import { Deadline } from '../entities/Deadline';

export interface IDeadlineRepository {
  /** Fetch all deadlines for a vehicle */
  getByVehicle(vehicleId: string): Promise<Deadline[]>;

  /** Create or update a deadline (upsert) */
  upsert(deadline: Pick<Deadline, 'id' | 'vehicleId' | 'type' | 'expiryDate'>): Promise<Deadline>;

  /** Delete a deadline */
  delete(id: string): Promise<void>;
}
