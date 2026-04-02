import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicle } from '../../src/presentation/context/VehicleContext';
import { StatCard, GlassCard, GradientButton } from '../../src/presentation/components';
import { Colors, Spacing, BorderRadius } from '../../src/core/constants';
import { MileageReading } from '../../src/domain/entities/MileageReading';

const { width } = Dimensions.get('window');

export default function MileageScreen() {
  const { activeVehicle, mileageReadings, mileageStats, addMileageReading, refreshData } = useVehicle();
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

  const renderReading = ({ item, index }: { item: MileageReading; index: number }) => {
    const formattedDate = item?.date
      ? new Date(item.date).toLocaleDateString('fr-TN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';
      
    return (
      <View style={[styles.readingItem, index === 0 && styles.readingItemFirst]}>
        <View style={styles.readingLeft}>
          <Text style={styles.readingDate}>{formattedDate}</Text>
        </View>
        <View style={styles.readingRight}>
          <Text style={styles.readingValue}>{(item?.value ?? 0).toLocaleString()} km</Text>
          {item?.delta !== null && item?.delta !== undefined && (
            <Text style={styles.readingDelta}>+{item.delta.toLocaleString()} km</Text>
          )}
        </View>
      </View>
    );
  };

  // Simple chart visualization using bars
  const renderChart = () => {
    const sortedReadings = [...(mileageReadings ?? [])]
      .sort((a, b) => new Date(a?.date ?? 0).getTime() - new Date(b?.date ?? 0).getTime())
      .slice(-10);
    
    if (sortedReadings.length < 2) return null;
    
    const minKm = Math.min(...sortedReadings.map(r => r?.value ?? 0));
    const maxKm = Math.max(...sortedReadings.map(r => r?.value ?? 0));
    const range = maxKm - minKm || 1;
    
    return (
      <GlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Évolution du kilométrage</Text>
        <View style={styles.chartContainer}>
          {sortedReadings.map((reading, index) => {
            const height = ((reading?.value ?? 0) - minKm) / range * 100 + 20;
            return (
              <View key={reading?.id ?? index} style={styles.barContainer}>
                <View style={[styles.bar, { height: `${height}%` }]} />
                <Text style={styles.barLabel}>
                  {new Date(reading?.date ?? 0).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </GlassCard>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="speedometer-outline" size={60} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>Aucun relevé</Text>
      <Text style={styles.emptySubtitle}>Ajoutez votre premier kilométrage</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kilométrage</Text>
        {activeVehicle && (
          <Text style={styles.subtitle}>
            {activeVehicle?.brand} {activeVehicle?.model}
          </Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="speedometer"
          value={(mileageStats?.currentMileage ?? 0).toLocaleString()}
          label="km actuel"
        />
        <StatCard
          icon="trending-up"
          value={mileageStats?.avgKmPerDay ?? 0}
          label="km/jour"
          iconColor={Colors.success}
        />
        <StatCard
          icon="document-text"
          value={mileageStats?.totalReadings ?? 0}
          label="relevés"
          iconColor={Colors.accent}
        />
      </View>

      {renderChart()}

      <Text style={styles.sectionTitle}>Historique</Text>
      <FlatList
        data={mileageReadings ?? []}
        keyExtractor={(item) => item?.id ?? ''}
        renderItem={renderReading}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
      />

      <Pressable style={styles.fab} onPress={() => setShowKmModal(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>

      {/* Modal for Adding KM */}
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
  statsRow: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  chartCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-around',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    minHeight: 20,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  readingItemFirst: {
    backgroundColor: Colors.surface,
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 0,
  },
  readingLeft: {
    flex: 1,
  },
  readingDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  readingRight: {
    alignItems: 'flex-end',
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  readingDelta: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
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
});
