import React, { useCallback } from 'react';
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
import { VehicleCard, GradientButton } from '../../src/presentation/components';
import { Colors, Spacing } from '../../src/core/constants';
import { Vehicle } from '../../src/domain/entities/Vehicle';

export default function VehiclesScreen() {
  const { vehicles, setActiveVehicle, refreshData } = useVehicle();

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const handleSelectVehicle = async (vehicleId: string) => {
    await setActiveVehicle(vehicleId);
    router.push('/tabs');
  };

  const handleEditVehicle = (vehicleId: string) => {
    router.push(`/vehicles/edit?vehicleId=${vehicleId}`);
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <VehicleCard
      vehicle={item}
      onPress={() => handleSelectVehicle(item.id)}
      onEdit={() => handleEditVehicle(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={80} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>Aucun véhicule</Text>
      <Text style={styles.emptySubtitle}>Ajoutez votre premier véhicule pour commencer le suivi</Text>
      <GradientButton
        title="Ajouter un véhicule"
        onPress={() => router.push('/vehicles/form')}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Véhicules</Text>
      </View>

      <FlatList
        data={vehicles ?? []}
        keyExtractor={(item) => item?.id ?? ''}
        renderItem={renderVehicle}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
      />

      {(vehicles?.length ?? 0) > 0 && (
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/vehicles/form')}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </Pressable>
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
    padding: Spacing.md,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.xl,
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
