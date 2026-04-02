import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { InputField, GradientButton, GlassCard, CrossPlatformDatePicker, CustomAlert } from '../../src/presentation/components';
import { Colors, Spacing, BorderRadius } from '../../src/core/constants';

export default function VehicleFormScreen() {
  const { addVehicleWithData } = useVehicle();
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' }>({
    title: '',
    message: '',
    type: 'success',
  });
  
  // Step 1: Vehicle info
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    plate: '',
    initialMileage: '',
  });
  
  // Step 2: Deadlines
  const [insuranceDate, setInsuranceDate] = useState<Date | null>(null);
  const [vignetteDate, setVignetteDate] = useState<Date | null>(null);
  const [technicalVisitDate, setTechnicalVisitDate] = useState<Date | null>(null);
  const [showInsurancePicker, setShowInsurancePicker] = useState(false);
  const [showVignettePicker, setShowVignettePicker] = useState(false);
  const [showTechnicalPicker, setShowTechnicalPicker] = useState(false);
  
  // Step 3: Last maintenance
  const [lastOilChangeDate, setLastOilChangeDate] = useState<Date | null>(null);
  const [lastOilChangeKm, setLastOilChangeKm] = useState('');
  const [showOilChangePicker, setShowOilChangePicker] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const totalSteps = 3;

  const validateStep1 = (): boolean => {
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
    
    const km = parseInt(formData.initialMileage, 10);
    if (!formData.initialMileage?.trim() || isNaN(km)) {
      newErrors.initialMileage = 'Kilométrage requis';
    } else if (km < 0) {
      newErrors.initialMileage = 'Kilométrage positif';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await addVehicleWithData({
        vehicle: {
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          year: parseInt(formData.year, 10),
          plate: formData.plate.trim().toUpperCase(),
          initialMileage: parseInt(formData.initialMileage, 10),
          currentMileage: parseInt(formData.initialMileage, 10),
        },
        deadlines: {
          insurance: insuranceDate?.toISOString() || null,
          vignette: vignetteDate?.toISOString() || null,
          technicalVisit: technicalVisitDate?.toISOString() || null,
        },
        lastMaintenance: {
          oilChangeDate: lastOilChangeDate?.toISOString() || null,
          oilChangeKm: lastOilChangeKm ? parseInt(lastOilChangeKm, 10) : null,
        },
      });
      setAlertConfig({
        title: 'Succès',
        message: 'Véhicule ajouté avec succès',
        type: 'success',
      });
      setAlertVisible(true);
    } catch (error) {
      setAlertConfig({
        title: 'Erreur',
        message: 'Impossible d\'ajouter le véhicule',
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Non définie';
    return date.toLocaleDateString('fr-TN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepRow}>
          <View style={[styles.stepDot, currentStep >= step && styles.stepDotActive]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={14} color={Colors.white} />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                {step}
              </Text>
            )}
          </View>
          {step < 3 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Informations du véhicule</Text>
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
        value={formData.initialMileage}
        onChangeText={(v) => updateField('initialMileage', v)}
        placeholder="Ex: 15000"
        keyboardType="number-pad"
        error={errors.initialMileage}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Échéances administratives</Text>
      <Text style={styles.stepSubtitle}>Entrez les dates d'expiration</Text>

      <Pressable onPress={() => setShowInsurancePicker(!showInsurancePicker)}>
        <GlassCard style={styles.dateCard}>
          <View style={styles.dateCardContent}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <View style={styles.dateCardInfo}>
              <Text style={styles.dateCardLabel}>Assurance</Text>
              <Text style={styles.dateCardValue}>{formatDate(insuranceDate)}</Text>
            </View>
          </View>
          <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
        </GlassCard>
      </Pressable>
      {showInsurancePicker && (
        <View style={styles.pickerContainer}>
          <CrossPlatformDatePicker
            value={insuranceDate || new Date()}
            onChange={(date) => {
              setInsuranceDate(date);
              if (Platform.OS !== 'ios') setShowInsurancePicker(false);
            }}
            minimumDate={new Date()}
          />
          {Platform.OS === 'web' && (
            <Pressable style={styles.closePicker} onPress={() => setShowInsurancePicker(false)}>
              <Text style={styles.closePickerText}>Fermer</Text>
            </Pressable>
          )}
        </View>
      )}

      <Pressable onPress={() => setShowVignettePicker(!showVignettePicker)}>
        <GlassCard style={styles.dateCard}>
          <View style={styles.dateCardContent}>
            <Ionicons name="document-text-outline" size={24} color={Colors.warning} />
            <View style={styles.dateCardInfo}>
              <Text style={styles.dateCardLabel}>Vignette</Text>
              <Text style={styles.dateCardValue}>{formatDate(vignetteDate)}</Text>
            </View>
          </View>
          <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
        </GlassCard>
      </Pressable>
      {showVignettePicker && (
        <View style={styles.pickerContainer}>
          <CrossPlatformDatePicker
            value={vignetteDate || new Date()}
            onChange={(date) => {
              setVignetteDate(date);
              if (Platform.OS !== 'ios') setShowVignettePicker(false);
            }}
            minimumDate={new Date()}
          />
          {Platform.OS === 'web' && (
            <Pressable style={styles.closePicker} onPress={() => setShowVignettePicker(false)}>
              <Text style={styles.closePickerText}>Fermer</Text>
            </Pressable>
          )}
        </View>
      )}

      <Pressable onPress={() => setShowTechnicalPicker(!showTechnicalPicker)}>
        <GlassCard style={styles.dateCard}>
          <View style={styles.dateCardContent}>
            <Ionicons name="car-outline" size={24} color={Colors.success} />
            <View style={styles.dateCardInfo}>
              <Text style={styles.dateCardLabel}>Visite technique</Text>
              <Text style={styles.dateCardValue}>{formatDate(technicalVisitDate)}</Text>
            </View>
          </View>
          <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
        </GlassCard>
      </Pressable>
      {showTechnicalPicker && (
        <View style={styles.pickerContainer}>
          <CrossPlatformDatePicker
            value={technicalVisitDate || new Date()}
            onChange={(date) => {
              setTechnicalVisitDate(date);
              if (Platform.OS !== 'ios') setShowTechnicalPicker(false);
            }}
            minimumDate={new Date()}
          />
          {Platform.OS === 'web' && (
            <Pressable style={styles.closePicker} onPress={() => setShowTechnicalPicker(false)}>
              <Text style={styles.closePickerText}>Fermer</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Dernière vidange</Text>
      <Text style={styles.stepSubtitle}>Pour calculer la prochaine maintenance</Text>

      <Pressable onPress={() => setShowOilChangePicker(!showOilChangePicker)}>
        <GlassCard style={styles.dateCard}>
          <View style={styles.dateCardContent}>
            <Ionicons name="water-outline" size={24} color={Colors.primary} />
            <View style={styles.dateCardInfo}>
              <Text style={styles.dateCardLabel}>Date dernière vidange</Text>
              <Text style={styles.dateCardValue}>{formatDate(lastOilChangeDate)}</Text>
            </View>
          </View>
          <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
        </GlassCard>
      </Pressable>
      {showOilChangePicker && (
        <View style={styles.pickerContainer}>
          <CrossPlatformDatePicker
            value={lastOilChangeDate || new Date()}
            onChange={(date) => {
              setLastOilChangeDate(date);
              if (Platform.OS !== 'ios') setShowOilChangePicker(false);
            }}
            maximumDate={new Date()}
          />
          {Platform.OS === 'web' && (
            <Pressable style={styles.closePicker} onPress={() => setShowOilChangePicker(false)}>
              <Text style={styles.closePickerText}>Fermer</Text>
            </Pressable>
          )}
        </View>
      )}

      <InputField
        label="Kilométrage à la dernière vidange"
        value={lastOilChangeKm}
        onChangeText={setLastOilChangeKm}
        placeholder="Ex: 12000"
        keyboardType="number-pad"
      />

      <GlassCard style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
        <Text style={styles.infoText}>
          La prochaine vidange sera calculée selon les intervalles définis dans les paramètres.
        </Text>
      </GlassCard>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name={currentStep === 1 ? "close" : "arrow-back"} size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Nouveau Véhicule</Text>
        <Text style={styles.stepText}>{currentStep}/{totalSteps}</Text>
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <View style={styles.buttonRow}>
            {currentStep < totalSteps ? (
              <GradientButton
                title="Suivant"
                onPress={handleNext}
                style={styles.button}
              />
            ) : (
              <GradientButton
                title="Enregistrer"
                onPress={handleSave}
                loading={saving}
                style={styles.button}
              />
            )}
          </View>

          {currentStep > 1 && (
            <Pressable style={styles.skipButton} onPress={currentStep === totalSteps ? handleSave : handleNext}>
              <Text style={styles.skipButtonText}>
                {currentStep === totalSteps ? 'Passer et enregistrer' : 'Passer cette étape'}
              </Text>
            </Pressable>
          )}
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
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.glassBorder,
    marginHorizontal: Spacing.xs,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dateCardInfo: {
    flex: 1,
  },
  dateCardLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dateCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  pickerContainer: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  closePicker: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  closePickerText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${Colors.primary}15`,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  buttonRow: {
    marginTop: Spacing.xl,
  },
  button: {
    width: '100%',
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
