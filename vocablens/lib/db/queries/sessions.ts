import * as SQLite from 'expo-sqlite';
import { Session, SessionAnswer } from '../schema';
import { generateId } from '../../utils/generateId';

export const getSessionByDate = async (db: SQLite.SQLiteDatabase, workspaceId: string, date: string): Promise<Session | null> => {
  const result = await db.getAllAsync<Session>('SELECT * FROM sessions WHERE workspace_id = ? AND date = ?', [workspaceId, date]);
  return result.length > 0 ? result[0] : null;
};

export const getSessions = async (
  db: SQLite.SQLiteDatabase,
  workspaceId: string,
  fromDate?: string,
  toDate?: string
): Promise<Session[]> => {
  if (fromDate && toDate) {
    return db.getAllAsync<Session>(
      'SELECT * FROM sessions WHERE workspace_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [workspaceId, fromDate, toDate]
    );
  }
  return db.getAllAsync<Session>(
    'SELECT * FROM sessions WHERE workspace_id = ? ORDER BY date ASC',
    [workspaceId]
  );
};

export const createSession = async (db: SQLite.SQLiteDatabase, session: Omit<Session, 'id' | 'created_at'>): Promise<Session> => {
  const newSession: Session = {
    ...session,
    id: generateId(),
    created_at: new Date().toISOString()
  };

  await db.runAsync(
    'INSERT INTO sessions (id, workspace_id, date, completed, score, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [newSession.id, newSession.workspace_id, newSession.date, newSession.completed, newSession.score, newSession.created_at]
  );

  return newSession;
};

export const updateSession = async (db: SQLite.SQLiteDatabase, id: string, updates: Partial<Omit<Session, 'id' | 'created_at' | 'workspace_id' | 'date'>>): Promise<Session> => {
  await db.runAsync(
    'UPDATE sessions SET completed = ?, score = ? WHERE id = ?',
    [updates.completed, updates.score, id]
  );

  return {
    id,
    workspace_id: '',
    date: '',
    completed: updates.completed || 0,
    score: updates.score || 0,
    created_at: new Date().toISOString()
  } as Session;
};

// ── Session Answers ───────────────────────────────────────────────────────────

export const saveSessionAnswer = async (
  db: SQLite.SQLiteDatabase,
  answer: Omit<SessionAnswer, 'id' | 'created_at'>
): Promise<void> => {
  const id = generateId();
  const created_at = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO session_answers
      (id, workspace_id, session_id, vocab_id, word, correct_answer, user_answer, is_correct, mode, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      answer.workspace_id,
      answer.session_id ?? null,
      answer.vocab_id,
      answer.word,
      answer.correct_answer,
      answer.user_answer,
      answer.is_correct,
      answer.mode,
      created_at,
    ]
  );
};

export const getSessionAnswers = async (
  db: SQLite.SQLiteDatabase,
  workspaceId: string,
  limit?: number
): Promise<SessionAnswer[]> => {
  if (limit) {
    return db.getAllAsync<SessionAnswer>(
      'SELECT * FROM session_answers WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?',
      [workspaceId, limit]
    );
  }
  return db.getAllAsync<SessionAnswer>(
    'SELECT * FROM session_answers WHERE workspace_id = ? ORDER BY created_at DESC',
    [workspaceId]
  );
};