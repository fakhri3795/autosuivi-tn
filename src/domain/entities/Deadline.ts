import { DeadlineType } from '../../core/constants';

export interface Deadline {
  id: string;
  vehicleId: string;
  type: DeadlineType;
  expiryDate: string | null;
  daysRemaining: number;
  status: 'valid' | 'expiring_soon' | 'expired';
  updatedAt: string;
}
