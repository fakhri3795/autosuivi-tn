import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { DatePickerModal, registerTranslation } from 'react-native-paper-dates';
import { Colors } from '../../core/constants';

// Register French locale for react-native-paper-dates (wrapped in try-catch for safety)
try {
  registerTranslation('fr', {
    save: 'Enregistrer',
    selectSingle: 'Sélectionner une date',
    selectMultiple: 'Sélectionner des dates',
    selectRange: 'Sélectionner une plage',
    notAccordingToDateFormat: (inputFormat: string) =>
      `Le format de la date doit être ${inputFormat}`,
    mustBeHigherThan: (date: string) => `Doit être après ${date}`,
    mustBeLowerThan: (date: string) => `Doit être avant ${date}`,
    mustBeBetween: (startDate: string, endDate: string) =>
      `Doit être entre ${startDate} et ${endDate}`,
    dateIsDisabled: 'Ce jour n\'est pas autorisé',
    previous: 'Précédent',
    next: 'Suivant',
    typeInDate: 'Saisir la date',
    pickDateFromCalendar: 'Choisir depuis le calendrier',
    close: 'Fermer',
    hour: 'Heure',
    minute: 'Minute',
  });
} catch (e) {
  console.warn('Failed to register French translation for DatePicker:', e);
}

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    onPrimary: Colors.white,
    primaryContainer: Colors.primaryDark,
    onPrimaryContainer: Colors.white,
    surface: Colors.surface,
    onSurface: Colors.textPrimary,
    surfaceVariant: Colors.surfaceLight,
    onSurfaceVariant: Colors.textSecondary,
    background: Colors.background,
    onBackground: Colors.textPrimary,
    secondaryContainer: Colors.primary,
    onSecondaryContainer: Colors.white,
    outline: Colors.glassBorder,
    elevation: {
      level0: 'transparent',
      level1: Colors.surface,
      level2: Colors.surfaceLight,
      level3: Colors.surfaceLight,
      level4: Colors.surfaceLight,
      level5: Colors.surfaceLight,
    },
  },
};

interface ThemedDatePickerProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
}

export const ThemedDatePicker: React.FC<ThemedDatePickerProps> = ({
  visible,
  date,
  onConfirm,
  onDismiss,
  minimumDate,
  maximumDate,
  label,
}) => {
  const handleConfirm = (params: { date: Date | undefined }) => {
    if (params?.date) {
      onConfirm(params.date);
    }
  };

  return (
    <PaperProvider theme={darkTheme}>
      <DatePickerModal
        locale="fr"
        mode="single"
        visible={visible}
        onDismiss={onDismiss}
        date={date}
        onConfirm={handleConfirm}
        validRange={{
          startDate: minimumDate,
          endDate: maximumDate,
        }}
        label={label ?? 'Sélectionner une date'}
        saveLabel="Confirmer"
        animationType="slide"
      />
    </PaperProvider>
  );
};

const styles = StyleSheet.create({});
