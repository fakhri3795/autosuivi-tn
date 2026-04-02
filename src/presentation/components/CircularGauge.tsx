import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../core/constants';

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  colorThresholds?: { green: number; orange: number }; // Percentage thresholds
  invertColors?: boolean; // For cases where lower is better (like urgency)
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  maxValue,
  size = 100,
  strokeWidth = 8,
  label,
  sublabel,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '',
  colorThresholds = { green: 60, orange: 30 },
  invertColors = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Determine color based on thresholds
  const getColor = () => {
    const pct = invertColors ? 100 - percentage : percentage;
    if (pct >= colorThresholds.green) return Colors.success;
    if (pct >= colorThresholds.orange) return Colors.warning;
    return Colors.danger;
  };
  
  const strokeColor = getColor();
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.surfaceLight}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={styles.textContainer}>
        {showValue && (
          <Text style={[styles.value, { color: strokeColor }]}>
            {valuePrefix}{Math.round(value)}{valueSuffix}
          </Text>
        )}
        {label && <Text style={styles.label}>{label}</Text>}
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
