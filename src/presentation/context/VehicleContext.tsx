/**
 * VehicleContext — Full Clean Architecture with backend for all entities.
 *
 * All data now flows through repositories → remote data sources → API:
 * - Vehicles: VehicleRepositoryImpl
 * - Mileage: MileageRepositoryImpl
 * - Maintenance: MaintenanceRepositoryImpl (NEW — was AsyncStorage)
 * - Deadlines: DeadlineRepositoryImpl (NEW — was AsyncStorage)
 * - Predictions: PredictionService (local calc + backend fallback)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle } from '../../domain/entities/Vehicle';
import { MileageReading, MileageStats } from '../../domain/entities/MileageReading';
import { MaintenanceRecord, MaintenancePrediction } from '../../domain/entities/Maintenance';
import { Deadline } from '../../domain/entities/Deadline';
import { VehicleRepositoryImpl } from '../../data/repositories/VehicleRepositoryImpl';
import { MileageRepositoryImpl } from '../../data/repositories/MileageRepositoryImpl';
import { MaintenanceRepositoryImpl } from '../../data/repositories/MaintenanceRepositoryImpl';
import { DeadlineRepositoryImpl } from '../../data/repositories/DeadlineRepositoryImpl';
import { calculateMileageStats } from '../../data/datasources/MockDataSource';
import { getFullPrediction, getUpcomingMaintenanceItems, DrivingType, CustomIntervals } from '../../data/services/KmCalculator';
import { PredictionService, PredictionAlert } from '../../data/services/PredictionService';
// Dynamic import to avoid crash if expo-notifications native module is unavailable
let updateLocalReminders: typeof import('../../data/services/NotificationService').updateLocalReminders | null = null;
try {
  updateLocalReminders = require('../../data/services/NotificationService').updateLocalReminders;
} catch (e) {
  console.warn('NotificationService not available:', e);
}

// ─── Types ─────────────────────────────────────────────────────────────────────────

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
  predictionAlerts: PredictionAlert[];
  deadlines: Deadline[];
  maintenanceIntervals: MaintenanceIntervals;
  isLoading: boolean;
  error: string | null;
  setActiveVehicle: (vehicleId: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>) => Promise<Vehicle>;
  addVehicleWithData: (data: VehicleWithData) => Promise<Vehicle>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addMileageReading: (value: number, date: string) => Promise<void>;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'vehicleId' | 'createdAt'>) => Promise<void>;
  updateMaintenanceRecord: (id: string, data: Partial<MaintenanceRecord>) => Promise<void>;
  deleteMaintenanceRecord: (id: string) => Promise<void>;
  updateDeadline: (type: string, expiryDate: string) => Promise<void>;
  updateMaintenanceIntervals: (intervals: MaintenanceIntervals) => Promise<void>;
  refreshData: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

// ─── Storage keys (only for local settings) ────────────────────────────────────────

export interface MaintenanceIntervals {
  oilChangeKm: number;
  oilChangeMonths: number;
  airFilterKm: number;
  oilFilterKm: number;
  brakeCheckKm: number;
  tireRotationKm: number;
  timingBeltKm: number;
}

const INTERVALS_KEY = 'autosuivi_intervals';

const defaultIntervals: MaintenanceIntervals = {
  oilChangeKm: 10000,
  oilChangeMonths: 12,
  airFilterKm: 20000,
  oilFilterKm: 10000,
  brakeCheckKm: 30000,
  tireRotationKm: 15000,
  timingBeltKm: 100000,
};

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// ─── Repository singletons ──────────────────────────────────────────────────

const vehicleRepository = new VehicleRepositoryImpl();
const mileageRepository = new MileageRepositoryImpl();
const maintenanceRepository = new MaintenanceRepositoryImpl();
const deadlineRepository = new DeadlineRepositoryImpl();
const predictionService = new PredictionService();

// ─── Provider ────────────────────────────────────────────────────────────────

export const VehicleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mileageReadings, setMileageReadings] = useState<MileageReading[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [predictionAlerts, setPredictionAlerts] = useState<PredictionAlert[]>([]);
  const [maintenanceIntervals, setMaintenanceIntervals] = useState<MaintenanceIntervals>(defaultIntervals);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeVehicle = vehicles?.find((v) => v?.isActive) ?? null;
  const mileageStats = calculateMileageStats(mileageReadings);

  const maintenancePrediction = activeVehicle
    ? getFullPrediction(
        maintenanceRecords,
        activeVehicle.currentMileage,
        mileageStats,
        'mixte' as DrivingType,
        maintenanceIntervals as CustomIntervals,
      )
    : null;

  // ── Load data on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeVehicle?.id) {
      loadVehicleData(activeVehicle.id);
    }
  }, [activeVehicle?.id]);

  // Update prediction alerts when data changes
  useEffect(() => {
    if (activeVehicle && maintenancePrediction) {
      const result = predictionService.computeLocally(
        maintenanceRecords,
        activeVehicle.currentMileage,
        mileageStats,
        'mixte' as DrivingType,
        maintenanceIntervals as CustomIntervals,
      );
      setPredictionAlerts(result.alerts);

      // Schedule notifications based on predictions
      try {
        const upcomingItems = getUpcomingMaintenanceItems(
          maintenanceRecords,
          activeVehicle.currentMileage,
          mileageStats,
          'mixte' as DrivingType,
          maintenanceIntervals as CustomIntervals,
        );
        updateLocalReminders?.(
          upcomingItems,
          deadlines,
          activeVehicle.currentMileage,
          mileageStats?.avgKmPerDay ?? 0,
        )?.catch?.((err: any) => console.warn('Notification scheduling error:', err));
      } catch (err) {
        console.warn('Error computing upcoming items for notifications:', err);
      }
    }
  }, [maintenanceRecords, deadlines, activeVehicle?.currentMileage]);

  /** Load vehicles from the backend API (with automatic retry) */
  const loadData = async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    try {
      setIsLoading(true);
      setError(null);

      // Load maintenance intervals from local storage
      const storedIntervals = await AsyncStorage.getItem(INTERVALS_KEY);
      if (storedIntervals) {
        setMaintenanceIntervals(JSON.parse(storedIntervals));
      }

      // Fetch vehicles from the backend
      const remoteVehicles = await vehicleRepository.getAll();
      setVehicles(remoteVehicles);
    } catch (err: any) {
      console.error('Load data error:', err);

      // Automatic retry for network errors
      if (retryCount < MAX_RETRIES && (!err.statusCode || err.statusCode >= 500)) {
        console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}...`);
        await new Promise((r) => setTimeout(r, 2000 * (retryCount + 1)));
        return loadData(retryCount + 1);
      }

      // User-friendly French error messages
      const statusCode = err.statusCode ?? err.status;
      let userMessage: string;

      if (statusCode === 401) {
        userMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
      } else if (statusCode === 404) {
        userMessage = 'Service temporairement indisponible. Réessayez plus tard.';
      } else if (statusCode >= 500) {
        userMessage = 'Le serveur rencontre un problème. Réessayez dans quelques instants.';
      } else if (err.message?.includes('connexion') || err.message?.includes('connect') || err.message?.includes('Network')) {
        userMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion Internet.';
      } else {
        userMessage = err.message ?? 'Impossible de charger vos véhicules. Vérifiez votre connexion.';
      }

      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /** Load vehicle-specific data — ALL from backend API now */
  const loadVehicleData = async (vehicleId: string) => {
    // Mileage readings
    try {
      const readings = await mileageRepository.getHistory(vehicleId);
      setMileageReadings(readings);
    } catch (err) {
      console.error('Load mileage error:', err);
      setMileageReadings([]);
    }

    // Maintenance records from backend API
    try {
      const records = await maintenanceRepository.getByVehicle(vehicleId);
      setMaintenanceRecords(records);
    } catch (err) {
      console.error('Load maintenance error:', err);
      setMaintenanceRecords([]);
    }

    // Deadlines from backend API
    try {
      const remoteDeadlines = await deadlineRepository.getByVehicle(vehicleId);
      setDeadlines(remoteDeadlines);
    } catch (err) {
      console.error('Load deadlines error:', err);
      setDeadlines([]);
    }
  };

  // ── Vehicle operations (via API) ───────────────────────────────────────

  const setActiveVehicle = async (vehicleId: string) => {
    try {
      await vehicleRepository.setActive(vehicleId);
      setVehicles((prev) =>
        prev.map((v) => ({ ...v, isActive: v.id === vehicleId })),
      );
    } catch (err) {
      console.error('Set active vehicle error:', err);
    }
  };

  const addVehicle = async (
    vehicleData: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>,
  ): Promise<Vehicle> => {
    try {
      const newVehicle = await vehicleRepository.create(vehicleData);
      const updatedVehicles = await vehicleRepository.getAll();
      setVehicles(updatedVehicles);
      return newVehicle;
    } catch (err: any) {
      console.error('Add vehicle error:', err);
      throw new Error(
        err?.message || 'Impossible d\u2019ajouter le véhicule. Vérifiez votre connexion.'
      );
    }
  };

  const addVehicleWithData = async (data: VehicleWithData): Promise<Vehicle> => {
    // Create vehicle via API
    const newVehicle = await vehicleRepository.create(data.vehicle);

    // Refresh vehicle list
    const updatedVehicles = await vehicleRepository.getAll();
    setVehicles(updatedVehicles);

    // Store deadlines via backend API
    const deadlineTypes = [
      { type: 'ASSURANCE', date: data.deadlines.insurance },
      { type: 'VIGNETTE', date: data.deadlines.vignette },
      { type: 'VISITE_TECHNIQUE', date: data.deadlines.technicalVisit },
    ];

    const vehicleDeadlines: Deadline[] = [];
    for (const dl of deadlineTypes) {
      if (!dl.date) continue;
      try {
        const deadline = await deadlineRepository.upsert({
          id: generateUUID(),
          vehicleId: newVehicle.id,
          type: dl.type as any,
          expiryDate: dl.date,
        });
        const daysRemaining = Math.ceil(
          (new Date(dl.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        vehicleDeadlines.push({
          ...deadline,
          id: deadline.id ?? generateUUID(),
          vehicleId: newVehicle.id,
          type: dl.type as any,
          expiryDate: dl.date,
          daysRemaining,
          status: daysRemaining < 0 ? 'expired' : daysRemaining <= 60 ? 'expiring_soon' : 'valid',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error creating deadline:', err);
      }
    }

    // Store initial maintenance via backend API
    if (data.lastMaintenance.oilChangeDate && data.lastMaintenance.oilChangeKm) {
      try {
        await maintenanceRepository.add({
          id: generateUUID(),
          vehicleId: newVehicle.id,
          type: 'VIDANGE' as any,
          date: data.lastMaintenance.oilChangeDate,
          mileage: data.lastMaintenance.oilChangeKm,
          cost: null,
          notes: 'Vidange initiale (avant ajout du véhicule)',
        });
      } catch (err) {
        console.error('Error creating initial maintenance:', err);
      }
    }

    // If active, reload data
    if (newVehicle.isActive) {
      await loadVehicleData(newVehicle.id);
    }

    return newVehicle;
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    const updated = await vehicleRepository.update(id, data);
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updated } : v)),
    );
  };

  const deleteVehicle = async (id: string) => {
    try {
      await vehicleRepository.delete(id);
      const updatedVehicles = await vehicleRepository.getAll();
      setVehicles(updatedVehicles);

      // Clear related data if the deleted vehicle was active
      if (activeVehicle?.id === id) {
        setMileageReadings([]);
        setMaintenanceRecords([]);
        setDeadlines([]);
        setPredictionAlerts([]);
      }
    } catch (err: any) {
      console.error('Delete vehicle error:', err);
      throw new Error(
        err?.message || 'Impossible de supprimer le véhicule. Vérifiez votre connexion.'
      );
    }
  };

  // ── Mileage operations (via API) ───────────────────────────────────────

  const addMileageReading = async (value: number, date: string) => {
    if (!activeVehicle) return;

    await mileageRepository.addReading(activeVehicle.id, value, date);
    const updatedReadings = await mileageRepository.getHistory(activeVehicle.id);
    setMileageReadings(updatedReadings);

    await vehicleRepository.update(activeVehicle.id, { currentMileage: value });
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === activeVehicle.id ? { ...v, currentMileage: value } : v,
      ),
    );
  };

  // ── Maintenance operations (via API) ────────────────────────────────────

  const addMaintenanceRecord = async (
    record: Omit<MaintenanceRecord, 'id' | 'vehicleId' | 'createdAt'>,
  ) => {
    if (!activeVehicle) return;

    const newRecord = {
      ...record,
      id: generateUUID(),
      vehicleId: activeVehicle.id,
    };

    await maintenanceRepository.add(newRecord);

    // Refresh from backend
    const updatedRecords = await maintenanceRepository.getByVehicle(activeVehicle.id);
    setMaintenanceRecords(updatedRecords);
  };

  const deleteMaintenanceRecord = async (id: string) => {
    if (!activeVehicle) return;

    await maintenanceRepository.delete(id);
    const updatedRecords = await maintenanceRepository.getByVehicle(activeVehicle.id);
    setMaintenanceRecords(updatedRecords);
  };

  const updateMaintenanceRecord = async (id: string, data: Partial<MaintenanceRecord>) => {
    if (!activeVehicle) return;

    await maintenanceRepository.update(id, data);
    const updatedRecords = await maintenanceRepository.getByVehicle(activeVehicle.id);
    setMaintenanceRecords(updatedRecords);
  };

  // ── Deadline operations (via API) ──────────────────────────────────────

  const updateDeadline = async (type: string, expiryDate: string) => {
    if (!activeVehicle) return;

    const existingDeadline = deadlines.find((d) => d.type === type);

    await deadlineRepository.upsert({
      id: existingDeadline?.id ?? generateUUID(),
      vehicleId: activeVehicle.id,
      type: type as any,
      expiryDate,
    });

    // Refresh from backend
    const updatedDeadlines = await deadlineRepository.getByVehicle(activeVehicle.id);
    setDeadlines(updatedDeadlines);
  };

  // ── Settings ────────────────────────────────────────────────────────────

  const updateMaintenanceIntervals = async (intervals: MaintenanceIntervals) => {
    setMaintenanceIntervals(intervals);
    await AsyncStorage.setItem(INTERVALS_KEY, JSON.stringify(intervals));
  };

  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        mileageReadings,
        mileageStats,
        maintenanceRecords,
        maintenancePrediction,
        predictionAlerts,
        deadlines,
        maintenanceIntervals,
        isLoading,
        error,
        setActiveVehicle,
        addVehicle,
        addVehicleWithData,
        updateVehicle,
        deleteVehicle,
        addMileageReading,
        addMaintenanceRecord,
        updateMaintenanceRecord,
        deleteMaintenanceRecord,
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
