import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { InputField, GradientButton, CustomAlert } from '../../src/presentation/components';
import { Colors, Spacing } from '../../src/core/constants';

export default function EditVehicleScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { vehicles, updateVehicle, deleteVehicle } = useVehicle();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success',
  });

  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    plate: '',
    currentMileage: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle) {
      setFormData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        plate: vehicle.plate || '',
        currentMileage: vehicle.currentMileage?.toString() || '',
      });
    }
  }, [vehicle]);

  const currentYear = new Date().getFullYear();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.brand?.trim()) {
      newErrors.brand = 'Marque requise';
    }
    
    if (!formData.model?.trim()) {
      newErrors.model = 'Modèle requis';
    }
    
    const year = parseInt(formData.year, 10);
    if (!formData.year?.trim() || isNaN(year)) {
      newErrors.year = 'Année requise';
    } else if (year < 1970 || year > currentYear) {
      newErrors.year = `Année entre 1970 et ${currentYear}`;
    }
    
    if (!formData.plate?.trim()) {
      newErrors.plate = 'Immatriculation requise';
    }
    
    const km = parseInt(formData.currentMileage, 10);
    if (!formData.currentMileage?.trim() || isNaN(km)) {
      newErrors.currentMileage = 'Kilométrage requis';
    } else if (km < 0) {
      newErrors.currentMileage = 'Kilométrage positif';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !vehicleId) return;
    
    setSaving(true);
    try {
      await updateVehicle(vehicleId, {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year, 10),
        plate: formData.plate.trim().toUpperCase(),
        currentMileage: parseInt(formData.currentMileage, 10),
      });
      setAlertConfig({
        title: 'Succès',
        message: 'Véhicule modifié avec succès',
        type: 'success',
      });
      setAlertVisible(true);
    } catch (error) {
      setAlertConfig({
        title: 'Erreur',
        message: 'Impossible de modifier le véhicule',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicleId) return;
    
    setDeleting(true);
    try {
      await deleteVehicle(vehicleId);
      setConfirmDeleteVisible(false);
      router.back();
    } catch (error) {
      setAlertConfig({
        title: 'Erreur',
        message: 'Impossible de supprimer le véhicule',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertConfig.type === 'success') {
      router.back();
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Véhicule non trouvé</Text>
          <GradientButton title="Retour" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Modifier Véhicule</Text>
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
          <InputField
            label="Marque"
            value={formData.brand}
            onChangeText={(v) => updateField('brand', v)}
            placeholder="Ex: Peugeot"
            autoCapitalize="words"
            error={errors.brand}
          />
          
          <InputField
            label="Modèle"
            value={formData.model}
            onChangeText={(v) => updateField('model', v)}
            placeholder="Ex: 208"
            autoCapitalize="words"
            error={errors.model}
          />
          
          <InputField
            label="Année"
            value={formData.year}
            onChangeText={(v) => updateField('year', v)}
            placeholder="Ex: 2020"
            keyboardType="number-pad"
            maxLength={4}
            error={errors.year}
          />
          
          <InputField
            label="Immatriculation"
            value={formData.plate}
            onChangeText={(v) => updateField('plate', v)}
            placeholder="Ex: 123 TU 4567"
            autoCapitalize="characters"
            error={errors.plate}
          />
          
          <InputField
            label="Kilométrage actuel"
            value={formData.currentMileage}
            onChangeText={(v) => updateField('currentMileage', v)}
            placeholder="Ex: 15000"
            keyboardType="number-pad"
            error={errors.currentMileage}
          />

          <GradientButton
            title="Enregistrer"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />

          <Pressable style={styles.deleteButton} onPress={() => setConfirmDeleteVisible(true)}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            <Text style={styles.deleteButtonText}>Supprimer ce véhicule</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={handleAlertClose}
      />

      {/* Delete Confirmation Modal */}
      <CustomAlert
        visible={confirmDeleteVisible}
        title="Supprimer le véhicule ?"
        message={`Êtes-vous sûr de vouloir supprimer ${vehicle.brand} ${vehicle.model} ? Cette action est irréversible.`}
        type="warning"
        onClose={() => setConfirmDeleteVisible(false)}
        buttonText="Annuler"
      />
      {confirmDeleteVisible && (
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <Ionicons name="warning" size={48} color={Colors.warning} />
            <Text style={styles.deleteTitle}>Supprimer le véhicule ?</Text>
            <Text style={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer {vehicle.brand} {vehicle.model} ? Cette action est irréversible.
            </Text>
            <View style={styles.deleteActions}>
              <Pressable style={styles.cancelButton} onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.confirmDeleteButton} onPress={handleDelete} disabled={deleting}>
                <Text style={styles.confirmDeleteText}>{deleting ? 'Suppression...' : 'Supprimer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
    paddingBottom: Spacing.xxl,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    zIndex: 100,
  },
  deleteModal: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  deleteMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.glassBackground,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
