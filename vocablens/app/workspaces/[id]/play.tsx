import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../../hooks/WorkspaceContext';
import { getVocabByWorkspace, updateVocabItem } from '../../../lib/db/queries/vocab';
import { selectVocabForDailyChallenge } from '../../../lib/scheduler/weightedSelector';
import { updateVocabWeight } from '../../../lib/scheduler/spacedRepetition';
import {
  getSessionByDate,
  createSession,
  updateSession,
  saveSessionAnswer,
} from '../../../lib/db/queries/sessions';
import { getStreakByWorkspace, createOrUpdateStreak } from '../../../lib/db/queries/streaks';
import { getSetting, SETTINGS_KEYS } from '../../../lib/db/queries/settings';
import { scheduleDailyReminders } from '../../../lib/notifications';
import { getTodayDateString } from '../../../lib/utils/dateUtils';
import { colors, spacing, radii, typography } from '../../../constants/theme';
import Icon from '../../../components/ui/Icon';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlayMode = 'challenge' | 'freeplay';
type ChallengePhase = 'loading' | 'question' | 'result' | 'complete' | 'done_today';
type FreePhase = 'loading' | 'question' | 'result';

type AnswerRecord = {
  word: string;
  translation: string;
  userAnswer: string;
  correct: boolean;
};

// ── Main PlayScreen ───────────────────────────────────────────────────────────

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<PlayMode>('challenge');

  const handleModeChange = (newMode: PlayMode) => {
    setMode(newMode);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Mode Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.togglePill}>
          <TouchableOpacity
            style={[styles.toggleOption, mode === 'challenge' && styles.toggleActive]}
            onPress={() => handleModeChange('challenge')}
            activeOpacity={0.7}
          >
            <Icon
              name="trophy"
              size={14}
              color={mode === 'challenge' ? '#000000' : colors.textSecondary}
              strokeWidth={mode === 'challenge' ? 2.2 : 1.5}
            />
            <Text style={[styles.toggleText, mode === 'challenge' && styles.toggleTextActive]}>
              Daily Challenge
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, mode === 'freeplay' && styles.toggleActive]}
            onPress={() => handleModeChange('freeplay')}
            activeOpacity={0.7}
          >
            <Icon
              name="infinity"
              size={14}
              color={mode === 'freeplay' ? '#000000' : colors.textSecondary}
              strokeWidth={mode === 'freeplay' ? 2.2 : 1.5}
            />
            <Text style={[styles.toggleText, mode === 'freeplay' && styles.toggleTextActive]}>
              Infinite Play
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {mode === 'challenge' ? <ChallengeMode /> : <FreePlayMode />}
      </View>
    </View>
  );
}

// ── Challenge Mode ────────────────────────────────────────────────────────────

function ChallengeMode() {
  const { activeWorkspace, db } = useWorkspace();
  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<ChallengePhase>('loading');
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const workspaceId = activeWorkspace?.id;

  useEffect(() => {
    if (!db || !workspaceId) return;
    initChallenge();
  }, [db, workspaceId]);

  const initChallenge = async () => {
    if (!db || !workspaceId) return;
    try {
      // Check if today's challenge is already completed
      const today = getTodayDateString();
      const todaySession = await getSessionByDate(db, workspaceId, today);
      if (todaySession && todaySession.completed === 1) {
        setPhase('done_today');
        return;
      }

      const allVocab = (await getVocabByWorkspace(db, workspaceId)).filter(v => !v.is_deactivated);
      if (allVocab.length === 0) {
        setErrorMessage('No vocabulary yet. Add words first!');
        setPhase('question');
        return;
      }
      const selected = selectVocabForDailyChallenge(allVocab, 10);
      setVocabItems(selected);
      setCurrentIndex(0);
      setScore(0);
      setAnswers([]);
      setUserAnswer('');
      setSessionId(null);
      setPhase('question');
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch {
      setErrorMessage('Failed to load vocabulary.');
      setPhase('question');
    }
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const triggerFade = (callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleSubmit = async () => {
    if (!db || !workspaceId || vocabItems.length === 0) return;
    const trimmed = userAnswer.trim();
    if (!trimmed) return;

    const current = vocabItems[currentIndex];
    const isCorrect = trimmed.toLowerCase() === current.translation.toLowerCase();

    setLastCorrect(isCorrect);
    if (!isCorrect) triggerShake();

    const updated = updateVocabWeight(current, isCorrect);
    try { await updateVocabItem(db, current.id, updated); } catch { /* non-fatal */ }

    // Record the answer for stats
    try {
      await saveSessionAnswer(db, {
        workspace_id: workspaceId,
        session_id: sessionId,
        vocab_id: current.id,
        word: current.word,
        correct_answer: current.translation,
        user_answer: trimmed,
        is_correct: isCorrect ? 1 : 0,
        mode: 'challenge',
      });
    } catch { /* non-fatal */ }

    const record: AnswerRecord = {
      word: current.word,
      translation: current.translation,
      userAnswer: trimmed,
      correct: isCorrect,
    };

    const newScore = isCorrect ? score + 1 : score;
    const newAnswers = [...answers, record];
    setScore(newScore);
    setAnswers(newAnswers);
    setPhase('result');
  };

  const handleNext = async () => {
    if (currentIndex >= vocabItems.length - 1) {
      // Save/update challenge session and update streak
      if (db && workspaceId) {
        try {
          const today = getTodayDateString();
          const existing = await getSessionByDate(db, workspaceId, today);
          if (!existing) {
            const sess = await createSession(db, {
              workspace_id: workspaceId,
              date: today,
              completed: 1,
              score,
            });
            setSessionId(sess.id);
          } else {
            await updateSession(db, existing.id, { completed: 1, score });
            setSessionId(existing.id);
          }

          // Update streak
          const currentStreak = await getStreakByWorkspace(db, workspaceId);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const lastDone = currentStreak?.last_completed;
          const isConsecutive = lastDone === yesterdayStr;
          const alreadyCountedToday = lastDone === today;

          if (!alreadyCountedToday) {
            const newStreak = isConsecutive
              ? (currentStreak?.current_streak ?? 0) + 1
              : 1;
            const longest = Math.max(newStreak, currentStreak?.longest_streak ?? 0);
            await createOrUpdateStreak(db, {
              workspace_id: workspaceId,
              current_streak: newStreak,
              longest_streak: longest,
              grace_pending: 0,
              last_completed: today,
            });

            // Handle daily reminders skip
            try {
              const remindersEnabled = await getSetting(db, SETTINGS_KEYS.DAILY_REMINDERS_ENABLED);
              if (remindersEnabled === 'true') {
                const now = new Date();
                if (now.getHours() < 8) {
                  await scheduleDailyReminders(true);
                } else {
                  await scheduleDailyReminders(false);
                }
              }
            } catch { /* non-fatal */ }
          }
        } catch { /* non-fatal */ }
      }
      setPhase('complete');
    } else {
      triggerFade(() => {
        setCurrentIndex((prev) => prev + 1);
        setUserAnswer('');
        setLastCorrect(null);
        setPhase('question');
        setTimeout(() => inputRef.current?.focus(), 150);
      });
    }
  };

  const handleRestart = () => {
    setPhase('loading');
    initChallenge();
  };

  if (phase === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Preparing challenge…</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Icon name="list" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { marginTop: spacing.m }]}>{errorMessage}</Text>
      </View>
    );
  }

  // ── Done for today ─────────────────────────────────────────────────────────
  if (phase === 'done_today') {
    // Compute time until midnight
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const hoursLeft = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minsLeft = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    return (
      <View style={styles.doneTodayContainer}>
        <View style={styles.doneTodayBadge}>
          <Text style={styles.doneTodayEmoji}>🏆</Text>
        </View>
        <Text style={styles.doneTodayTitle}>Challenge Complete!</Text>
        <Text style={styles.doneTodaySubtitle}>
          You've already done today's challenge.
Come back in {hoursLeft}h {minsLeft}m for a new one.
        </Text>
        <View style={styles.doneTodayHint}>
          <Icon name="infinity" size={16} color={colors.textSecondary} />
          <Text style={styles.doneTodayHintText}>Try Infinite Play to keep practising</Text>
        </View>
      </View>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const total = vocabItems.length;
    const pct = Math.round((score / total) * 100);
    return (
      <ScrollView contentContainerStyle={styles.completeContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNumber}>{score}/{total}</Text>
          <Text style={styles.scorePct}>{pct}%</Text>
        </View>
        <Text style={styles.completeTitle}>
          {pct === 100 ? 'Perfect! 🏆' : pct >= 70 ? 'Great work! 🎉' : 'Keep practising!'}
        </Text>

        {answers.map((a, i) => (
          <View key={i} style={[styles.resultRow, a.correct ? styles.resultCorrect : styles.resultWrong]}>
            <View style={styles.resultLeft}>
              <Text style={styles.resultWord}>{a.word}</Text>
              <Text style={styles.resultTranslation}>{a.translation}</Text>
              {!a.correct && (
                <Text style={styles.resultYourAnswer}>You wrote: "{a.userAnswer}"</Text>
              )}
            </View>
            <Icon name={a.correct ? 'check' : 'x'} size={20} color={a.correct ? colors.success : colors.error} />
          </View>
        ))}
      </ScrollView>
    );
  }

  const current = vocabItems[currentIndex];
  const progress = (currentIndex + (phase === 'result' ? 1 : 0)) / vocabItems.length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{currentIndex + 1} / {vocabItems.length}</Text>
          <Text style={styles.scoreText}>{score} pts</Text>
        </View>
      </View>

      <Animated.View style={[styles.cardWrap, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Translate</Text>
          <Text style={styles.wordText}>{current.word}</Text>
          {phase === 'result' && (
            <View style={[styles.feedbackStrip, lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Icon name={lastCorrect ? 'check' : 'x'} size={18} color={lastCorrect ? colors.success : colors.error} />
              <Text style={[styles.feedbackText, { color: lastCorrect ? colors.success : colors.error }]}>
                {lastCorrect ? 'Correct!' : `Answer: ${current.translation}`}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.inputSection}>
        {phase === 'question' ? (
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type translation…"
              placeholderTextColor={colors.textCtaUnfocused}
              value={userAnswer}
              onChangeText={setUserAnswer}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.submitBtn, !userAnswer.trim() && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!userAnswer.trim()}
              activeOpacity={0.7}
            >
              <Icon name="arrow-right" size={20} color="#000000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.7}>
            <Text style={styles.nextBtnText}>
              {currentIndex >= vocabItems.length - 1 ? 'See Results' : 'Next'}
            </Text>
            <Icon name="arrow-right" size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Free Play Mode ────────────────────────────────────────────────────────────

function FreePlayMode() {
  const { activeWorkspace, db } = useWorkspace();
  const [vocabPool, setVocabPool] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<FreePhase>('loading');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const workspaceId = activeWorkspace?.id;

  useEffect(() => {
    if (!db || !workspaceId) return;
    loadVocab();
  }, [db, workspaceId]);

  const loadVocab = async () => {
    if (!db || !workspaceId) return;
    try {
      const all = (await getVocabByWorkspace(db, workspaceId)).filter(v => !v.is_deactivated);
      if (all.length === 0) {
        setErrorMessage('No vocabulary yet. Add words first!');
        setPhase('question');
        return;
      }
      setVocabPool(all);
      pickRandom(all);
    } catch {
      setErrorMessage('Failed to load vocabulary.');
      setPhase('question');
    }
  };

  const pickRandom = (pool: any[]) => {
    const [picked] = selectVocabForDailyChallenge(pool, 1);
    setCurrent(picked);
    setPhase('question');
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!current || !userAnswer.trim()) return;
    const trimmed = userAnswer.trim();
    const isCorrect = trimmed.toLowerCase() === current.translation.toLowerCase();

    setLastCorrect(isCorrect);
    if (!isCorrect) triggerShake();

    setTotal((t) => t + 1);
    if (isCorrect) setScore((s) => s + 1);

    if (db && workspaceId) {
      const updated = updateVocabWeight(current, isCorrect);
      try { await updateVocabItem(db, current.id, updated); } catch { /* non-fatal */ }

      // Record answer for stats
      try {
        await saveSessionAnswer(db, {
          workspace_id: workspaceId,
          session_id: null,
          vocab_id: current.id,
          word: current.word,
          correct_answer: current.translation,
          user_answer: trimmed,
          is_correct: isCorrect ? 1 : 0,
          mode: 'freeplay',
        });
      } catch { /* non-fatal */ }
    }

    setPhase('result');
  };

  const handleNext = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setUserAnswer('');
      setLastCorrect(null);
      pickRandom(vocabPool);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  if (phase === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Icon name="infinity" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { marginTop: spacing.m }]}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
    >
      {/* Score pill */}
      <View style={styles.freepHeader}>
        <View style={styles.scorePillWrap}>
          <Text style={styles.scorePillText}>{score} / {total}</Text>
        </View>
      </View>

      <Animated.View style={[styles.cardWrap, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Translate</Text>
          <Text style={styles.wordText}>{current?.word}</Text>
          {phase === 'result' && (
            <View style={[styles.feedbackStrip, lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Icon name={lastCorrect ? 'check' : 'x'} size={18} color={lastCorrect ? colors.success : colors.error} />
              <Text style={[styles.feedbackText, { color: lastCorrect ? colors.success : colors.error }]}>
                {lastCorrect ? 'Correct!' : `Answer: ${current?.translation}`}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.inputSection}>
        {phase === 'question' ? (
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type translation…"
              placeholderTextColor={colors.textCtaUnfocused}
              value={userAnswer}
              onChangeText={setUserAnswer}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.submitBtn, !userAnswer.trim() && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!userAnswer.trim()}
              activeOpacity={0.7}
            >
              <Icon name="arrow-right" size={20} color="#000000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.7}>
            <Text style={styles.nextBtnText}>Next Word</Text>
            <Icon name="arrow-right" size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  flex: { flex: 1 },
  content: { flex: 1 },

  // Toggle
  toggleContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
    paddingBottom: spacing.m,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.s,
    borderRadius: radii.lg,
  },
  toggleActive: {
    backgroundColor: '#ffffff',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#000000',
  },

  // Shared
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  loadingText: { ...typography.body, marginTop: spacing.m },
  emptyTitle: { ...typography.h3, textAlign: 'center', color: colors.textSecondary },

  // Free play header
  freepHeader: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    alignItems: 'flex-end',
  },
  scorePillWrap: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
  },
  scorePillText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },

  // Progress (challenge)
  progressSection: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
    paddingBottom: spacing.s,
  },
  progressBar: { height: 3, backgroundColor: colors.divider, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#ffffff', borderRadius: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.s },
  progressText: { ...typography.smallCaps, color: colors.textSecondary },
  scoreText: { ...typography.smallCaps, color: '#ffffff' },

  // Card
  cardWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.l },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.l,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  cardLabel: { ...typography.smallCaps, marginBottom: spacing.m },
  wordText: { fontSize: 40, fontWeight: '600', color: '#ffffff', textAlign: 'center' },
  feedbackStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: radii.md,
  },
  feedbackCorrect: { backgroundColor: 'rgba(112, 204, 129, 0.12)' },
  feedbackWrong: { backgroundColor: 'rgba(255, 107, 107, 0.12)' },
  feedbackText: { fontSize: 15, fontWeight: '500' },

  // Input
  inputSection: { paddingHorizontal: spacing.l, paddingBottom: spacing.l },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.m,
    fontSize: 17,
    color: '#ffffff',
  },
  submitBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.35 },
  nextBtn: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#000000' },

  // Complete (challenge results)
  completeContent: { padding: spacing.l, paddingBottom: spacing.xl },
  scoreBadge: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  scoreNumber: { fontSize: 32, fontWeight: '700', color: '#ffffff' },
  scorePct: { ...typography.smallCaps, color: colors.textSecondary },
  completeTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.l },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.m,
    marginBottom: spacing.s,
  },
  resultCorrect: { borderLeftWidth: 3, borderLeftColor: colors.success },
  resultWrong: { borderLeftWidth: 3, borderLeftColor: colors.error },
  resultLeft: { flex: 1, marginRight: spacing.s },
  resultWord: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  resultTranslation: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  resultYourAnswer: { fontSize: 13, color: colors.error, marginTop: 2 },
  restartBtn: {
    marginTop: spacing.l,
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  restartBtnText: { fontSize: 16, fontWeight: '600', color: '#000000' },

  // Done for today
  doneTodayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
    gap: spacing.m,
  },
  doneTodayBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
  },
  doneTodayEmoji: {
    fontSize: 48,
  },
  doneTodayTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  doneTodaySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneTodayHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    marginTop: spacing.s,
  },
  doneTodayHintText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
