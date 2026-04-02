// AutoSuivi TN - Predictive Maintenance Calculator
// Urgency score based on km, time, and driving type

import { MaintenanceType, MaintenanceIntervals as DefaultIntervals, MaintenanceLabels } from '../../core/constants';
import { MaintenanceRecord, MaintenancePrediction, PredictionItem } from '../../domain/entities/Maintenance';
import { MileageStats } from '../../domain/entities/MileageReading';

const WEIGHTS = {
  km: 0.4,      // 40%
  time: 0.3,    // 30%
  driving: 0.3, // 30%
};

export type DrivingType = 'urbain' | 'mixte' | 'autoroute';

// Custom intervals type matching VehicleContext
export interface CustomIntervals {
  oilChangeKm: number;
  oilChangeMonths: number;
  airFilterKm: number;
  oilFilterKm: number;
  brakeCheckKm: number;
  tireRotationKm: number;
  timingBeltKm: number;
}

// Map custom intervals to maintenance type intervals
const getIntervalForType = (type: MaintenanceType, customIntervals?: CustomIntervals): { km: number; months: number } => {
  if (!customIntervals) {
    return DefaultIntervals[type] || { km: 10000, months: 12 };
  }
  
  switch (type) {
    case MaintenanceType.VIDANGE:
      return { km: customIntervals.oilChangeKm, months: customIntervals.oilChangeMonths };
    case MaintenanceType.FILTRE_AIR:
      return { km: customIntervals.airFilterKm, months: 24 };
    case MaintenanceType.FILTRE_HUILE:
      return { km: customIntervals.oilFilterKm, months: 12 };
    case MaintenanceType.FREINS:
      return { km: customIntervals.brakeCheckKm, months: 24 };
    case MaintenanceType.PNEUS:
      return { km: customIntervals.tireRotationKm, months: 12 };
    case MaintenanceType.COURROIE_DISTRIBUTION:
      return { km: customIntervals.timingBeltKm, months: 60 };
    default:
      return DefaultIntervals[type] || { km: 10000, months: 12 };
  }
};

const getDrivingFactor = (type: DrivingType, avgKmPerDay: number): number => {
  // Urban driving is harder on the vehicle
  const baseFactor = type === 'urbain' ? 1.2 : type === 'mixte' ? 1.0 : 0.8;
  // High daily km also increases urgency
  const intensityFactor = avgKmPerDay > 80 ? 1.2 : avgKmPerDay > 40 ? 1.0 : 0.8;
  return baseFactor * intensityFactor;
};

export const calculateUrgencyScore = (
  maintenanceType: MaintenanceType,
  lastMaintenance: MaintenanceRecord | null,
  currentMileage: number,
  stats: MileageStats,
  drivingType: DrivingType = 'mixte',
  customIntervals?: CustomIntervals
): { score: number; kmFactor: number; timeFactor: number; drivingFactor: number } => {
  const interval = getIntervalForType(maintenanceType, customIntervals);
  if (!interval) {
    return { score: 0, kmFactor: 0, timeFactor: 0, drivingFactor: 0 };
  }
  
  // Calculate km factor (0-100)
  const kmSinceLast = lastMaintenance ? currentMileage - lastMaintenance.mileage : currentMileage;
  const kmRatio = Math.min(kmSinceLast / interval.km, 1.5);
  const kmFactor = Math.round(kmRatio * 100);
  
  // Calculate time factor (0-100)
  const daysSinceLast = lastMaintenance 
    ? Math.ceil((Date.now() - new Date(lastMaintenance.date).getTime()) / (1000 * 60 * 60 * 24))
    : 365; // Assume 1 year if no record
  const maxDays = interval.months * 30;
  const timeRatio = Math.min(daysSinceLast / maxDays, 1.5);
  const timeFactor = Math.round(timeRatio * 100);
  
  // Calculate driving factor adjustment
  const drivingFactor = getDrivingFactor(drivingType, stats?.avgKmPerDay ?? 0);
  
  // Weighted score
  const rawScore = (kmFactor * WEIGHTS.km) + (timeFactor * WEIGHTS.time) + (50 * drivingFactor * WEIGHTS.driving);
  const score = Math.min(Math.round(rawScore), 100);
  
  return {
    score,
    kmFactor: Math.round(kmFactor * WEIGHTS.km),
    timeFactor: Math.round(timeFactor * WEIGHTS.time),
    drivingFactor: Math.round(50 * drivingFactor * WEIGHTS.driving),
  };
};

export const calculateNextOilChange = (
  lastOilChange: MaintenanceRecord | null,
  currentMileage: number,
  avgKmPerDay: number,
  customIntervals?: CustomIntervals
): { kmRemaining: number; daysRemaining: number; estimatedDate: string; estimatedKm: number } => {
  const intervalKm = customIntervals?.oilChangeKm ?? DefaultIntervals[MaintenanceType.VIDANGE].km;
  const lastKm = lastOilChange?.mileage ?? 0;
  const nextKm = lastKm + intervalKm;
  const kmRemaining = Math.max(0, nextKm - currentMileage);
  
  const effectiveAvgKmPerDay = avgKmPerDay > 0 ? avgKmPerDay : 30; // Default 30km/day
  const daysRemaining = Math.max(0, Math.round(kmRemaining / effectiveAvgKmPerDay));
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);
  
  return {
    kmRemaining,
    daysRemaining,
    estimatedDate: estimatedDate.toISOString(),
    estimatedKm: nextKm,
  };
};

export const getFullPrediction = (
  maintenanceRecords: MaintenanceRecord[],
  currentMileage: number,
  stats: MileageStats,
  drivingType: DrivingType = 'mixte',
  customIntervals?: CustomIntervals
): MaintenancePrediction => {
  // Find last oil change
  const lastOilChange = maintenanceRecords
    ?.filter(r => r?.type === MaintenanceType.VIDANGE)
    ?.sort((a, b) => new Date(b?.date ?? 0).getTime() - new Date(a?.date ?? 0).getTime())?.[0] ?? null;
  
  const urgencyResult = calculateUrgencyScore(
    MaintenanceType.VIDANGE,
    lastOilChange,
    currentMileage,
    stats,
    drivingType,
    customIntervals
  );
  
  const nextOilChange = calculateNextOilChange(
    lastOilChange,
    currentMileage,
    stats?.avgKmPerDay ?? 0,
    customIntervals
  );
  
  return {
    urgencyScore: urgencyResult.score,
    nextOilChangeMileage: nextOilChange.estimatedKm,
    nextOilChangeDate: nextOilChange.estimatedDate,
    kmRemaining: nextOilChange.kmRemaining,
    daysRemaining: nextOilChange.daysRemaining,
    factors: {
      kmFactor: urgencyResult.kmFactor,
      timeFactor: urgencyResult.timeFactor,
      drivingFactor: urgencyResult.drivingFactor,
    },
  };
};

export const getUpcomingMaintenanceItems = (
  maintenanceRecords: MaintenanceRecord[],
  currentMileage: number,
  stats: MileageStats,
  drivingType: DrivingType = 'mixte',
  customIntervals?: CustomIntervals
): PredictionItem[] => {
  const items: PredictionItem[] = [];
  
  for (const type of Object.values(MaintenanceType)) {
    const lastOfType = maintenanceRecords
      ?.filter(r => r?.type === type)
      ?.sort((a, b) => new Date(b?.date ?? 0).getTime() - new Date(a?.date ?? 0).getTime())?.[0] ?? null;
    
    const { score } = calculateUrgencyScore(type, lastOfType, currentMileage, stats, drivingType, customIntervals);
    
    const interval = getIntervalForType(type, customIntervals);
    const lastKm = lastOfType?.mileage ?? 0;
    const nextKm = lastKm + (interval?.km ?? 10000);
    const kmRemaining = Math.max(0, nextKm - currentMileage);
    const daysRemaining = Math.max(0, Math.round(kmRemaining / Math.max(stats?.avgKmPerDay ?? 30, 1)));
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);
    
    let urgency: 'green' | 'orange' | 'red' = 'green';
    if (score >= 71) urgency = 'red';
    else if (score >= 41) urgency = 'orange';
    
    items.push({
      type,
      label: MaintenanceLabels[type] ?? type,
      urgency,
      estimatedKm: nextKm,
      estimatedDate: estimatedDate.toISOString(),
    });
  }
  
  return items.sort((a, b) => {
    const urgencyOrder = { red: 0, orange: 1, green: 2 };
    return (urgencyOrder[a?.urgency ?? 'green'] ?? 2) - (urgencyOrder[b?.urgency ?? 'green'] ?? 2);
  });
};

export const getUrgencyColor = (score: number): string => {
  if (score >= 71) return '#EF4444'; // Red
  if (score >= 41) return '#F59E0B'; // Orange
  return '#10B981'; // Green
};
