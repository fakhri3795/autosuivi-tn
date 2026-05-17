/**
 * MaintenanceRepositoryImpl
 *
 * Concrete implementation of IMaintenanceRepository.
 * Delegates network calls to MaintenanceRemoteDataSource.
 */

import { MaintenanceRecord } from '../../domain/entities/Maintenance';
import { IMaintenanceRepository } from '../../domain/repositories/IMaintenanceRepository';
import { MaintenanceRemoteDataSource } from '../datasources/remote/MaintenanceRemoteDataSource';

export class MaintenanceRepositoryImpl implements IMaintenanceRepository {
  private remoteDataSource: MaintenanceRemoteDataSource;

  constructor(remoteDataSource?: MaintenanceRemoteDataSource) {
    this.remoteDataSource = remoteDataSource ?? new MaintenanceRemoteDataSource();
  }

  async getByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return this.remoteDataSource.getByVehicle(vehicleId);
  }

  async add(record: Omit<MaintenanceRecord, 'createdAt'>): Promise<MaintenanceRecord> {
    return this.remoteDataSource.add(record);
  }

  async update(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    return this.remoteDataSource.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.remoteDataSource.delete(id);
  }
}
