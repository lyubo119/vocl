import * as SQLite from 'expo-sqlite';

export const getSetting = async (db: SQLite.SQLiteDatabase, key: string): Promise<string | null> => {
  const result = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings WHERE key = ?', [key]);
  return result.length > 0 ? result[0].value : null;
};

export const setSetting = async (db: SQLite.SQLiteDatabase, key: string, value: string): Promise<void> => {
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
};

export const deleteSetting = async (db: SQLite.SQLiteDatabase, key: string): Promise<void> => {
  await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
};

// Convenience constants
export const SETTINGS_KEYS = {
  LAST_WORKSPACE_ID: 'last_workspace_id',
  MYMEMORY_EMAIL: 'mymemory_email',
} as const;
