import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { GlassCard, CircularGauge, MaintenanceItem } from '../../src/presentation/components';
import { Colors, Spacing, BorderRadius, MaintenanceLabels } from '../../src/core/constants';
import { getUrgencyColor, getUpcomingMaintenanceItems } from '../../src/data/services/KmCalculator';
import { MaintenanceRecord, PredictionItem } from '../../src/domain/entities/Maintenance';

export default function MaintenanceScreen() {
  const { activeVehicle, maintenanceRecords, maintenancePrediction, mileageStats, refreshData } = useVehicle();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const upcomingItems = getUpcomingMaintenanceItems(
    maintenanceRecords,
    activeVehicle?.currentMileage ?? 0,
    mileageStats,
    'mixte',
    'maintenanceIntervals'
  );

  const urgencyScore = maintenancePrediction?.urgencyScore ?? 0;
  const urgencyColor = getUrgencyColor(urgencyScore);

  const renderUpcomingItem = ({ item }: { item: PredictionItem }) => {
    const badgeColor = item?.urgency === 'red' 
      ? Colors.danger 
      : item?.urgency === 'orange' 
        ? Colors.warning 
        : Colors.success;
        
    const formattedDate = item?.estimatedDate
      ? new Date(item.estimatedDate).toLocaleDateString('fr-TN', {
          day: 'numeric',
          month: 'short',
        })
      : '';

    return (
      <View style={styles.upcomingItem}>
        <View style={styles.upcomingIconContainer}>
          <Ionicons name="build-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.upcomingInfo}>
          <Text style={styles.upcomingName}>{item?.label ?? ''}</Text>
          <Text style={styles.upcomingDate}>
            ~{(item?.estimatedKm ?? 0).toLocaleString()} km • {formattedDate}
          </Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.urgencyBadgeText}>
            {item?.urgency === 'red' ? 'Urgent' : item?.urgency === 'orange' ? 'Bientôt' : 'OK'}
          </Text>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: MaintenanceRecord }) => (
    <MaintenanceItem record={item} />
  );

  const renderEmptyHistory = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="build-outline" size={60} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>Aucune maintenance</Text>
      <Text style={styles.emptySubtitle}>Enregistrez votre première maintenance</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Maintenance</Text>
            {activeVehicle && (
              <Text style={styles.subtitle}>
                {activeVehicle?.brand} {activeVehicle?.model}
              </Text>
            )}
          </View>
          <Pressable 
            style={styles.settingsButton}
            onPress={() => router.push('/settings/intervals')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Prediction Card */}
      <GlassCard style={styles.predictionCard}>
        <View style={styles.predictionRow}>
          <View style={styles.predictionInfo}>
            <Text style={styles.predictionTitle}>Score d'urgence</Text>
            <Text style={styles.predictionSubtitle}>
              Vidange recommandée dans ~{maintenancePrediction?.kmRemaining?.toLocaleString() ?? 0} km
            </Text>
            <Text style={styles.predictionSubtitle}>
              Estimation: ~{maintenancePrediction?.daysRemaining ?? 0} jours
            </Text>
          {/*  <View style={styles.factorsRow}>
              <Text style={styles.factorText}>km: {maintenancePrediction?.factors?.kmFactor ?? 0}%</Text>
              <Text style={styles.factorText}>temps: {maintenancePrediction?.factors?.timeFactor ?? 0}%</Text>
              <Text style={styles.factorText}>conduite: {maintenancePrediction?.factors?.drivingFactor ?? 0}%</Text> 
            </View> */}
          </View>
          <CircularGauge
            value={urgencyScore}
            maxValue={100}
            size={100}
            strokeWidth={8}
            showValue
            valueSuffix="%"
            colorThresholds={{ green: 60, orange: 30 }}
            invertColors
          />
        </View>
      </GlassCard>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            À faire
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'upcoming' ? (
        <FlatList
          data={upcomingItems}
          keyExtractor={(item) => item?.type ?? ''}
          renderItem={renderUpcomingItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={maintenanceRecords ?? []}
          keyExtractor={(item) => item?.id ?? ''}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyHistory}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/maintenance/form')}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settingsButton: {
    padding: Spacing.xs,
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
  predictionCard: {
    margin: Spacing.md,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  predictionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  factorsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  factorText: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  upcomingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  upcomingName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  upcomingDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
