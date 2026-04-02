import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Gradients } from '../../core/constants';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        { opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={Gradients.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
