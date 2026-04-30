import * as SQLite from 'expo-sqlite';
import { Workspace } from '../schema';
import { generateId } from '../../utils/generateId';

export const getAllWorkspaces = async (db: SQLite.SQLiteDatabase): Promise<Workspace[]> => {
  const result = await db.getAllAsync<Workspace>('SELECT * FROM workspaces ORDER BY created_at DESC');
  return result;
};

export const getWorkspaceById = async (db: SQLite.SQLiteDatabase, id: string): Promise<Workspace | null> => {
  const result = await db.getAllAsync<Workspace>('SELECT * FROM workspaces WHERE id = ?', [id]);
  return result.length > 0 ? result[0] : null;
};

export const createWorkspace = async (db: SQLite.SQLiteDatabase, workspace: Omit<Workspace, 'id' | 'created_at'>): Promise<Workspace> => {
  const newWorkspace: Workspace = {
    ...workspace,
    id: generateId(),
    created_at: new Date().toISOString()
  };

  await db.runAsync(
    'INSERT INTO workspaces (id, name, source_lang, target_lang, created_at) VALUES (?, ?, ?, ?, ?)',
    [newWorkspace.id, newWorkspace.name, newWorkspace.source_lang, newWorkspace.target_lang, newWorkspace.created_at]
  );

  return newWorkspace;
};

export const updateWorkspace = async (db: SQLite.SQLiteDatabase, id: string, updates: Partial<Omit<Workspace, 'id' | 'created_at'>>): Promise<Workspace> => {
  await db.runAsync(
    'UPDATE workspaces SET name = ?, source_lang = ?, target_lang = ? WHERE id = ?',
    [updates.name, updates.source_lang, updates.target_lang, id]
  );
  const updated = await getWorkspaceById(db, id);
  if (!updated) throw new Error('Workspace not found after update');
  return updated;
};

export const deleteWorkspace = async (db: SQLite.SQLiteDatabase, id: string): Promise<void> => {
  // Delete related data first
  await db.runAsync('DELETE FROM vocab WHERE workspace_id = ?', [id]);
  await db.runAsync('DELETE FROM sessions WHERE workspace_id = ?', [id]);
  await db.runAsync('DELETE FROM streaks WHERE workspace_id = ?', [id]);
  // Then delete workspace
  await db.runAsync('DELETE FROM workspaces WHERE id = ?', [id]);
};