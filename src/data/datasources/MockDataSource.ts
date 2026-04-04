// AutoSuivi TN - Firebase Data Source
// Replaces MockDataSource with real Firestore calls

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '../../config/firebase';

import { User } from '../../domain/entities/User';
import { Vehicle } from '../../domain/entities/Vehicle';
import { MileageReading, MileageStats } from '../../domain/entities/MileageReading';
import { MaintenanceRecord } from '../../domain/entities/Maintenance';
import { Deadline } from '../../domain/entities/Deadline';

// ==================== AUTH ====================

export const registerUser = async (email: string, password: string, name: string): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user: User = {
    id: credential.user.uid,
    email,
    name,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', credential.user.uid), user);
  return user;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  return { id: credential.user.uid, ...userDoc.data() } as User;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() } as User;
};

// ==================== VEHICLES ====================

export const getVehicles = async (userId: string): Promise<Vehicle[]> => {
  const q = query(collection(db, 'vehicles'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
};

export const getVehicleById = async (vehicleId: string): Promise<Vehicle | null> => {
  const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
  if (!vehicleDoc.exists()) return null;
  return { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
};

export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  const docRef = await addDoc(collection(db, 'vehicles'), {
    ...vehicle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...vehicle } as Vehicle;
};

export const updateVehicle = async (vehicleId: string, data: Partial<Vehicle>): Promise<void> => {
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  await deleteDoc(doc(db, 'vehicles', vehicleId));
};

// ==================== MILEAGE READINGS ====================

export const getMileageReadings = async (vehicleId: string): Promise<MileageReading[]> => {
  const q = query(
    collection(db, 'mileageReadings'),
    where('vehicleId', '==', vehicleId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MileageReading));
};

export const addMileageReading = async (reading: Omit<MileageReading, 'id'>): Promise<MileageReading> => {
  const docRef = await addDoc(collection(db, 'mileageReadings'), {
    ...reading,
    createdAt: new Date().toISOString(),
  });

  // Mettre à jour le kilométrage actuel du véhicule
  await updateDoc(doc(db, 'vehicles', reading.vehicleId), {
    currentMileage: reading.value,
    updatedAt: new Date().toISOString(),
  });

  return { id: docRef.id, ...reading } as MileageReading;
};

// ==================== MAINTENANCE ====================

export const getMaintenanceRecords = async (vehicleId: string): Promise<MaintenanceRecord[]> => {
  const q = query(
    collection(db, 'maintenance'),
    where('vehicleId', '==', vehicleId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MaintenanceRecord));
};

export const addMaintenanceRecord = async (record: Omit<MaintenanceRecord, 'id'>): Promise<MaintenanceRecord> => {
  const docRef = await addDoc(collection(db, 'maintenance'), {
    ...record,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...record } as MaintenanceRecord;
};

export const deleteMaintenanceRecord = async (recordId: string): Promise<void> => {
  await deleteDoc(doc(db, 'maintenance', recordId));
};

// ==================== DEADLINES ====================

export const getDeadlines = async (vehicleId: string): Promise<Deadline[]> => {
  const q = query(
    collection(db, 'deadlines'),
    where('vehicleId', '==', vehicleId)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
const expiryDate = new Date(data.expiryDate ?? 0);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: string;
    if (daysRemaining < 0) status = 'expired';
    else if (daysRemaining <= 30) status = 'expiring_soon';
    else status = 'valid';

    return { id: d.id, ...data, daysRemaining, status } as Deadline;
  });
};

export const addDeadline = async (deadline: Omit<Deadline, 'id' | 'daysRemaining' | 'status'>): Promise<Deadline> => {
  const docRef = await addDoc(collection(db, 'deadlines'), {
    ...deadline,
    updatedAt: new Date().toISOString(),
  });

const expiryDate = new Date(deadline.expiryDate ?? 0);
  const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const status = daysRemaining < 0 ? 'expired' : daysRemaining <= 30 ? 'expiring_soon' : 'valid';

  return { id: docRef.id, ...deadline, daysRemaining, status } as Deadline;
};

export const updateDeadline = async (deadlineId: string, data: Partial<Deadline>): Promise<void> => {
  await updateDoc(doc(db, 'deadlines', deadlineId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

// ==================== MILEAGE STATS (calculé côté client) ====================

export const calculateMileageStats = (readings: MileageReading[]): MileageStats => {
  if (!readings?.length) {
    return { currentMileage: 0, avgKmPerDay: 0, totalReadings: 0, lastUpdate: null };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];

  const daysDiff = Math.max(
    1,
    Math.ceil(
      (new Date(latest?.date ?? 0).getTime() - new Date(oldest?.date ?? 0).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const kmDiff = (latest?.value ?? 0) - (oldest?.value ?? 0);

  return {
    currentMileage: latest?.value ?? 0,
    avgKmPerDay: Math.round((kmDiff / daysDiff) * 10) / 10,
    totalReadings: readings.length,
    lastUpdate: latest?.date ?? null,
  };
};