/**
 * DeadlineRepositoryImpl
 *
 * Concrete implementation of IDeadlineRepository.
 * Delegates network calls to DeadlineRemoteDataSource.
 */

import { Deadline } from '../../domain/entities/Deadline';
import { IDeadlineRepository } from '../../domain/repositories/IDeadlineRepository';
import { DeadlineRemoteDataSource } from '../datasources/remote/DeadlineRemoteDataSource';

export class DeadlineRepositoryImpl implements IDeadlineRepository {
  private remoteDataSource: DeadlineRemoteDataSource;

  constructor(remoteDataSource?: DeadlineRemoteDataSource) {
    this.remoteDataSource = remoteDataSource ?? new DeadlineRemoteDataSource();
  }

  async getByVehicle(vehicleId: string): Promise<Deadline[]> {
    return this.remoteDataSource.getByVehicle(vehicleId);
  }

  async upsert(
    deadline: Pick<Deadline, 'id' | 'vehicleId' | 'type' | 'expiryDate'>,
  ): Promise<Deadline> {
    return this.remoteDataSource.upsert(deadline);
  }

  async delete(id: string): Promise<void> {
    return this.remoteDataSource.delete(id);
  }
}
