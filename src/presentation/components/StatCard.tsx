import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../../core/constants';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  iconColor = Colors.primary,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={20} color={iconColor} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.glassBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
