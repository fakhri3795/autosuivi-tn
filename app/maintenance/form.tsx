import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { InputField, GradientButton, GlassCard, CrossPlatformDatePicker } from '../../src/presentation/components';
import { Colors, Spacing, BorderRadius, MaintenanceType, MaintenanceLabels } from '../../src/core/constants';

export default function MaintenanceFormScreen() {
  const { activeVehicle, addMaintenanceRecord } = useVehicle();
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<MaintenanceType>(MaintenanceType.VIDANGE);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    mileage: activeVehicle?.currentMileage?.toString() ?? '',
    cost: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const km = parseInt(formData.mileage, 10);
    if (!formData.mileage?.trim() || isNaN(km)) {
      newErrors.mileage = 'Kilométrage requis';
    } else if (km < 0) {
      newErrors.mileage = 'Kilométrage positif';
    }
    
    if (formData.cost?.trim()) {
      const cost = parseFloat(formData.cost);
      if (isNaN(cost) || cost < 0) {
        newErrors.cost = 'Coût invalide';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      await addMaintenanceRecord({
        type: selectedType,
        date: selectedDate.toISOString(),
        mileage: parseInt(formData.mileage, 10),
        cost: formData.cost?.trim() ? parseFloat(formData.cost) : null,
        notes: formData.notes?.trim() || null,
      });
      router.back();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la maintenance');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-TN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Nouvelle Maintenance</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <Text style={styles.label}>Type de maintenance</Text>
          <View style={styles.typesGrid}>
            {Object.values(MaintenanceType).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeChip,
                  selectedType === type && styles.typeChipActive,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    selectedType === type && styles.typeChipTextActive,
                  ]}
                >
                  {MaintenanceLabels[type]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date Picker */}
          <Text style={styles.label}>Date</Text>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <GlassCard style={styles.dateCard}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </GlassCard>
          </Pressable>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <CrossPlatformDatePicker
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  if (Platform.OS !== 'ios') {
                    setShowDatePicker(false);
                  }
                }}
                maximumDate={new Date()}
              />
              {Platform.OS === 'web' && (
                <Pressable 
                  style={styles.closeDatePicker} 
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.closeDatePickerText}>Fermer</Text>
                </Pressable>
              )}
            </View>
          )}

          <InputField
            label="Kilométrage"
            value={formData.mileage}
            onChangeText={(v) => updateField('mileage', v)}
            keyboardType="number-pad"
            error={errors.mileage}
          />
          
          <InputField
            label="Coût (TND) - optionnel"
            value={formData.cost}
            onChangeText={(v) => updateField('cost', v)}
            keyboardType="decimal-pad"
            placeholder="Ex: 150"
            error={errors.cost}
          />
          
          <InputField
            label="Notes - optionnel"
            value={formData.notes}
            onChangeText={(v) => updateField('notes', v)}
            placeholder="Ex: Vidange chez le garagiste..."
            multiline
          />

          <GradientButton
            title="Enregistrer"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
  datePickerContainer: {
    marginBottom: Spacing.md,
  },
  closeDatePicker: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  closeDatePickerText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
