import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaintenanceRecord } from '../../domain/entities/Maintenance';
import { MaintenanceLabels, MaintenanceType, Colors, BorderRadius, Spacing } from '../../core/constants';
import { formatDateFr } from '../../core/utils/dateUtils';

interface MaintenanceItemProps {
  record: MaintenanceRecord;
  onEdit?: () => void;
  onDelete?: () => void;
}

const getIconForType = (type: MaintenanceType): string => {
  const icons: Record<MaintenanceType, string> = {
    [MaintenanceType.VIDANGE]: 'water-outline',
    [MaintenanceType.FILTRE_HUILE]: 'filter-outline',
    [MaintenanceType.FILTRE_AIR]: 'leaf-outline',
    [MaintenanceType.FILTRE_HABITACLE]: 'home-outline',
    [MaintenanceType.FREINS]: 'stop-circle-outline',
    [MaintenanceType.PNEUS]: 'ellipse-outline',
    [MaintenanceType.COURROIE_DISTRIBUTION]: 'git-network-outline',
  };
  return icons[type] ?? 'build-outline';
};

export const MaintenanceItem: React.FC<MaintenanceItemProps> = ({ record, onEdit, onDelete }) => {
  const formattedDate = formatDateFr(record?.date);
    
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIconForType(record?.type ?? MaintenanceType.VIDANGE) as any}
          size={24}
          color={Colors.primary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.type}>
          {MaintenanceLabels[record?.type ?? MaintenanceType.VIDANGE] ?? record?.type}
        </Text>
        <Text style={styles.details}>
          {formattedDate} • {(record?.mileage ?? 0).toLocaleString()} km
        </Text>
        {record?.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {record.notes}
          </Text>
        )}
      </View>
      <View style={styles.trailing}>
        {record?.cost !== null && record?.cost !== undefined && (
          <View style={styles.costBadge}>
            <Text style={styles.costText}>{record.cost} TND</Text>
          </View>
        )}
        <View style={styles.actions}>
          <Pressable style={styles.iconButton} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  details: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  costBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  costText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
