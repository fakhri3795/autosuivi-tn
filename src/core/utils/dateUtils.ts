export const parseAppDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateFr = (value: string | Date | null | undefined): string => {
  const date = parseAppDate(value);
  if (!date) return '';

  return date.toLocaleDateString('fr-TN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
