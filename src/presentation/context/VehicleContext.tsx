import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle } from '../../domain/entities/Vehicle';
import { MileageReading, MileageStats } from '../../domain/entities/MileageReading';
import { MaintenanceRecord, MaintenancePrediction } from '../../domain/entities/Maintenance';
import { Deadline } from '../../domain/entities/Deadline';
import {
  mockVehicles,
  mockMileageReadings,
  mockMaintenanceRecords,
  mockDeadlines,
  calculateMileageStats,
} from '../../data/datasources/FirebaseDataSource';
import { getFullPrediction, DrivingType, CustomIntervals } from '../../data/services/KmCalculator';

interface VehicleWithData {
  vehicle: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>;
  deadlines: {
    insurance: string | null;
    vignette: string | null;
    technicalVisit: string | null;
  };
  lastMaintenance: {
    oilChangeDate: string | null;
    oilChangeKm: number | null;
  };
}

interface VehicleContextType {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  mileageReadings: MileageReading[];
  mileageStats: MileageStats;
  maintenanceRecords: MaintenanceRecord[];
  maintenancePrediction: MaintenancePrediction | null;
  deadlines: Deadline[];
  maintenanceIntervals: MaintenanceIntervals;
  isLoading: boolean;
  setActiveVehicle: (vehicleId: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>) => Promise<Vehicle>;
  addVehicleWithData: (data: VehicleWithData) => Promise<Vehicle>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addMileageReading: (value: number, date: string) => Promise<void>;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'vehicleId' | 'createdAt'>) => Promise<void>;
  updateDeadline: (type: string, expiryDate: string) => Promise<void>;
  updateMaintenanceIntervals: (intervals: MaintenanceIntervals) => Promise<void>;
  refreshData: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const VEHICLES_KEY = 'autosuivi_vehicles';
const MILEAGE_KEY = 'autosuivi_mileage';
const MAINTENANCE_KEY = 'autosuivi_maintenance';
const DEADLINES_KEY = 'autosuivi_deadlines';
const INTERVALS_KEY = 'autosuivi_intervals';

export interface MaintenanceIntervals {
  oilChangeKm: number;
  oilChangeMonths: number;
  airFilterKm: number;
  oilFilterKm: number;
  brakeCheckKm: number;
  tireRotationKm: number;
  timingBeltKm: number;
}

const defaultIntervals: MaintenanceIntervals = {
  oilChangeKm: 10000,
  oilChangeMonths: 12,
  airFilterKm: 20000,
  oilFilterKm: 10000,
  brakeCheckKm: 30000,
  tireRotationKm: 15000,
  timingBeltKm: 100000,
};

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

export const VehicleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mileageReadings, setMileageReadings] = useState<MileageReading[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [maintenanceIntervals, setMaintenanceIntervals] = useState<MaintenanceIntervals>(defaultIntervals);
  const [isLoading, setIsLoading] = useState(true);

  const activeVehicle = vehicles?.find(v => v?.isActive) ?? null;
  const mileageStats = calculateMileageStats(mileageReadings);
  
  const maintenancePrediction = activeVehicle
    ? getFullPrediction(maintenanceRecords, activeVehicle.currentMileage, mileageStats, 'mixte' as DrivingType, maintenanceIntervals as CustomIntervals)
    : null;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeVehicle?.id) {
      loadVehicleData(activeVehicle.id);
    }
  }, [activeVehicle?.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const storedVehicles = await AsyncStorage.getItem(VEHICLES_KEY);
      const storedIntervals = await AsyncStorage.getItem(INTERVALS_KEY);
      
      if (storedIntervals) {
        setMaintenanceIntervals(JSON.parse(storedIntervals));
      }
      
      if (storedVehicles) {
        setVehicles(JSON.parse(storedVehicles));
      } else {
        // Initialize with mock data
        await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(mockVehicles));
        setVehicles(mockVehicles);
        
        // Also initialize mileage, maintenance, and deadlines
        await AsyncStorage.setItem(MILEAGE_KEY, JSON.stringify(mockMileageReadings));
        await AsyncStorage.setItem(MAINTENANCE_KEY, JSON.stringify(mockMaintenanceRecords));
        await AsyncStorage.setItem(DEADLINES_KEY, JSON.stringify(mockDeadlines));
      }
    } catch (error) {
      console.error('Load data error:', error);
      setVehicles(mockVehicles);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVehicleData = async (vehicleId: string) => {
    try {
      const storedMileage = await AsyncStorage.getItem(MILEAGE_KEY);
      const storedMaintenance = await AsyncStorage.getItem(MAINTENANCE_KEY);
      const storedDeadlines = await AsyncStorage.getItem(DEADLINES_KEY);

      if (storedMileage) {
        const allMileage = JSON.parse(storedMileage);
        setMileageReadings(allMileage?.[vehicleId] ?? []);
      } else {
        setMileageReadings(mockMileageReadings?.[vehicleId] ?? []);
      }

      if (storedMaintenance) {
        const allMaintenance = JSON.parse(storedMaintenance);
        setMaintenanceRecords(allMaintenance?.[vehicleId] ?? []);
      } else {
        setMaintenanceRecords(mockMaintenanceRecords?.[vehicleId] ?? []);
      }

      if (storedDeadlines) {
        const allDeadlines = JSON.parse(storedDeadlines);
        setDeadlines(allDeadlines?.[vehicleId] ?? []);
      } else {
        setDeadlines(mockDeadlines?.[vehicleId] ?? []);
      }
    } catch (error) {
      console.error('Load vehicle data error:', error);
    }
  };

  const setActiveVehicle = async (vehicleId: string) => {
    try {
      const updated = vehicles.map(v => ({
        ...v,
        isActive: v.id === vehicleId,
      }));
      setVehicles(updated);
      await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Set active vehicle error:', error);
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Vehicle> => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: generateUUID(),
      userId: 'user-001',
      isActive: vehicles.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updated = [...vehicles, newVehicle];
    setVehicles(updated);
    await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
    
    // Initialize empty data for new vehicle
    const storedMileage = await AsyncStorage.getItem(MILEAGE_KEY);
    const allMileage = storedMileage ? JSON.parse(storedMileage) : {};
    allMileage[newVehicle.id] = [];
    await AsyncStorage.setItem(MILEAGE_KEY, JSON.stringify(allMileage));
    
    return newVehicle;
  };

  const addVehicleWithData = async (data: VehicleWithData): Promise<Vehicle> => {
    // First create the vehicle
    const newVehicle: Vehicle = {
      ...data.vehicle,
      id: generateUUID(),
      userId: 'user-001',
      isActive: vehicles.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updatedVehicles));
    
    // Initialize mileage data
    const storedMileage = await AsyncStorage.getItem(MILEAGE_KEY);
    const allMileage = storedMileage ? JSON.parse(storedMileage) : {};
    allMileage[newVehicle.id] = [];
    await AsyncStorage.setItem(MILEAGE_KEY, JSON.stringify(allMileage));
    
    // Create deadlines
    const vehicleDeadlines: Deadline[] = [];
    const createDeadline = (type: string, expiryDate: string | null) => {
      if (!expiryDate) return;
      const daysRemaining = Math.ceil(
        (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      let status: 'valid' | 'expiring_soon' | 'expired' = 'valid';
      if (daysRemaining < 0) status = 'expired';
      else if (daysRemaining <= 60) status = 'expiring_soon';
      
      vehicleDeadlines.push({
        id: generateUUID(),
        vehicleId: newVehicle.id,
        type: type as any,
        expiryDate,
        daysRemaining,
        status,
        updatedAt: new Date().toISOString(),
      });
    };
    
    createDeadline('ASSURANCE', data.deadlines.insurance);
    createDeadline('VIGNETTE', data.deadlines.vignette);
    createDeadline('VISITE_TECHNIQUE', data.deadlines.technicalVisit);
    
    const storedDeadlines = await AsyncStorage.getItem(DEADLINES_KEY);
    const allDeadlines = storedDeadlines ? JSON.parse(storedDeadlines) : {};
    allDeadlines[newVehicle.id] = vehicleDeadlines;
    await AsyncStorage.setItem(DEADLINES_KEY, JSON.stringify(allDeadlines));
    
    // Create maintenance record if provided
    const vehicleMaintenanceRecords: MaintenanceRecord[] = [];
    if (data.lastMaintenance.oilChangeDate && data.lastMaintenance.oilChangeKm) {
      vehicleMaintenanceRecords.push({
        id: generateUUID(),
        vehicleId: newVehicle.id,
        type: 'VIDANGE' as any,
        date: data.lastMaintenance.oilChangeDate,
        mileage: data.lastMaintenance.oilChangeKm,
        cost: null,
        notes: 'Vidange initiale (avant ajout du véhicule)',
        createdAt: new Date().toISOString(),
      });
    }
    
    const storedMaintenance = await AsyncStorage.getItem(MAINTENANCE_KEY);
    const allMaintenance = storedMaintenance ? JSON.parse(storedMaintenance) : {};
    allMaintenance[newVehicle.id] = vehicleMaintenanceRecords;
    await AsyncStorage.setItem(MAINTENANCE_KEY, JSON.stringify(allMaintenance));
    
    // If this is the first/active vehicle, load its data
    if (newVehicle.isActive) {
      setDeadlines(vehicleDeadlines);
      setMaintenanceRecords(vehicleMaintenanceRecords);
    }
    
    return newVehicle;
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    const updated = vehicles.map(v => 
      v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v
    );
    setVehicles(updated);
    await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  };

  const deleteVehicle = async (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    // If deleted vehicle was active, make first remaining vehicle active
    if (vehicles.find(v => v.id === id)?.isActive && updated.length > 0) {
      updated[0].isActive = true;
    }
    setVehicles(updated);
    await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(updated));
  };

  const addMileageReading = async (value: number, date: string) => {
    if (!activeVehicle) return;
    
    const lastReading = mileageReadings?.[0];
    const delta = lastReading ? value - lastReading.value : null;
    
    const newReading: MileageReading = {
      id: generateUUID(),
      vehicleId: activeVehicle.id,
      value,
      date,
      delta,
      createdAt: new Date().toISOString(),
    };
    
    const updatedReadings = [newReading, ...mileageReadings];
    setMileageReadings(updatedReadings);
    
    // Update vehicle's current mileage
    await updateVehicle(activeVehicle.id, { currentMileage: value });
    
    // Save to storage
    const storedMileage = await AsyncStorage.getItem(MILEAGE_KEY);
    const allMileage = storedMileage ? JSON.parse(storedMileage) : {};
    allMileage[activeVehicle.id] = updatedReadings;
    await AsyncStorage.setItem(MILEAGE_KEY, JSON.stringify(allMileage));
  };

  const addMaintenanceRecord = async (record: Omit<MaintenanceRecord, 'id' | 'vehicleId' | 'createdAt'>) => {
    if (!activeVehicle) return;
    
    const newRecord: MaintenanceRecord = {
      ...record,
      id: generateUUID(),
      vehicleId: activeVehicle.id,
      createdAt: new Date().toISOString(),
    };
    
    const updatedRecords = [newRecord, ...maintenanceRecords];
    setMaintenanceRecords(updatedRecords);
    
    const storedMaintenance = await AsyncStorage.getItem(MAINTENANCE_KEY);
    const allMaintenance = storedMaintenance ? JSON.parse(storedMaintenance) : {};
    allMaintenance[activeVehicle.id] = updatedRecords;
    await AsyncStorage.setItem(MAINTENANCE_KEY, JSON.stringify(allMaintenance));
  };

  const updateDeadline = async (type: string, expiryDate: string) => {
    if (!activeVehicle) return;
    
    const daysRemaining = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    let status: 'valid' | 'expiring_soon' | 'expired' = 'valid';
    if (daysRemaining < 0) status = 'expired';
    else if (daysRemaining <= 60) status = 'expiring_soon';
    
    const existingIndex = deadlines.findIndex(d => d.type === type);
    let updatedDeadlines: Deadline[];
    
    if (existingIndex >= 0) {
      updatedDeadlines = deadlines.map((d, i) => 
        i === existingIndex
          ? { ...d, expiryDate, daysRemaining, status, updatedAt: new Date().toISOString() }
          : d
      );
    } else {
      const newDeadline: Deadline = {
        id: generateUUID(),
        vehicleId: activeVehicle.id,
        type: type as any,
        expiryDate,
        daysRemaining,
        status,
        updatedAt: new Date().toISOString(),
      };
      updatedDeadlines = [...deadlines, newDeadline];
    }
    
    setDeadlines(updatedDeadlines);
    
    const storedDeadlines = await AsyncStorage.getItem(DEADLINES_KEY);
    const allDeadlines = storedDeadlines ? JSON.parse(storedDeadlines) : {};
    allDeadlines[activeVehicle.id] = updatedDeadlines;
    await AsyncStorage.setItem(DEADLINES_KEY, JSON.stringify(allDeadlines));
  };

  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  const updateMaintenanceIntervals = async (intervals: MaintenanceIntervals) => {
    setMaintenanceIntervals(intervals);
    await AsyncStorage.setItem(INTERVALS_KEY, JSON.stringify(intervals));
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        mileageReadings,
        mileageStats,
        maintenanceRecords,
        maintenancePrediction,
        deadlines,
        maintenanceIntervals,
        isLoading,
        setActiveVehicle,
        addVehicle,
        addVehicleWithData,
        updateVehicle,
        deleteVehicle,
        addMileageReading,
        addMaintenanceRecord,
        updateDeadline,
        updateMaintenanceIntervals,
        refreshData,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = (): VehicleContextType => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};
