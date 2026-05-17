import React, { useCallback, useState } from 'react';
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
import { VehicleCard, GradientButton, CustomAlert, ConfirmDialog } from '../../src/presentation/components';
import { Colors, Spacing } from '../../src/core/constants';
import { Vehicle } from '../../src/domain/entities/Vehicle';

export default function VehiclesScreen() {
  const { vehicles, setActiveVehicle, deleteVehicle, refreshData } = useVehicle();

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ title: '', message: '', type: 'success' });

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

  const handleDeleteRequest = (vehicle: Vehicle) => {
    setDeleteTarget(vehicle);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVehicle(deleteTarget.id);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setAlertConfig({
        title: 'Supprimé',
        message: 'Voiture supprimée avec succès.',
        type: 'success',
      });
      setAlertVisible(true);
    } catch (error: any) {
      setShowDeleteConfirm(false);
      const msg =
        error?.message ||
        'Impossible de supprimer le véhicule. Vérifiez votre connexion et réessayez.';
      setAlertConfig({
        title: 'Erreur',
        message: msg,
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <VehicleCard
      vehicle={item}
      onPress={() => handleSelectVehicle(item.id)}
      onEdit={() => handleEditVehicle(item.id)}
      onDelete={() => handleDeleteRequest(item)}
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

      {/* Confirmation de suppression */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Supprimer ce véhicule ?"
        message={
          deleteTarget
            ? `Êtes-vous sûr de vouloir supprimer ${deleteTarget.brand} ${deleteTarget.model} ?`
            : ''
        }
        subtitle="Cette action est irréversible et supprimera tous les entretiens associés."
        icon="trash-outline"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />

      {/* Alerte résultat */}
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
