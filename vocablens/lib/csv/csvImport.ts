import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export type CsvVocabRow = {
  word: string;
  translation: string;
};

/**
 * Opens a file picker for the user to select a CSV file,
 * parses it, and returns an array of word/translation pairs.
 */
export const pickAndParseCsv = async (): Promise<CsvVocabRow[] | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return parseCsvContent(content);
};

/**
 * Parses CSV content string into vocab rows.
 * Expects at least two columns: word and translation.
 * Auto-detects header row (looks for "word" or "translation" in first row).
 */
export const parseCsvContent = (content: string): CsvVocabRow[] => {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  let startIndex = 0;

  // Check if the first line is a header
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('word') || firstLine.includes('translation')) {
    startIndex = 1;
  }

  const rows: CsvVocabRow[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length >= 2 && fields[0].trim() && fields[1].trim()) {
      rows.push({
        word: fields[0].trim(),
        translation: fields[1].trim(),
      });
    }
  }

  return rows;
};

/**
 * Parses a single CSV line, handling quoted fields correctly.
 */
const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === ';') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current);
  return fields;
};
