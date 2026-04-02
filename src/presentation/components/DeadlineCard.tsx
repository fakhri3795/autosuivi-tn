import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deadline } from '../../domain/entities/Deadline';
import { DeadlineLabels, DeadlineType, Colors, BorderRadius, Spacing } from '../../core/constants';
import { GlassCard } from './GlassCard';
import { CircularGauge } from './CircularGauge';

interface DeadlineCardProps {
  deadline: Deadline;
  onEdit?: () => void;
}

const getIconForType = (type: DeadlineType): string => {
  const icons: Record<DeadlineType, string> = {
    [DeadlineType.ASSURANCE]: 'shield-checkmark-outline',
    [DeadlineType.VIGNETTE]: 'document-text-outline',
    [DeadlineType.VISITE_TECHNIQUE]: 'car-outline',
  };
  return icons[type] ?? 'calendar-outline';
};

const getStatusInfo = (status: string, daysRemaining: number) => {
  if (status === 'expired' || daysRemaining < 0) {
    return { label: 'Expiré', color: Colors.dangerDark };
  }
  if (status === 'expiring_soon' || daysRemaining <= 60) {
    if (daysRemaining <= 15) return { label: 'Expire bientôt', color: Colors.danger };
    return { label: 'Expire bientôt', color: Colors.warning };
  }
  return { label: 'À jour', color: Colors.success };
};

export const DeadlineCard: React.FC<DeadlineCardProps> = ({ deadline, onEdit }) => {
  const statusInfo = getStatusInfo(deadline?.status ?? 'expired', deadline?.daysRemaining ?? 0);
  
  const formattedDate = deadline?.expiryDate
    ? new Date(deadline.expiryDate).toLocaleDateString('fr-TN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Non défini';
    
  // For gauge: show percentage of time remaining (max 365 days for visual)
  const maxDays = 365;
  const gaugeValue = Math.max(0, Math.min(deadline?.daysRemaining ?? 0, maxDays));
  
  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIconForType(deadline?.type ?? DeadlineType.ASSURANCE) as any}
            size={28}
            color={Colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>
            {DeadlineLabels[deadline?.type ?? DeadlineType.ASSURANCE] ?? 'Echéance'}
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>
        <View style={styles.gaugeContainer}>
          <CircularGauge
            value={gaugeValue}
            maxValue={maxDays}
            size={80}
            strokeWidth={6}
            showValue
            valueSuffix="j"
            colorThresholds={{ green: 60, orange: 15 }}
          />
        </View>
      </View>
      {onEdit && (
        <Pressable onPress={onEdit} style={styles.editButton}>
          <Text style={styles.editText}>Modifier</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  gaugeContainer: {
    marginLeft: Spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginRight: 4,
  },
});
