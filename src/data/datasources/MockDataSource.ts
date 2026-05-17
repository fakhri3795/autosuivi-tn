// AutoSuivi TN - Mock Data Source
// This provides mock data for development. Replace with Firebase/API calls later.

import { User } from '../../domain/entities/User';
import { Vehicle } from '../../domain/entities/Vehicle';
import { MileageReading, MileageStats } from '../../domain/entities/MileageReading';
import { MaintenanceRecord } from '../../domain/entities/Maintenance';
import { Deadline } from '../../domain/entities/Deadline';
import { MaintenanceType, DeadlineType } from '../../core/constants';

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock User
export const mockUser: User = {
  id: 'user-001',
  email: 'mohamed@example.tn',
  name: 'Mohamed Ben Ali',
  createdAt: '2024-01-15T10:00:00Z',
};

// Mock Vehicles - Tunisian market popular cars
export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-001',
    userId: 'user-001',
    brand: 'Peugeot',
    model: '208',
    year: 2020,
    plate: '156 TU 7890',
    initialMileage: 15000,
    currentMileage: 47500,
    isActive: true,
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-03-28T14:30:00Z',
  },
  {
    id: 'vehicle-002',
    userId: 'user-001',
    brand: 'Renault',
    model: 'Clio 5',
    year: 2021,
    plate: '198 TU 2345',
    initialMileage: 8000,
    currentMileage: 32000,
    isActive: false,
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-03-15T11:00:00Z',
  },
];

// Generate mileage readings for 3 months
const generateMileageReadings = (vehicleId: string, startKm: number, currentKm: number): MileageReading[] => {
  const readings: MileageReading[] = [];
  const now = new Date();
  const numReadings = 12;
  const kmRange = currentKm - startKm;
  
  for (let i = numReadings; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7)); // Weekly readings
    const progress = (numReadings - i) / numReadings;
    const km = Math.round(startKm + (kmRange * progress));
    const prevKm = i < numReadings ? Math.round(startKm + (kmRange * ((numReadings - i - 1) / numReadings))) : null;
    
    readings.push({
      id: generateUUID(),
      vehicleId,
      value: km,
      date: date.toISOString(),
      delta: prevKm !== null ? km - prevKm : null,
      createdAt: date.toISOString(),
    });
  }
  
  return readings;
};

export const mockMileageReadings: Record<string, MileageReading[]> = {
  'vehicle-001': generateMileageReadings('vehicle-001', 35000, 47500),
  'vehicle-002': generateMileageReadings('vehicle-002', 20000, 32000),
};

// Mock Maintenance Records
export const mockMaintenanceRecords: Record<string, MaintenanceRecord[]> = {
  'vehicle-001': [
    {
      id: generateUUID(),
      vehicleId: 'vehicle-001',
      type: MaintenanceType.VIDANGE,
      date: '2024-01-15T09:00:00Z',
      mileage: 38000,
      cost: 150,
      notes: 'Vidange + filtre huile chez Peugeot Tunis',
      createdAt: '2024-01-15T09:00:00Z',
    },
    {
      id: generateUUID(),
      vehicleId: 'vehicle-001',
      type: MaintenanceType.FILTRE_AIR,
      date: '2024-01-15T09:00:00Z',
      mileage: 38000,
      cost: 45,
      notes: null,
      createdAt: '2024-01-15T09:00:00Z',
    },
    {
      id: generateUUID(),
      vehicleId: 'vehicle-001',
      type: MaintenanceType.PNEUS,
      date: '2023-11-20T10:00:00Z',
      mileage: 32000,
      cost: 680,
      notes: '4 pneus Michelin Energy',
      createdAt: '2023-11-20T10:00:00Z',
    },
  ],
  'vehicle-002': [
    {
      id: generateUUID(),
      vehicleId: 'vehicle-002',
      type: MaintenanceType.VIDANGE,
      date: '2024-02-20T08:00:00Z',
      mileage: 28000,
      cost: 130,
      notes: 'Vidange standard',
      createdAt: '2024-02-20T08:00:00Z',
    },
  ],
};

// Mock Deadlines
const today = new Date();
const addDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const mockDeadlines: Record<string, Deadline[]> = {
  'vehicle-001': [
    {
      id: generateUUID(),
      vehicleId: 'vehicle-001',
      type: DeadlineType.ASSURANCE,
      expiryDate: addDays(45),
      daysRemaining: 45,
      status: 'expiring_soon',
      updatedAt: '2024-03-01T10:00:00Z',
    },
    {
      id: generateUUID(),
      vehicleId: 'vehicle-001',
      type: DeadlineType.VIGNETTE,
      expiryDate: addDays(120),
      daysRemaining: 120,
      status: 'valid',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      id: generateUUID(),
      vehicleId: 'vehicle-001',
      type: DeadlineType.VISITE_TECHNIQUE,
      expiryDate: addDays(15),
      daysRemaining: 15,
      status: 'expiring_soon',
      updatedAt: '2023-10-01T10:00:00Z',
    },
  ],
  'vehicle-002': [
    {
      id: generateUUID(),
      vehicleId: 'vehicle-002',
      type: DeadlineType.ASSURANCE,
      expiryDate: addDays(200),
      daysRemaining: 200,
      status: 'valid',
      updatedAt: '2024-02-01T10:00:00Z',
    },
    {
      id: generateUUID(),
      vehicleId: 'vehicle-002',
      type: DeadlineType.VIGNETTE,
      expiryDate: addDays(-10),
      daysRemaining: -10,
      status: 'expired',
      updatedAt: '2023-12-01T10:00:00Z',
    },
    {
      id: generateUUID(),
      vehicleId: 'vehicle-002',
      type: DeadlineType.VISITE_TECHNIQUE,
      expiryDate: addDays(90),
      daysRemaining: 90,
      status: 'valid',
      updatedAt: '2024-01-01T10:00:00Z',
    },
  ],
};

// Calculate mileage stats
export const calculateMileageStats = (readings: MileageReading[]): MileageStats => {
  if (!readings?.length) {
    return { currentMileage: 0, avgKmPerDay: 0, totalReadings: 0, lastUpdate: null };
  }
  
  const sorted = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];
  
  const daysDiff = Math.max(1, Math.ceil(
    (new Date(latest?.date ?? 0).getTime() - new Date(oldest?.date ?? 0).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const kmDiff = (latest?.value ?? 0) - (oldest?.value ?? 0);
  
  return {
    currentMileage: latest?.value ?? 0,
    avgKmPerDay: Math.round((kmDiff / daysDiff) * 10) / 10,
    totalReadings: readings.length,
    lastUpdate: latest?.date ?? null,
  };
};
