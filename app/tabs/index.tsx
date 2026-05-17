import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { GlassCard, CircularGauge, GradientButton } from '../../src/presentation/components';
import { Colors, Spacing, BorderRadius, DeadlineType, DeadlineLabels } from '../../src/core/constants';
import { getUrgencyColor } from '../../src/data/services/KmCalculator';

export default function DashboardScreen() {
  const {
    activeVehicle,
    vehicles,
    mileageStats,
    deadlines,
    maintenancePrediction,
    predictionAlerts,
    addMileageReading,
    refreshData,
  } = useVehicle();
  const { logout } = useAuth();
  
  const [showKmModal, setShowKmModal] = useState(false);
  const [newKm, setNewKm] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const handleSaveKm = async () => {
    const kmValue = parseInt(newKm, 10);
    if (isNaN(kmValue) || kmValue <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un kilométrage valide');
      return;
    }
    if (kmValue < (activeVehicle?.currentMileage ?? 0)) {
      Alert.alert('Erreur', 'Le kilométrage doit être supérieur au kilométrage actuel');
      return;
    }
    
    setSaving(true);
    try {
      await addMileageReading(kmValue, new Date().toISOString());
      setShowKmModal(false);
      setNewKm('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le kilométrage');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  const formatLastUpdate = () => {
    if (!mileageStats?.lastUpdate) return 'Aucune donnée';
    return new Date(mileageStats.lastUpdate).toLocaleDateString('fr-TN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!activeVehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, styles.emptyHeader]}>
          <Text style={styles.title}>AutoSuivi TN</Text>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucun véhicule</Text>
          <Text style={styles.emptySubtitle}>Ajoutez votre premier véhicule pour commencer</Text>
          <GradientButton
            title="Ajouter un véhicule"
            onPress={() => router.push('/vehicles/form')}
            style={styles.emptyButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const urgencyScore = maintenancePrediction?.urgencyScore ?? 0;
  const urgencyColor = getUrgencyColor(urgencyScore);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AutoSuivi TN</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.vehicleChip} onPress={() => router.push('/tabs/vehicles')}>
              <Text style={styles.vehicleChipText}>
                {activeVehicle?.brand} {activeVehicle?.model}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.primary} />
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            </Pressable>
          </View>
        </View>

        {/* Kilométrage Card - Clickable */}
        <GlassCard style={styles.kmCard} onPress={() => setShowKmModal(true)}>
          <Text style={styles.kmLabel}>Kilométrage actuel</Text>
          <Text style={styles.kmValue}>
            {(activeVehicle?.currentMileage ?? 0).toLocaleString()} <Text style={styles.kmUnit}>km</Text>
          </Text>
          <Text style={styles.kmSubtitle}>Dernière mise à jour: {formatLastUpdate()}</Text>
          <Text style={styles.kmTrend}>
            +{mileageStats?.avgKmPerDay ?? 0} km/jour en moyenne
          </Text>
          <View style={styles.tapHint}>
            <Ionicons name="pencil-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.tapHintText}>Appuyez pour mettre à jour</Text>
          </View>
        </GlassCard>

        {/* Échéances Section */}
        <Text style={styles.sectionTitle}>Échéances</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gaugesRow}
        >
          {Object.values(DeadlineType).map((type) => {
            const deadline = deadlines?.find(d => d?.type === type);
            const daysRemaining = deadline?.daysRemaining ?? 0;
            const maxDays = 365;
            
            return (
              <Pressable
                key={type}
                style={styles.gaugeCard}
                onPress={() => router.push('/tabs/deadlines')}
              >
                <CircularGauge
                  value={Math.max(0, daysRemaining)}
                  maxValue={maxDays}
                  size={90}
                  strokeWidth={6}
                  showValue
                  valueSuffix="j"
                  colorThresholds={{ green: 60, orange: 15 }}
                />
                <Text style={styles.gaugeLabel}>
                  {DeadlineLabels[type] ?? type}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Maintenance Prédictive Card */}
        <GlassCard style={styles.maintenanceCard} onPress={() => router.push('/tabs/maintenance')}>
          <View style={styles.maintenanceHeader}>
            <Text style={styles.maintenanceTitle}>Prochaine vidange</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
              <Text style={styles.urgencyText}>{urgencyScore}%</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${urgencyScore}%`, backgroundColor: urgencyColor },
              ]}
            />
          </View>
          <Text style={styles.maintenanceInfo}>
            Prochain à {maintenancePrediction?.nextOilChangeMileage?.toLocaleString() ?? 0} km • ~{maintenancePrediction?.kmRemaining?.toLocaleString() ?? 0} km restants
          </Text>
          <View style={styles.maintenanceLink}>
            <Text style={styles.maintenanceLinkText}>Voir détails</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        </GlassCard>

        {/* Prediction Alerts */}
        {predictionAlerts && predictionAlerts.length > 0 && (
          <View style={styles.alertsContainer}>
            {predictionAlerts.map((alert, index) => (
              <View
                key={index}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor:
                      alert.severity === 'critical'
                        ? `${Colors.danger}20`
                        : `${Colors.warning}20`,
                    borderColor:
                      alert.severity === 'critical' ? Colors.danger : Colors.warning,
                  },
                ]}
              >
                <Ionicons
                  name={alert.severity === 'critical' ? 'warning' : 'alert-circle'}
                  size={20}
                  color={alert.severity === 'critical' ? Colors.danger : Colors.warning}
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions Rapides */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={() => setShowKmModal(true)}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
            <Text style={styles.actionText}>+ Ajouter km</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => router.push('/tabs/mileage')}>
            <Ionicons name="time" size={24} color={Colors.accent} />
            <Text style={styles.actionText}>Historique</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Sheet Modal for Adding KM */}
      <Modal
        visible={showKmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKmModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowKmModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nouveau relevé kilométrique</Text>
            <TextInput
              style={styles.kmInput}
              value={newKm}
              onChangeText={setNewKm}
              keyboardType="number-pad"
              placeholder={(activeVehicle?.currentMileage ?? 0).toString()}
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <Text style={styles.kmInputLabel}>km</Text>
            <GradientButton
              title="Enregistrer"
              onPress={handleSaveKm}
              loading={saving}
              style={styles.modalButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyHeader: {
    padding: Spacing.md,
    marginBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    maxWidth: 190,
  },
  vehicleChipText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
    flexShrink: 1,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kmCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  kmLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  kmValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  kmUnit: {
    fontSize: 24,
    fontWeight: '400',
  },
  kmSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  kmTrend: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
    marginTop: 4,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  tapHintText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  gaugesRow: {
    paddingBottom: Spacing.md,
  },
  gaugeCard: {
    backgroundColor: Colors.glassBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 120,
  },
  gaugeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  maintenanceCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  maintenanceInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  maintenanceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  maintenanceLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  kmInput: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    paddingVertical: Spacing.md,
  },
  kmInputLabel: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    width: '100%',
  },
  alertsContainer: {
    marginBottom: Spacing.lg,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
});
