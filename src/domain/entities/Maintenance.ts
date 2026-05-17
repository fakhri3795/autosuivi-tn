import { MaintenanceType } from '../../core/constants';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  date: string;
  mileage: number;
  cost: number | null;
  notes: string | null;
  createdAt: string;
}

export interface MaintenanceFormData {
  type: MaintenanceType;
  date: string;
  mileage: string;
  cost: string;
  notes: string;
}

export interface MaintenancePrediction {
  urgencyScore: number;
  nextOilChangeMileage: number;
  nextOilChangeDate: string;
  kmRemaining: number;
  daysRemaining: number;
  factors: {
    kmFactor: number;
    timeFactor: number;
    drivingFactor: number;
  };
}

export interface PredictionItem {
  type: MaintenanceType;
  label: string;
  urgency: 'green' | 'orange' | 'red';
  estimatedKm: number;
  estimatedDate: string;
  lastMaintenanceKm?: number;
}
