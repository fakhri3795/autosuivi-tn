import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PredictionItem } from '../../domain/entities/Maintenance';
import { Deadline } from '../../domain/entities/Deadline';
import { DeadlineLabels } from '../../core/constants';
import { parseAppDate, formatDateFr } from '../../core/utils/dateUtils';

// Configure notification handler (wrapped in try-catch for safety)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AutoSuivi TN',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F97316',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'a52132e3-7b24-4c1b-9315-46625e580b8a',
    });
    return tokenData?.data ?? null;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const scheduleMaintenanceReminder = async (
  title: string,
  body: string,
  triggerDate: Date,
  data: Record<string, any> = { type: 'maintenance_reminder' },
): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return null;

    // Don't schedule if the date is in the past
    if (triggerDate.getTime() <= Date.now()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return id;
  } catch (error) {
    console.error('Error scheduling maintenance reminder:', error);
    return null;
  }
};

export const scheduleReminderSevenDaysBefore = async (
  title: string,
  body: string,
  eventDateValue: string | Date | null | undefined,
  data: Record<string, any> = {},
): Promise<string | null> => {
  const eventDate = parseAppDate(eventDateValue);
  if (!eventDate) return null;

  const triggerDate = new Date(eventDate);
  triggerDate.setDate(triggerDate.getDate() - 7);

  return scheduleMaintenanceReminder(title, body, triggerDate, {
    reminderDaysBefore: 7,
    eventDate: eventDate.toISOString(),
    ...data,
  });
};

export const scheduleKmReminder = async (
  title: string,
  body: string,
  kmTarget: number,
  currentKm: number,
  avgKmPerDay: number,
): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return null;

    const effectiveAvg = avgKmPerDay > 0 ? avgKmPerDay : 30;
    // Schedule notification 500km before the target
    const kmUntilNotification = Math.max(0, kmTarget - currentKm - 500);
    const daysUntilNotification = Math.max(1, Math.round(kmUntilNotification / effectiveAvg));

    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + daysUntilNotification);

    // Don't schedule if the date is in the past or too close
    if (triggerDate.getTime() <= Date.now() + 60000) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'km_reminder', kmTarget },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    return id;
  } catch (error) {
    console.error('Error scheduling km reminder:', error);
    return null;
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

export const updateNotificationsFromPredictions = async (
  predictions: PredictionItem[],
  currentMileage: number,
  avgKmPerDay: number,
  deadlines: Deadline[] = [],
): Promise<void> => {
  try {
    if (Platform.OS === 'web') return;

    // Cancel existing scheduled notifications before rescheduling
    await cancelAllNotifications();

    for (const item of (predictions ?? [])) {
      // Schedule km-based reminder (500km before next maintenance)
      if ((item?.estimatedKm ?? 0) > currentMileage) {
        await scheduleKmReminder(
          `🔧 ${item?.label ?? 'Maintenance'}`,
          `Plus que ~500 km avant ${item?.label ?? 'maintenance'} (à ${(item?.estimatedKm ?? 0).toLocaleString()} km)`,
          item?.estimatedKm ?? 0,
          currentMileage,
          avgKmPerDay,
        );
      }

      // Schedule date-based reminder (7 days before estimated date)
      if (item?.estimatedDate) {
        await scheduleReminderSevenDaysBefore(
          `${item?.label ?? 'Maintenance'} dans 7 jours`,
          `Prévu le ${formatDateFr(item.estimatedDate)} à ~${(item?.estimatedKm ?? 0).toLocaleString()} km`,
          item.estimatedDate,
          { type: 'maintenance_date_reminder', maintenanceType: item?.type },
        );
      }
    }

    for (const deadline of (deadlines ?? [])) {
      if (!deadline?.expiryDate) continue;

      const label = DeadlineLabels[deadline.type] ?? deadline.type;
      await scheduleReminderSevenDaysBefore(
        `${label} expire dans 7 jours`,
        `Échéance prévue le ${formatDateFr(deadline.expiryDate)}.`,
        deadline.expiryDate,
        { type: 'deadline_reminder', deadlineType: deadline.type, deadlineId: deadline.id },
      );
    }
  } catch (error) {
    console.error('Error updating notifications from predictions:', error);
  }
};

export const updateLocalReminders = async (
  predictions: PredictionItem[],
  deadlines: Deadline[],
  currentMileage: number,
  avgKmPerDay: number,
): Promise<void> => {
  await updateNotificationsFromPredictions(
    predictions,
    currentMileage,
    avgKmPerDay,
    deadlines,
  );
};
