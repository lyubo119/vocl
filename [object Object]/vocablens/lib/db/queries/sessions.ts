import * as SQLite from 'expo-sqlite';
import { Session } from '../schema';
import { v4 as uuidv4 } from 'uuid';

export const getSessionByDate = async (db: SQLite.SQLiteDatabase, workspaceId: string, date: string): Promise<Session | null> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM sessions WHERE workspace_id = ? AND date = ?',
        [workspaceId, date],
        (_, { rows }) => resolve(rows.length > 0 ? rows._array[0] as Session : null),
        (_, error) => reject(error)
      );
    });
  });
};

export const createSession = async (db: SQLite.SQLiteDatabase, session: Omit<Session, 'id' | 'created_at'>): Promise<Session> => {
  return new Promise((resolve, reject) => {
    const newSession: Session = {
      ...session,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };

    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO sessions (id, workspace_id, date, completed, score, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [newSession.id, newSession.workspace_id, newSession.date, newSession.completed, newSession.score, newSession.created_at],
        () => resolve(newSession),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateSession = async (db: SQLite.SQLiteDatabase, id: string, updates: Partial<Omit<Session, 'id' | 'created_at'>>): Promise<Session> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE sessions SET completed = ?, score = ? WHERE id = ?',
        [updates.completed, updates.score, id],
        () => getSessionByDate(db, updates.workspace_id || '', updates.date || '').then(resolve).catch(reject),
        (_, error) => reject(error)
      );
    });
  });
};