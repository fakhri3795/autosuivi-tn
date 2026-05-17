/**
 * VehicleRepositoryImpl
 *
 * Concrete implementation of IVehicleRepository.
 * Delegates network calls to VehicleRemoteDataSource.
 * Manages local "active vehicle" state via AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle } from '../../domain/entities/Vehicle';
import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository';
import { VehicleRemoteDataSource } from '../datasources/remote/VehicleRemoteDataSource';

const ACTIVE_VEHICLE_KEY = 'autosuivi_active_vehicle_id';

export class VehicleRepositoryImpl implements IVehicleRepository {
  private remoteDataSource: VehicleRemoteDataSource;

  constructor(remoteDataSource?: VehicleRemoteDataSource) {
    this.remoteDataSource = remoteDataSource ?? new VehicleRemoteDataSource();
  }

  async getAll(): Promise<Vehicle[]> {
    const vehicles = await this.remoteDataSource.getAll();

    // Restore local "active" flag — the backend may not track this
    const activeId = await AsyncStorage.getItem(ACTIVE_VEHICLE_KEY);
    if (activeId) {
      return vehicles.map((v) => ({ ...v, isActive: v.id === activeId }));
    }
    // Default: first vehicle is active
    if (vehicles.length > 0) {
      await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, vehicles[0].id);
      return vehicles.map((v, i) => ({ ...v, isActive: i === 0 }));
    }
    return vehicles;
  }

  async getById(id: string): Promise<Vehicle> {
    return this.remoteDataSource.getById(id);
  }

  async create(
    data: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>,
  ): Promise<Vehicle> {
    const vehicle = await this.remoteDataSource.create(data);
    // If it's the user's first vehicle, make it active
    const vehicles = await this.remoteDataSource.getAll();
    if (vehicles.length === 1) {
      await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, vehicle.id);
      return { ...vehicle, isActive: true };
    }
    return { ...vehicle, isActive: false };
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.remoteDataSource.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.remoteDataSource.delete(id);
    // If the deleted vehicle was the active one, clear or reassign
    const activeId = await AsyncStorage.getItem(ACTIVE_VEHICLE_KEY);
    if (activeId === id) {
      await AsyncStorage.removeItem(ACTIVE_VEHICLE_KEY);
    }
  }

  async setActive(id: string): Promise<void> {
    await AsyncStorage.setItem(ACTIVE_VEHICLE_KEY, id);
  }
}
