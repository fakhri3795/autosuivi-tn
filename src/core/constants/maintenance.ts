// AutoSuivi TN - Maintenance Constants

export enum MaintenanceType {
  VIDANGE = 'VIDANGE',
  FILTRE_HUILE = 'FILTRE_HUILE',
  FILTRE_AIR = 'FILTRE_AIR',
  FILTRE_HABITACLE = 'FILTRE_HABITACLE',
  FREINS = 'FREINS',
  PNEUS = 'PNEUS',
  COURROIE_DISTRIBUTION = 'COURROIE_DISTRIBUTION',
}

export enum DeadlineType {
  ASSURANCE = 'ASSURANCE',
  VIGNETTE = 'VIGNETTE',
  VISITE_TECHNIQUE = 'VISITE_TECHNIQUE',
}

export const MaintenanceLabels: Record<MaintenanceType, string> = {
  [MaintenanceType.VIDANGE]: 'Vidange',
  [MaintenanceType.FILTRE_HUILE]: 'Filtre à huile',
  [MaintenanceType.FILTRE_AIR]: 'Filtre à air',
  [MaintenanceType.FILTRE_HABITACLE]: 'Filtre habitacle',
  [MaintenanceType.FREINS]: 'Freins',
  [MaintenanceType.PNEUS]: 'Pneus',
  [MaintenanceType.COURROIE_DISTRIBUTION]: 'Courroie distribution',
};

export const DeadlineLabels: Record<DeadlineType, string> = {
  [DeadlineType.ASSURANCE]: 'Assurance véhicule',
  [DeadlineType.VIGNETTE]: 'Vignette',
  [DeadlineType.VISITE_TECHNIQUE]: 'Visite technique',
};

// Maintenance intervals
export const MaintenanceIntervals: Record<MaintenanceType, { km: number; months: number }> = {
  [MaintenanceType.VIDANGE]: { km: 10000, months: 12 },
  [MaintenanceType.FILTRE_HUILE]: { km: 10000, months: 12 },
  [MaintenanceType.FILTRE_AIR]: { km: 20000, months: 24 },
  [MaintenanceType.FILTRE_HABITACLE]: { km: 15000, months: 18 },
  [MaintenanceType.FREINS]: { km: 30000, months: 36 },
  [MaintenanceType.PNEUS]: { km: 40000, months: 48 },
  [MaintenanceType.COURROIE_DISTRIBUTION]: { km: 100000, months: 60 },
};
