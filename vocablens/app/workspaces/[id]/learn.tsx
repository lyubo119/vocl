import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../../hooks/WorkspaceContext';
import { getVocabByWorkspace, updateVocabItem } from '../../../lib/db/queries/vocab';
import { selectVocabForDailyChallenge } from '../../../lib/scheduler/weightedSelector';
import { updateVocabWeight } from '../../../lib/scheduler/spacedRepetition';
import { getSessionByDate, createSession, updateSession } from '../../../lib/db/queries/sessions';
import { getTodayDateString } from '../../../lib/utils/dateUtils';
import { colors, spacing, radii, typography } from '../../../constants/theme';
import Icon from '../../../components/ui/Icon';

type Phase = 'loading' | 'question' | 'result' | 'complete';

type AnswerRecord = {
  word: string;
  translation: string;
  userAnswer: string;
  correct: boolean;
};

export default function LearnScreen() {
  const { activeWorkspace, db } = useWorkspace();
  const insets = useSafeAreaInsets();
  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      const allVocab = await getVocabByWorkspace(db, workspaceId);
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
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
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
    try {
      await updateVocabItem(db, current.id, updated);
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
      // Save session
      if (db && workspaceId) {
        try {
          const today = getTodayDateString();
          const existing = await getSessionByDate(db, workspaceId, today);
          if (!existing) {
            await createSession(db, { workspace_id: workspaceId, date: today, completed: 1, score });
          } else {
            await updateSession(db, existing.id, { completed: 1, score });
          }
        } catch { /* non-fatal */ }
      }
      setPhase('complete');
    } else {
      triggerFade(() => {
        setCurrentIndex(prev => prev + 1);
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

  // ── LOADING ───────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Preparing challenge…</Text>
      </View>
    );
  }

  // ── ERROR / EMPTY ─────────────────────────────────────────
  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Icon name="list" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { marginTop: spacing.m }]}>{errorMessage}</Text>
      </View>
    );
  }

  // ── COMPLETE SCREEN ───────────────────────────────────────
  if (phase === 'complete') {
    const total = vocabItems.length;
    const pct = Math.round((score / total) * 100);
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.m }]}>
        <ScrollView contentContainerStyle={styles.completeContent} showsVerticalScrollIndicator={false}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreNumber}>{score}/{total}</Text>
            <Text style={styles.scorePct}>{pct}%</Text>
          </View>
          <Text style={styles.completeTitle}>
            {pct === 100 ? 'Perfect!' : pct >= 70 ? 'Great work!' : 'Keep practising!'}
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

          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.7}>
            <Text style={styles.restartBtnText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── QUESTION / RESULT ─────────────────────────────────────
  const current = vocabItems[currentIndex];
  const progress = (currentIndex + (phase === 'result' ? 1 : 0)) / vocabItems.length;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{currentIndex + 1} / {vocabItems.length}</Text>
          <Text style={styles.scoreText}>{score} pts</Text>
        </View>
      </View>

      {/* Card */}
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

      {/* Input row */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  centered: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.l },
  loadingText: { ...typography.body, marginTop: spacing.m },
  emptyTitle: { ...typography.h3, textAlign: 'center', color: colors.textSecondary },

  // Progress
  progressSection: { paddingHorizontal: spacing.l, paddingTop: spacing.m, paddingBottom: spacing.s },
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

  // Complete
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
});