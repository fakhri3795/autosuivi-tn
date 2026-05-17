/**
 * MileageRepositoryImpl
 *
 * Concrete implementation of IMileageRepository.
 * Delegates network calls to MileageRemoteDataSource.
 */

import { MileageReading, MileageStats } from '../../domain/entities/MileageReading';
import { IMileageRepository } from '../../domain/repositories/IMileageRepository';
import { MileageRemoteDataSource } from '../datasources/remote/MileageRemoteDataSource';

export class MileageRepositoryImpl implements IMileageRepository {
  private remoteDataSource: MileageRemoteDataSource;

  constructor(remoteDataSource?: MileageRemoteDataSource) {
    this.remoteDataSource = remoteDataSource ?? new MileageRemoteDataSource();
  }

  async addReading(
    vehicleId: string,
    value: number,
    date: string,
  ): Promise<MileageReading> {
    return this.remoteDataSource.addReading(vehicleId, value, date);
  }

  async getHistory(vehicleId: string): Promise<MileageReading[]> {
    return this.remoteDataSource.getHistory(vehicleId);
  }

  async getStats(vehicleId: string): Promise<MileageStats> {
    return this.remoteDataSource.getStats(vehicleId);
  }
}
