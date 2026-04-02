import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputField, GradientButton, GlassCard, CustomAlert } from '../../src/presentation/components';
import { Colors, Spacing, BorderRadius } from '../../src/core/constants';
import { useVehicle } from '../../src/presentation/context/VehicleContext';

interface IntervalConfig {
  oilChangeKm: string;
  oilChangeMonths: string;
  airFilterKm: string;
  oilFilterKm: string;
  brakeCheckKm: string;
  tireRotationKm: string;
  timingBeltKm: string;
}

export default function IntervalsSettingsScreen() {
  const { activeVehicle, updateMaintenanceIntervals, maintenanceIntervals } = useVehicle();
  const [saving, setSaving] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success',
  });
  const [config, setConfig] = useState<IntervalConfig>({
    oilChangeKm: '10000',
    oilChangeMonths: '12',
    airFilterKm: '20000',
    oilFilterKm: '10000',
    brakeCheckKm: '30000',
    tireRotationKm: '15000',
    timingBeltKm: '100000',
  });

  useEffect(() => {
    if (maintenanceIntervals) {
      setConfig({
        oilChangeKm: maintenanceIntervals.oilChangeKm?.toString() || '10000',
        oilChangeMonths: maintenanceIntervals.oilChangeMonths?.toString() || '12',
        airFilterKm: maintenanceIntervals.airFilterKm?.toString() || '20000',
        oilFilterKm: maintenanceIntervals.oilFilterKm?.toString() || '10000',
        brakeCheckKm: maintenanceIntervals.brakeCheckKm?.toString() || '30000',
        tireRotationKm: maintenanceIntervals.tireRotationKm?.toString() || '15000',
        timingBeltKm: maintenanceIntervals.timingBeltKm?.toString() || '100000',
      });
    }
  }, [maintenanceIntervals]);

  const updateField = (field: keyof IntervalConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMaintenanceIntervals({
        oilChangeKm: parseInt(config.oilChangeKm, 10) || 10000,
        oilChangeMonths: parseInt(config.oilChangeMonths, 10) || 12,
        airFilterKm: parseInt(config.airFilterKm, 10) || 20000,
        oilFilterKm: parseInt(config.oilFilterKm, 10) || 10000,
        brakeCheckKm: parseInt(config.brakeCheckKm, 10) || 30000,
        tireRotationKm: parseInt(config.tireRotationKm, 10) || 15000,
        timingBeltKm: parseInt(config.timingBeltKm, 10) || 100000,
      });
      setAlertConfig({
        title: 'Succès',
        message: 'Intervalles de maintenance mis à jour',
        type: 'success',
      });
      setAlertVisible(true);
    } catch (error) {
      setAlertConfig({
        title: 'Erreur',
        message: 'Impossible de sauvegarder les intervalles',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertConfig.type === 'success') {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Intervalles Maintenance</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeVehicle && (
            <GlassCard style={styles.vehicleInfo}>
              <Ionicons name="car-sport" size={24} color={Colors.primary} />
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>
                  {activeVehicle.brand} {activeVehicle.model}
                </Text>
                <Text style={styles.vehiclePlate}>{activeVehicle.plate}</Text>
              </View>
            </GlassCard>
          )}

          <Text style={styles.sectionTitle}>Vidange & Huile</Text>
          <GlassCard style={styles.section}>
            <InputField
              label="Intervalle vidange (km)"
              value={config.oilChangeKm}
              onChangeText={(v) => updateField('oilChangeKm', v)}
              keyboardType="number-pad"
              placeholder="10000"
            />
            <InputField
              label="Intervalle vidange (mois)"
              value={config.oilChangeMonths}
              onChangeText={(v) => updateField('oilChangeMonths', v)}
              keyboardType="number-pad"
              placeholder="12"
            />
            <InputField
              label="Filtre à huile (km)"
              value={config.oilFilterKm}
              onChangeText={(v) => updateField('oilFilterKm', v)}
              keyboardType="number-pad"
              placeholder="10000"
            />
          </GlassCard>

          <Text style={styles.sectionTitle}>Filtres & Freins</Text>
          <GlassCard style={styles.section}>
            <InputField
              label="Filtre à air (km)"
              value={config.airFilterKm}
              onChangeText={(v) => updateField('airFilterKm', v)}
              keyboardType="number-pad"
              placeholder="20000"
            />
            <InputField
              label="Contrôle freins (km)"
              value={config.brakeCheckKm}
              onChangeText={(v) => updateField('brakeCheckKm', v)}
              keyboardType="number-pad"
              placeholder="30000"
            />
          </GlassCard>

          <Text style={styles.sectionTitle}>Pneus & Distribution</Text>
          <GlassCard style={styles.section}>
            <InputField
              label="Rotation pneus (km)"
              value={config.tireRotationKm}
              onChangeText={(v) => updateField('tireRotationKm', v)}
              keyboardType="number-pad"
              placeholder="15000"
            />
            <InputField
              label="Courroie de distribution (km)"
              value={config.timingBeltKm}
              onChangeText={(v) => updateField('timingBeltKm', v)}
              keyboardType="number-pad"
              placeholder="100000"
            />
          </GlassCard>

          <GradientButton
            title="Enregistrer"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={handleAlertClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  vehiclePlate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  section: {
    paddingTop: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
