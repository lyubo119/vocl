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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../../hooks/WorkspaceContext';
import { getVocabByWorkspace, updateVocabItem } from '../../../lib/db/queries/vocab';
import { selectVocabForDailyChallenge } from '../../../lib/scheduler/weightedSelector';
import { updateVocabWeight } from '../../../lib/scheduler/spacedRepetition';
import { colors, spacing, radii, typography } from '../../../constants/theme';
import Icon from '../../../components/ui/Icon';

type Phase = 'loading' | 'question' | 'result';

const limitNotes = (notes?: string | null): string | null => {
  const trimmed = notes?.trim();
  if (!trimmed) return null;
  return trimmed.length > 100 ? `${trimmed.slice(0, 100)}...` : trimmed;
};

export default function FreePlayScreen() {
  const { activeWorkspace, db, vocabRevision } = useWorkspace();
  const insets = useSafeAreaInsets();
  const [vocabPool, setVocabPool] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('loading');
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
  }, [db, workspaceId, vocabRevision]);

  const loadVocab = async () => {
    if (!db || !workspaceId) return;
    setPhase('loading');
    setErrorMessage(null);
    try {
      const all = (await getVocabByWorkspace(db, workspaceId)).filter(v => !v.is_deactivated);
      if (all.length === 0) {
        setErrorMessage('No vocabulary yet. Add words first!');
        setPhase('question');
        return;
      }
      setVocabPool(all);
      setUserAnswer('');
      setLastCorrect(null);
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

    setTotal(t => t + 1);
    if (isCorrect) setScore(s => s + 1);

    // Update weight in DB
    if (db) {
      const updated = updateVocabWeight(current, isCorrect);
      try { await updateVocabItem(db, current.id, updated); } catch { /* non-fatal */ }
    }

    setPhase('result');
  };

  const handleNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
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
        <Text style={[styles.emptyText, { marginTop: spacing.m }]}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Free Play</Text>
        <View style={styles.scorePill}>
          <Text style={styles.scorePillText}>{score} / {total}</Text>
        </View>
      </View>

      {/* Card */}
      <Animated.View style={[styles.cardWrap, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Translate</Text>
          <Text style={styles.wordText}>{current?.word}</Text>
          {phase === 'result' && (
            <View style={[styles.feedbackStrip, lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Icon name={lastCorrect ? 'check' : 'x'} size={18} color={lastCorrect ? colors.success : colors.error} />
              <View style={styles.feedbackContent}>
                <Text style={[styles.feedbackText, { color: lastCorrect ? colors.success : colors.error }]}>
                  {lastCorrect ? `Correct: ${current?.translation}` : `Answer: ${current?.translation}`}
                </Text>
                {lastCorrect && limitNotes(current?.notes) && (
                  <Text style={styles.feedbackNotes}>{limitNotes(current?.notes)}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Input */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  centered: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.l },
  emptyText: { ...typography.body, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#ffffff' },
  scorePill: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
  },
  scorePillText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },

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
  feedbackContent: { flex: 1 },
  feedbackText: { fontSize: 15, fontWeight: '500' },
  feedbackNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },

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
});
