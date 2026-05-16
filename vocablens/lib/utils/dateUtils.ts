const pad2 = (value: number): string => value.toString().padStart(2, '0');

export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

export const parseLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getTodayDateString = (): string => formatLocalDate(new Date());

export const isSameDay = (date1: string, date2: string): boolean => date1 === date2;

export const getDaysBetween = (date1: string, date2: string): number => {
  const d1 = parseLocalDateString(date1);
  const d2 = parseLocalDateString(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
