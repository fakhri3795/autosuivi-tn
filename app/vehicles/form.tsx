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
import { Picker } from '@react-native-picker/picker';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { InputField, GradientButton, GlassCard, CustomAlert } from '../../src/presentation/components';
import { ThemedDatePicker } from '../../src/presentation/components/ThemedDatePicker';
import { Colors, Spacing, BorderRadius } from '../../src/core/constants';

const VEHICLE_CATALOG: Record<string, string[]> = {
  Peugeot: ['208', '308', '2008', '3008', 'Partner'],
  Renault: ['Clio', 'Megane', 'Symbol', 'Captur', 'Kangoo'],
  Volkswagen: ['Polo', 'Golf', 'Passat', 'Tiguan', 'Caddy'],
  FIAT: ['Punto', 'Tipo', '500', 'Panda', 'Doblo'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento'],
  Hyundai: ['i10', 'i20', 'i30', 'Tucson', 'Accent'],
  Toyota: ['Yaris', 'Corolla', 'Hilux', 'RAV4', 'C-HR'],
  Citroën: ['C3', 'C4', 'Berlingo', 'C-Elysée', 'Aircross'],
  Dacia: ['Sandero', 'Logan', 'Duster', 'Dokker', 'Lodgy'],
  Ford: ['Fiesta', 'Focus', 'Kuga', 'Transit', 'Ranger'],
};

const VEHICLE_BRANDS = Object.keys(VEHICLE_CATALOG);

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
    } catch (error: any) {
      const msg = error?.message || 'Impossible d\'ajouter le véhicule. Vérifiez votre connexion et réessayez.';
      setAlertConfig({
        title: 'Erreur',
        message: msg,
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

  const updateBrand = (brand: string) => {
    const models = VEHICLE_CATALOG[brand] ?? [];
    setFormData(prev => ({
      ...prev,
      brand,
      model: models.includes(prev.model) ? prev.model : '',
    }));
    setErrors(prev => ({ ...prev, brand: '', model: '' }));
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
      <Text style={styles.fieldLabel}>Marque</Text>
      <View style={[styles.selectBox, errors.brand && styles.selectBoxError]}>
        <Picker
          selectedValue={formData.brand}
          onValueChange={updateBrand}
          dropdownIconColor={Colors.primary}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Choisir une marque" value="" color={Colors.textMuted} />
          {VEHICLE_BRANDS.map((brand) => (
            <Picker.Item key={brand} label={brand} value={brand} color={Colors.textPrimary} />
          ))}
        </Picker>
      </View>
      {errors.brand ? <Text style={styles.errorText}>{errors.brand}</Text> : null}

      <Text style={styles.fieldLabel}>Modèle</Text>
      <View style={[styles.selectBox, errors.model && styles.selectBoxError, !formData.brand && styles.selectBoxDisabled]}>
        <Picker
          enabled={!!formData.brand}
          selectedValue={formData.model}
          onValueChange={(value) => updateField('model', value)}
          dropdownIconColor={formData.brand ? Colors.primary : Colors.textMuted}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label={formData.brand ? 'Choisir un modèle' : 'Choisissez d’abord une marque'} value="" color={Colors.textMuted} />
          {(VEHICLE_CATALOG[formData.brand] ?? []).map((model) => (
            <Picker.Item key={model} label={model} value={model} color={Colors.textPrimary} />
          ))}
        </Picker>
      </View>
      {errors.model ? <Text style={styles.errorText}>{errors.model}</Text> : null}
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
      <ThemedDatePicker
        visible={showInsurancePicker}
        date={insuranceDate || new Date()}
        onConfirm={(date) => {
          setInsuranceDate(date);
          setShowInsurancePicker(false);
        }}
        onDismiss={() => setShowInsurancePicker(false)}
        minimumDate={new Date()}
        label="Date d'expiration assurance"
      />
      <ThemedDatePicker
        visible={showVignettePicker}
        date={vignetteDate || new Date()}
        onConfirm={(date) => {
          setVignetteDate(date);
          setShowVignettePicker(false);
        }}
        onDismiss={() => setShowVignettePicker(false)}
        minimumDate={new Date()}
        label="Date d'expiration vignette"
      />
      <ThemedDatePicker
        visible={showTechnicalPicker}
        date={technicalVisitDate || new Date()}
        onConfirm={(date) => {
          setTechnicalVisitDate(date);
          setShowTechnicalPicker(false);
        }}
        onDismiss={() => setShowTechnicalPicker(false)}
        minimumDate={new Date()}
        label="Date visite technique"
      />
      <ThemedDatePicker
        visible={showOilChangePicker}
        date={lastOilChangeDate || new Date()}
        onConfirm={(date) => {
          setLastOilChangeDate(date);
          setShowOilChangePicker(false);
        }}
        onDismiss={() => setShowOilChangePicker(false)}
        maximumDate={new Date()}
        label="Date dernière vidange"
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  selectBox: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  selectBoxError: {
    borderColor: Colors.danger,
  },
  selectBoxDisabled: {
    opacity: 0.65,
  },
  picker: {
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBackground,
  },
  pickerItem: {
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
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
