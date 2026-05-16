import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const runMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {

  // Create workspaces table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`
  );

  // Create vocab table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS vocab (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      word TEXT NOT NULL,
      translation TEXT NOT NULL,
      notes TEXT,
      weight REAL NOT NULL DEFAULT 0.7,
      last_seen TEXT,
      correct_streak INTEGER NOT NULL DEFAULT 0,
      total_attempts INTEGER NOT NULL DEFAULT 0,
      total_correct INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      is_deactivated INTEGER NOT NULL DEFAULT 0,
      UNIQUE(workspace_id, word COLLATE NOCASE)
    );`
  );

  // Migration: add is_deactivated if it doesn't exist
  try {
    await db.execAsync(`ALTER TABLE vocab ADD COLUMN is_deactivated INTEGER NOT NULL DEFAULT 0;`);
  } catch (e) {
    // Column might already exist, ignore error
  }

  // Create sessions table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );`
  );

  // Create streaks table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS streaks (
      workspace_id TEXT PRIMARY KEY,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      grace_pending INTEGER NOT NULL DEFAULT 0,
      last_completed TEXT
    );`
  );

  // Create session_answers table (one row per question attempt, both modes)
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS session_answers (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      session_id TEXT,
      vocab_id TEXT NOT NULL,
      word TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'challenge',
      created_at TEXT NOT NULL
    );`
  );

  // Create settings table (key-value store for app preferences)
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`
  );
};

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  const db = SQLite.openDatabaseSync('vocablens.db');
  initPromise = (async () => {
    await runMigrations(db);
    dbInstance = db;
    return db;
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = null;
    dbInstance = null;
    throw error;
  }
};

export type Workspace = {
  id: string;
  name: string;
  source_lang: string;
  target_lang: string;
  created_at: string;
};

export type VocabItem = {
  id: string;
  workspace_id: string;
  word: string;
  translation: string;
  notes?: string;
  weight: number;
  last_seen?: string;
  correct_streak: number;
  total_attempts: number;
  total_correct: number;
  created_at: string;
  is_deactivated?: number;
};

export type Session = {
  id: string;
  workspace_id: string;
  date: string;
  completed: number;
  score: number;
  created_at: string;
};

export type Streak = {
  workspace_id: string;
  current_streak: number;
  longest_streak: number;
  grace_pending: number;
  last_completed?: string;
};

export type SessionAnswer = {
  id: string;
  workspace_id: string;
  session_id?: string | null;
  vocab_id: string;
  word: string;
  correct_answer: string;
  user_answer: string;
  is_correct: number; // 0 or 1 (SQLite boolean)
  mode: 'challenge' | 'freeplay';
  created_at: string;
};
