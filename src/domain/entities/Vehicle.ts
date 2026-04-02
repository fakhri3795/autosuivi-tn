export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  initialMileage: number;
  currentMileage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  plate: string;
  initialMileage: string;
}
