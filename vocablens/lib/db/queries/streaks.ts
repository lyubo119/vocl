import * as SQLite from 'expo-sqlite';
import { Streak } from '../schema';

export const getStreakByWorkspace = async (db: SQLite.SQLiteDatabase, workspaceId: string): Promise<Streak | null> => {
  const result = await db.getAllAsync<Streak>('SELECT * FROM streaks WHERE workspace_id = ?', [workspaceId]);
  return result.length > 0 ? result[0] : null;
};

export const createOrUpdateStreak = async (db: SQLite.SQLiteDatabase, streak: Streak): Promise<Streak> => {
  await db.runAsync(
    'INSERT OR REPLACE INTO streaks (workspace_id, current_streak, longest_streak, grace_pending, last_completed) VALUES (?, ?, ?, ?, ?)',
    [streak.workspace_id, streak.current_streak, streak.longest_streak, streak.grace_pending, streak.last_completed]
  );
  return streak;
};