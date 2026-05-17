import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../core/constants';

interface CrossPlatformDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  visible?: boolean;
  onClose?: () => void;
}

export const CrossPlatformDatePicker: React.FC<CrossPlatformDatePickerProps> = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  visible = true,
  onClose,
}) => {
  const [tempDate, setTempDate] = useState(value);

  // Sync tempDate when value prop changes
  useEffect(() => {
    setTempDate(value);
  }, [value]);

  // For web, use native date input
  if (Platform.OS === 'web') {
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const handleWebDateChange = (dateString: string) => {
      if (dateString) {
        const newDate = new Date(dateString + 'T12:00:00');
        if (!isNaN(newDate.getTime())) {
          setTempDate(newDate);
          onChange(newDate);
        }
      }
    };

    return (
      <View style={styles.webContainer}>
        <TextInput
          style={styles.webDateInput}
          value={formatDateForInput(tempDate)}
          onChangeText={handleWebDateChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.webHint}>Format: AAAA-MM-JJ</Text>
      </View>
    );
  }

  // For native platforms (iOS and Android)
  // Use spinner on iOS, calendar/default on Android
  const DateTimePicker = require('@react-native-community/datetimepicker').default;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker automatically closes after selection
    // event.type can be 'set' (user selected) or 'dismissed' (user cancelled)
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        // User cancelled, do nothing
        return;
      }
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      onChange(selectedDate);
    }
  };

  return (
    <DateTimePicker
      value={tempDate}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
      onChange={handleDateChange}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      textColor={Colors.textPrimary}
      style={styles.nativePicker}
      themeVariant="dark"
    />
  );
};

const styles = StyleSheet.create({
  webContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  webDateInput: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  webHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  nativePicker: {
    width: '100%',
    height: 200,
  },
});
