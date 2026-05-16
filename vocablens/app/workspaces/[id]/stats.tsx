import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../../hooks/WorkspaceContext';
import { getStatsForWorkspace, StatsSnapshot, DailyAccuracy } from '../../../lib/db/queries/stats';
import { formatLocalDate, parseLocalDateString } from '../../../lib/utils/dateUtils';
import { colors, spacing, radii, typography } from '../../../constants/theme';
import Icon from '../../../components/ui/Icon';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT = colors.accentPurple; // #d1a0d7

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDayLabel(dateStr: string): string {
  return DAY_LABELS[parseLocalDateString(dateStr).getDay()];
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Pill that shows a metric value + label */
function StatCard({
  label,
  value,
  unit,
  accent,
  icon,
  small,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
  icon?: string;
  small?: boolean;
}) {
  return (
    <View style={[statCardStyles.card, accent && statCardStyles.accentBorder]}>
      {icon && (
        <Icon
          name={icon as any}
          size={18}
          color={accent ? ACCENT : colors.textSecondary}
          strokeWidth={1.8}
        />
      )}
      <Text style={[statCardStyles.value, small && statCardStyles.valueSmall]}>
        {value}
        {unit && <Text style={statCardStyles.unit}>{unit}</Text>}
      </Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.m,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accentBorder: {
    borderColor: `${ACCENT}40`,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 34,
  },
  valueSmall: {
    fontSize: 22,
  },
  unit: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

type CalendarCell = {
  date: string;
  day: number;
  inCurrentMonth: boolean;
};

function buildMonthCells(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    cells.push({ date: formatLocalDate(date), day, inCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({ date: formatLocalDate(date), day, inCurrentMonth: true });
  }

  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month + 1, nextMonthDay);
    cells.push({ date: formatLocalDate(date), day: nextMonthDay, inCurrentMonth: false });
    nextMonthDay += 1;
  }

  return cells;
}

/** Month-view calendar highlighting completed challenge days */
function MonthCalendar({ completedDates }: { completedDates: string[] }) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const completedSet = new Set(completedDates);
  const today = formatLocalDate(new Date());

  const cells = buildMonthCells(monthCursor);
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <View style={calStyles.container}>
      <View style={calStyles.navRow}>
        <TouchableOpacity style={calStyles.navBtn} onPress={() => shiftMonth(-1)} activeOpacity={0.7}>
          <View style={calStyles.leftArrow}>
            <Icon name="arrow-right" size={14} color={colors.textPrimary} strokeWidth={2.2} />
          </View>
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity style={calStyles.navBtn} onPress={() => shiftMonth(1)} activeOpacity={0.7}>
          <Icon name="arrow-right" size={14} color={colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Day header */}
      <View style={calStyles.row}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={calStyles.dayHeader}>{d}</Text>
        ))}
      </View>
      {rows.map((week, wi) => (
        <View key={wi} style={calStyles.row}>
          {week.map((cell) => {
            const done = completedSet.has(cell.date);
            const isToday = cell.date === today;
            return (
              <View
                key={cell.date}
                style={[
                  calStyles.day,
                  !cell.inCurrentMonth && calStyles.dayOutsideMonth,
                  done && calStyles.dayDone,
                  isToday && !done && calStyles.dayToday,
                ]}
              >
                <Text
                  style={[
                    calStyles.dayText,
                    !cell.inCurrentMonth && calStyles.dayTextOutsideMonth,
                    done && calStyles.dayTextDone,
                    isToday && !done && calStyles.dayTextToday,
                  ]}
                >
                  {cell.day}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    gap: 6,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgButtonSub,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  leftArrow: {
    transform: [{ rotate: '180deg' }],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayHeader: {
    width: 34,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingBottom: 4,
  },
  day: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayOutsideMonth: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  dayDone: {
    backgroundColor: ACCENT,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.borderNav,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  dayTextOutsideMonth: {
    color: '#6a6a70',
  },
  dayTextDone: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

/** Mini bar chart — pure RN, no libs */
function MiniBarChart({ data, label }: { data: DailyAccuracy[]; label: string }) {
  if (data.length === 0) return null;
  const maxAcc = 100;
  const barW = Math.floor(280 / data.length) - 3;

  return (
    <View style={barStyles.container}>
      <Text style={barStyles.title}>{label}</Text>
      <View style={barStyles.chart}>
        {data.map((d, i) => {
          const hasData = d.total > 0;
          const height = hasData ? Math.max(4, (d.accuracy / maxAcc) * 80) : 4;
          return (
            <View key={i} style={barStyles.barWrap}>
              <View
                style={[
                  barStyles.bar,
                  { height, width: Math.max(barW, 6) },
                  hasData ? barStyles.barFilled : barStyles.barEmpty,
                  d.accuracy >= 80 && barStyles.barGood,
                  d.accuracy >= 50 && d.accuracy < 80 && barStyles.barMid,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={barStyles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={[barStyles.dateLabel, { width: Math.max(barW, 6) }]}>
            {i % Math.ceil(data.length / 7) === 0 ? getDayLabel(d.date) : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    gap: spacing.s,
  },
  title: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 84,
    gap: 3,
  },
  barWrap: {
    justifyContent: 'flex-end',
    height: 80,
  },
  bar: {
    borderRadius: 3,
  },
  barEmpty: {
    backgroundColor: colors.divider,
  },
  barFilled: {
    backgroundColor: colors.textSecondary,
  },
  barGood: {
    backgroundColor: ACCENT,
  },
  barMid: {
    backgroundColor: '#7ca8d7',
  },
  labels: {
    flexDirection: 'row',
    gap: 3,
  },
  dateLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

/** Section header */
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={sectionStyles.row}>
      <Icon name={icon as any} size={16} color={colors.textSecondary} strokeWidth={1.8} />
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

// ── Main StatsScreen ──────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { activeWorkspace, db } = useWorkspace();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');

  const loadStats = useCallback(async () => {
    if (!db || !activeWorkspace?.id) return;
    setLoading(true);
    try {
      const s = await getStatsForWorkspace(db, activeWorkspace.id);
      setStats(s);
    } catch (e) {
      console.warn('Stats load error', e);
    } finally {
      setLoading(false);
    }
  }, [db, activeWorkspace?.id]);

  // Load stats when component mounts (tab switch causes remount in custom tab system)
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Icon name="bar-chart-2" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { marginTop: spacing.m }]}>No stats yet. Start practising!</Text>
      </View>
    );
  }

  const chartData = chartRange === '7d' ? stats.daily7d : stats.daily30d;
  const errorTrendUp = stats.errorRateTrend > 0; // positive = error rate dropped = improved
  const errorTrendNeutral = stats.errorRateTrend === 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.m }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero: Streak ──────────────────────────────────────────────────── */}
      <View style={styles.streakHero}>
        <View style={styles.streakIconWrap}>
          <Icon name="flame" size={32} color={ACCENT} strokeWidth={1.5} />
        </View>
        <View>
          <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        {stats.longestStreak > 0 && (
          <View style={styles.streakBest}>
            <Text style={styles.streakBestLabel}>Best</Text>
            <Text style={styles.streakBestVal}>{stats.longestStreak}</Text>
          </View>
        )}
      </View>

      {/* ── Calendar ─────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="calendar" title="Daily Challenge Calendar" />
        <View style={styles.card}>
          <MonthCalendar completedDates={stats.completedDates} />
          <View style={styles.calLegend}>
            <View style={[styles.calDot, { backgroundColor: ACCENT }]} />
            <Text style={styles.calLegendText}>Challenge completed</Text>
            <View style={[styles.calDot, { backgroundColor: 'rgba(255,255,255,0.07)', marginLeft: spacing.m }]} />
            <Text style={styles.calLegendText}>Outside month</Text>
          </View>
        </View>
      </View>

      {/* ── Quality Metrics ───────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="target" title="Quality Metrics" />
        <View style={styles.row2}>
          <StatCard label="Overall Accuracy" value={stats.overallAccuracy} unit="%" icon="activity" accent />
          <StatCard label="Challenge Accuracy" value={stats.challengeAccuracy} unit="%" icon="trophy" />
        </View>
        <View style={[styles.row2, { marginTop: spacing.s }]}>
          <StatCard label="Completion Rate" value={stats.completionRate} unit="%" icon="check" />
          <StatCard label="Avg Session Score" value={stats.avgScore} unit="/10" icon="zap" />
        </View>
        <View style={[styles.row2, { marginTop: spacing.s }]}>
          <StatCard label="Best Score" value={`${stats.bestScore}/10`} accent icon="trophy" small />
          <StatCard label="Average Score" value={`${stats.avgScore}/10`} small />
        </View>
      </View>

      {/* ── Improvement Over Time ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="trend-up" title="Improvement Over Time" />
        <View style={styles.card}>
          <View style={styles.chartToggleRow}>
            <TouchableOpacity
              style={[styles.chartToggleBtn, chartRange === '7d' && styles.chartToggleActive]}
              onPress={() => setChartRange('7d')}
            >
              <Text style={[styles.chartToggleText, chartRange === '7d' && styles.chartToggleTextActive]}>7 days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chartToggleBtn, chartRange === '30d' && styles.chartToggleActive]}
              onPress={() => setChartRange('30d')}
            >
              <Text style={[styles.chartToggleText, chartRange === '30d' && styles.chartToggleTextActive]}>30 days</Text>
            </TouchableOpacity>
          </View>
          <MiniBarChart data={chartData} label="Accuracy % per day" />
          <View style={styles.chartLegend}>
            <View style={[styles.legendDot, { backgroundColor: ACCENT }]} />
            <Text style={styles.legendText}>≥80% accuracy</Text>
            <View style={[styles.legendDot, { backgroundColor: '#7ca8d7', marginLeft: spacing.m }]} />
            <Text style={styles.legendText}>50–79%</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.textSecondary, marginLeft: spacing.m }]} />
            <Text style={styles.legendText}>&lt;50%</Text>
          </View>
        </View>
      </View>

      {/* ── Efficiency ───────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="zap" title="Efficiency" />
        <View style={styles.row2}>
          <StatCard
            label="Avg Attempts / Success"
            value={stats.avgAttemptsBeforeSuccess}
            icon="activity"
            small
          />
          <View style={[statCardStyles.card, errorTrendUp && statCardStyles.accentBorder]}>
            <Icon
              name={errorTrendNeutral ? 'activity' : errorTrendUp ? 'trend-up' : 'trend-down'}
              size={18}
              color={errorTrendUp ? colors.success : errorTrendNeutral ? colors.textSecondary : colors.error}
              strokeWidth={1.8}
            />
            <Text style={[statCardStyles.value, statCardStyles.valueSmall, {
              color: errorTrendUp ? colors.success : errorTrendNeutral ? '#ffffff' : colors.error,
            }]}>
              {errorTrendNeutral ? '—' : `${Math.abs(stats.errorRateTrend)}%`}
            </Text>
            <Text style={statCardStyles.label}>
              {errorTrendNeutral ? 'Error Trend' : errorTrendUp ? 'Error ↓ (good)' : 'Error ↑ (focus!)'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Output & Impact ───────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="bar-chart-2" title="Output & Impact" />
        <View style={styles.row3}>
          <StatCard label="Challenges Done" value={stats.totalCompletedSessions} icon="trophy" small />
          <StatCard label="Total Answered" value={stats.totalAnswered} small />
          <StatCard label="Correct Answers" value={stats.totalCorrect} accent small />
        </View>
        <View style={[styles.row2, { marginTop: spacing.s }]}>
          <StatCard label="Free Play Answers" value={stats.totalFreePlayAnswered} icon="infinity" small />
          <StatCard
            label="Challenge Answers"
            value={stats.totalAnswered - stats.totalFreePlayAnswered}
            icon="trophy"
            small
          />
        </View>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.m, paddingBottom: spacing.l },
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  emptyText: { ...typography.body, textAlign: 'center' },

  // Hero streak
  streakHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.m,
    marginBottom: spacing.l,
    gap: spacing.m,
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
  },
  streakIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${ACCENT}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 50,
  },
  streakLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: -4,
  },
  streakBest: {
    marginLeft: 'auto',
    alignItems: 'center',
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.md,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  streakBestLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakBestVal: {
    fontSize: 22,
    fontWeight: '700',
    color: ACCENT,
  },

  // Sections
  section: {
    marginBottom: spacing.l,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.m,
    gap: spacing.m,
  },

  // Grid rows
  row2: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  row3: {
    flexDirection: 'row',
    gap: spacing.s,
  },

  // Calendar legend
  calLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  calDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calLegendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Chart controls
  chartToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.md,
    padding: 3,
    alignSelf: 'flex-start',
    gap: 2,
  },
  chartToggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.m,
    borderRadius: radii.sm,
  },
  chartToggleActive: {
    backgroundColor: '#ffffff',
  },
  chartToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chartToggleTextActive: {
    color: '#000000',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
