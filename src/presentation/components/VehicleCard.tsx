import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../../domain/entities/Vehicle';
import { Colors, BorderRadius, Spacing } from '../../core/constants';
import { GlassCard } from './GlassCard';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  onEdit?: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  onEdit,
}) => {
  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="car-sport" size={32} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>
            {vehicle?.brand ?? ''} {vehicle?.model ?? ''}
          </Text>
          <Text style={styles.year}>{vehicle?.year ?? ''}</Text>
          <Text style={styles.plate}>{vehicle?.plate ?? ''}</Text>
        </View>
        <View style={styles.right}>
          <View style={styles.kmBadge}>
            <Text style={styles.kmText}>
              {(vehicle?.currentMileage ?? 0).toLocaleString()} km
            </Text>
          </View>
          {vehicle?.isActive && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
              style={styles.activeIcon}
            />
          )}
        </View>
      </View>
      {onEdit && (
        <Pressable onPress={onEdit} style={styles.editButton}>
          <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
        </Pressable>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  year: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  plate: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  kmBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  kmText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  activeIcon: {
    marginTop: Spacing.sm,
  },
  editButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
  },
});
