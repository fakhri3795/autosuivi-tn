export interface MileageReading {
  id: string;
  vehicleId: string;
  value: number;
  date: string;
  delta: number | null;
  createdAt: string;
}

export interface MileageStats {
  currentMileage: number;
  avgKmPerDay: number;
  totalReadings: number;
  lastUpdate: string | null;
}
