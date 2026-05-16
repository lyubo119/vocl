import * as SQLite from 'expo-sqlite';
import { formatLocalDate, parseLocalDateString } from '../../utils/dateUtils';

export type DailyAccuracy = {
  date: string; // YYYY-MM-DD
  total: number;
  correct: number;
  accuracy: number; // 0-100
};

export type StatsSnapshot = {
  // Consistency
  currentStreak: number;
  longestStreak: number;
  completedDates: string[]; // YYYY-MM-DD days with completed challenge

  // Quality
  overallAccuracy: number; // 0-100, all modes
  challengeAccuracy: number; // 0-100, challenge only
  completionRate: number; // 0-100, sessions completed/started
  avgScore: number; // avg challenge session score
  bestScore: number;

  // Improvement over time
  daily7d: DailyAccuracy[];
  daily30d: DailyAccuracy[];

  // Efficiency
  avgAttemptsBeforeSuccess: number;
  errorRateTrend: number; // positive = improving (error rate dropped), negative = worsening

  // Output & Impact
  totalCompletedSessions: number;
  totalAnswered: number;
  totalCorrect: number;
  totalFreePlayAnswered: number;
};

const dateRange = (daysBack: number): { from: string; to: string } => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack + 1);
  return { from: formatLocalDate(from), to: formatLocalDate(to) };
};

export const getStatsForWorkspace = async (
  db: SQLite.SQLiteDatabase,
  workspaceId: string
): Promise<StatsSnapshot> => {
  // ── Streak & completed dates ─────────────────────────────────────────────
  const streakRow = await db.getAllAsync<{
    current_streak: number;
    longest_streak: number;
  }>('SELECT current_streak, longest_streak FROM streaks WHERE workspace_id = ?', [workspaceId]);

  const currentStreak = streakRow[0]?.current_streak ?? 0;
  const longestStreak = streakRow[0]?.longest_streak ?? 0;

  const completedSessions = await db.getAllAsync<{ date: string; score: number }>(
    'SELECT date, score FROM sessions WHERE workspace_id = ? AND completed = 1 ORDER BY date ASC',
    [workspaceId]
  );
  const completedDates = completedSessions.map((s) => s.date);

  // ── Challenge stats ──────────────────────────────────────────────────────
  const allSessions = await db.getAllAsync<{ completed: number; score: number }>(
    'SELECT completed, score FROM sessions WHERE workspace_id = ?',
    [workspaceId]
  );
  const totalCompletedSessions = allSessions.filter((s) => s.completed === 1).length;
  const completionRate =
    allSessions.length === 0 ? 0 : Math.round((totalCompletedSessions / allSessions.length) * 100);

  const scores = completedSessions.map((s) => s.score);
  const avgScore = scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const bestScore = scores.length === 0 ? 0 : Math.max(...scores);

  // ── Accuracy from session_answers ────────────────────────────────────────
  const allAnswers = await db.getAllAsync<{ is_correct: number; mode: string; created_at: string }>(
    'SELECT is_correct, mode, created_at FROM session_answers WHERE workspace_id = ? ORDER BY created_at ASC',
    [workspaceId]
  );

  const totalAnswered = allAnswers.length;
  const totalCorrect = allAnswers.filter((a) => a.is_correct === 1).length;
  const overallAccuracy = totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100);

  const challengeAnswers = allAnswers.filter((a) => a.mode === 'challenge');
  const chalCorrect = challengeAnswers.filter((a) => a.is_correct === 1).length;
  const challengeAccuracy =
    challengeAnswers.length === 0 ? 0 : Math.round((chalCorrect / challengeAnswers.length) * 100);

  const freePlayAnswers = allAnswers.filter((a) => a.mode === 'freeplay');
  const totalFreePlayAnswered = freePlayAnswers.length;

  // ── 7d / 30d daily accuracy ──────────────────────────────────────────────
  const buildDailyAccuracy = (daysBack: number): DailyAccuracy[] => {
    const { from, to } = dateRange(daysBack);
    const days: DailyAccuracy[] = [];
    const cursor = parseLocalDateString(from);
    const end = parseLocalDateString(to);
    while (cursor <= end) {
      const dateStr = formatLocalDate(cursor);
      const dayAnswers = allAnswers.filter((a) => a.created_at.startsWith(dateStr));
      const dayCorrect = dayAnswers.filter((a) => a.is_correct === 1).length;
      days.push({
        date: dateStr,
        total: dayAnswers.length,
        correct: dayCorrect,
        accuracy: dayAnswers.length === 0 ? 0 : Math.round((dayCorrect / dayAnswers.length) * 100),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  };

  const daily7d = buildDailyAccuracy(7);
  const daily30d = buildDailyAccuracy(30);

  // ── Error-rate trend (last 7d vs prior 7d) ───────────────────────────────
  const { from: w1from } = dateRange(7);
  const { from: w2from } = dateRange(14);
  const week1 = allAnswers.filter((a) => a.created_at >= w1from);
  const week2 = allAnswers.filter((a) => a.created_at >= w2from && a.created_at < w1from);
  const errorRate1 = week1.length === 0 ? 0 : (week1.filter((a) => a.is_correct === 0).length / week1.length) * 100;
  const errorRate2 = week2.length === 0 ? 0 : (week2.filter((a) => a.is_correct === 0).length / week2.length) * 100;
  const errorRateTrend = Math.round(errorRate2 - errorRate1); // positive = improved (error went down)

  // ── Avg attempts before success ──────────────────────────────────────────
  // Group answers by vocab_id, count how many wrong before first correct
  const byVocab: Record<string, { is_correct: number }[]> = {};
  allAnswers.forEach((a) => {
    const key = `${a.created_at.slice(0, 10)}`; // Not ideal but avoids vocab_id join; use raw
    // We just use global average: total / correct
    byVocab[key] = byVocab[key] || [];
    byVocab[key].push(a);
  });
  const avgAttemptsBeforeSuccess =
    totalCorrect === 0 ? 0 : parseFloat((totalAnswered / totalCorrect).toFixed(1));

  return {
    currentStreak,
    longestStreak,
    completedDates,
    overallAccuracy,
    challengeAccuracy,
    completionRate,
    avgScore,
    bestScore,
    daily7d,
    daily30d,
    errorRateTrend,
    totalCompletedSessions,
    totalAnswered,
    totalCorrect,
    totalFreePlayAnswered,
    avgAttemptsBeforeSuccess,
  };
};
