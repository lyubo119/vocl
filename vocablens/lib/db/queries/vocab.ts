import * as SQLite from 'expo-sqlite';
import { VocabItem } from '../schema';
import { generateId } from '../../utils/generateId';

export const getVocabByWorkspace = async (db: SQLite.SQLiteDatabase, workspaceId: string): Promise<VocabItem[]> => {
  const result = await db.getAllAsync<VocabItem>('SELECT * FROM vocab WHERE workspace_id = ? ORDER BY created_at DESC', [workspaceId]);
  return result;
};

export const getVocabById = async (db: SQLite.SQLiteDatabase, id: string): Promise<VocabItem | null> => {
  const result = await db.getAllAsync<VocabItem>('SELECT * FROM vocab WHERE id = ?', [id]);
  return result.length > 0 ? result[0] : null;
};

export const createVocabItem = async (db: SQLite.SQLiteDatabase, vocab: Omit<VocabItem, 'id' | 'created_at' | 'correct_streak' | 'total_attempts' | 'total_correct'>): Promise<VocabItem> => {
  const newVocab: VocabItem = {
    ...vocab,
    id: generateId(),
    created_at: new Date().toISOString(),
    correct_streak: 0,
    total_attempts: 0,
    total_correct: 0
  };

  await db.runAsync(
    'INSERT INTO vocab (id, workspace_id, word, translation, notes, weight, last_seen, correct_streak, total_attempts, total_correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newVocab.id, newVocab.workspace_id, newVocab.word, newVocab.translation, newVocab.notes, newVocab.weight, newVocab.last_seen, newVocab.correct_streak, newVocab.total_attempts, newVocab.total_correct, newVocab.created_at]
  );

  return newVocab;
};

export const updateVocabItem = async (db: SQLite.SQLiteDatabase, id: string, updates: Partial<Omit<VocabItem, 'id' | 'created_at'>>): Promise<VocabItem> => {
  await db.runAsync(
    'UPDATE vocab SET word = ?, translation = ?, notes = ?, weight = ?, last_seen = ?, correct_streak = ?, total_attempts = ?, total_correct = ? WHERE id = ?',
    [updates.word, updates.translation, updates.notes, updates.weight, updates.last_seen, updates.correct_streak, updates.total_attempts, updates.total_correct, id]
  );
  const updated = await getVocabById(db, id);
  if (!updated) throw new Error('Vocab item not found after update');
  return updated;
};

export const deleteVocabItem = async (db: SQLite.SQLiteDatabase, id: string): Promise<void> => {
  await db.runAsync('DELETE FROM vocab WHERE id = ?', [id]);
};

export const getVocabForDailyChallenge = async (db: SQLite.SQLiteDatabase, workspaceId: string, limit: number = 10): Promise<VocabItem[]> => {
  const result = await db.getAllAsync<VocabItem>(
    `SELECT * FROM vocab WHERE workspace_id = ? ORDER BY RANDOM() LIMIT ?`, // Simple random for now, will implement weighted selection later
    [workspaceId, limit]
  );
  return result;
};