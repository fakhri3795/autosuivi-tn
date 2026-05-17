import React, { ReactNode } from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../core/constants';

interface GlassCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  onPress,
  style,
  padding = Spacing.md,
}) => {
  const content = (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
  
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }
  
  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
});
