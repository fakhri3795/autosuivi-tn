import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { DeadlineCard, GradientButton, CustomAlert } from '../../src/presentation/components';
import { Colors, Spacing, BorderRadius, DeadlineType, DeadlineLabels } from '../../src/core/constants';
import { Deadline } from '../../src/domain/entities/Deadline';

// Import DateTimePicker only for native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function DeadlinesScreen() {
  const { activeVehicle, deadlines, updateDeadline, refreshData } = useVehicle();
  const [showModal, setShowModal] = useState(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    
    if (Platform.OS === 'android') {
      // On Android, show the picker directly (it's a dialog)
      setShowAndroidPicker(true);
    } else {
      // On iOS/Web, show our custom modal
      setShowModal(true);
    }
  };

  const handleAndroidDateChange = async (event: any, date?: Date) => {
    setShowAndroidPicker(false); // Always close the picker first
    
    if (event.type === 'dismissed' || !date) {
      // User cancelled
      setEditingDeadline(null);
      return;
    }
    
    // User selected a date - save it directly
    setSelectedDate(date);
    await saveDeadline(date);
  };

  const saveDeadline = async (date: Date) => {
    if (!editingDeadline) return;
    
    setSaving(true);
    try {
      await updateDeadline(editingDeadline.type, date.toISOString());
      setShowModal(false);
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

  const handleSaveDeadline = async () => {
    await saveDeadline(selectedDate);
  };

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('fr-TN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

      {/* Android DateTimePicker (renders as a dialog) */}
      {Platform.OS === 'android' && showAndroidPicker && DateTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="calendar"
          onChange={handleAndroidDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* iOS/Web Date Picker Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="calendar" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>
                Modifier {DeadlineLabels[editingDeadline?.type as DeadlineType] ?? 'Échéance'}
              </Text>
              <Text style={styles.modalSubtitle}>Date d'expiration</Text>
            </View>
            
            <View style={styles.selectedDateContainer}>
              <Ionicons name="time-outline" size={20} color={Colors.accent} />
              <Text style={styles.selectedDateText}>{formatSelectedDate()}</Text>
            </View>
            
            <View style={styles.pickerWrapper}>
              {Platform.OS === 'ios' && DateTimePicker ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={(event: any, date?: Date) => {
                    if (date) setSelectedDate(date);
                  }}
                  minimumDate={new Date()}
                  textColor={Colors.textPrimary}
                  themeVariant="dark"
                  style={styles.iosPicker}
                />
              ) : (
                <View style={styles.webDateContainer}>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value + 'T12:00:00');
                      if (!isNaN(newDate.getTime())) {
                        setSelectedDate(newDate);
                      }
                    }}
                    style={{
                      backgroundColor: Colors.surface,
                      color: Colors.textPrimary,
                      border: `1px solid ${Colors.glassBorder}`,
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 18,
                      width: '100%',
                    }}
                  />
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <View style={styles.saveButtonContainer}>
                <GradientButton
                  title="Enregistrer"
                  onPress={handleSaveDeadline}
                  loading={saving}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pickerWrapper: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  webDateContainer: {
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glassBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonContainer: {
    flex: 1,
  },
});
