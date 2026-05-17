import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { DeadlineCard, CustomAlert } from '../../src/presentation/components';
import { ThemedDatePicker } from '../../src/presentation/components/ThemedDatePicker';
import { Colors, Spacing, DeadlineType, DeadlineLabels } from '../../src/core/constants';
import { Deadline } from '../../src/domain/entities/Deadline';

export default function DeadlinesScreen() {
  const { activeVehicle, deadlines, updateDeadline, refreshData } = useVehicle();
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success',
  });

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const handleEditDeadline = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setSelectedDate(deadline?.expiryDate ? new Date(deadline.expiryDate) : new Date());
    setShowDatePicker(true);
  };

  const handleDateConfirm = async (date: Date) => {
    setShowDatePicker(false);
    setSelectedDate(date);

    if (!editingDeadline) return;

    setSaving(true);
    try {
      await updateDeadline(editingDeadline.type, date.toISOString());
      setEditingDeadline(null);
      setAlertConfig({
        title: 'Succès',
        message: 'Échéance mise à jour',
        type: 'success',
      });
      setAlertVisible(true);
    } catch (error) {
      console.error('Save deadline error:', error);
      setAlertConfig({
        title: 'Erreur',
        message: 'Impossible de mettre à jour l\'échéance',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDateDismiss = () => {
    setShowDatePicker(false);
    setEditingDeadline(null);
  };

  const getOrCreateDeadline = (type: DeadlineType): Deadline => {
    const existing = deadlines?.find(d => d?.type === type);
    if (existing) return existing;
    
    return {
      id: type,
      vehicleId: activeVehicle?.id ?? '',
      type,
      expiryDate: null,
      daysRemaining: 0,
      status: 'expired',
      updatedAt: new Date().toISOString(),
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Échéances</Text>
        {activeVehicle && (
          <Text style={styles.subtitle}>
            {activeVehicle?.brand} {activeVehicle?.model}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {Object.values(DeadlineType).map((type) => {
          const deadline = getOrCreateDeadline(type);
          return (
            <DeadlineCard
              key={type}
              deadline={deadline}
              onEdit={() => handleEditDeadline(deadline)}
            />
          );
        })}
      </ScrollView>

      {/* Themed Date Picker Modal - works on all platforms */}
      <ThemedDatePicker
        visible={showDatePicker}
        date={selectedDate}
        onConfirm={handleDateConfirm}
        onDismiss={handleDateDismiss}
        minimumDate={new Date()}
        label={`Modifier ${DeadlineLabels[editingDeadline?.type as DeadlineType] ?? 'Échéance'}`}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
