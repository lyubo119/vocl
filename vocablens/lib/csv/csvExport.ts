import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { VocabItem } from '../db/schema';

/**
 * Exports vocabulary items as a CSV file with only word and translation columns.
 * Triggers the native share sheet so the user can save/send the file.
 */
export const exportVocabToCsv = async (vocabItems: VocabItem[], workspaceName: string): Promise<void> => {
  // Build CSV content — word,translation only
  const header = 'word,translation';
  const rows = vocabItems.map(item => {
    // Escape commas and quotes in values
    const word = escapeCsvField(item.word);
    const translation = escapeCsvField(item.translation);
    return `${word},${translation}`;
  });

  const csvContent = [header, ...rows].join('\n');

  // Write to a temp file
  const sanitizedName = workspaceName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `vocab_${sanitizedName}_${Date.now()}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Vocabulary',
      UTI: 'public.comma-separated-values-text',
    });
  }
};

/**
 * Escapes a CSV field value — wraps in quotes if it contains commas, quotes, or newlines.
 */
const escapeCsvField = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};
