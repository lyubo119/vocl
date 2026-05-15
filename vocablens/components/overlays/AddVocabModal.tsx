import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createVocabItem } from '../../lib/db/queries/vocab';
import { getNewVocabItem } from '../../lib/scheduler/spacedRepetition';
import { initDatabase } from '../../lib/db/schema';
import { getSetting, SETTINGS_KEYS } from '../../lib/db/queries/settings';
import { translateWord } from '../../lib/translation/myMemory';
import { useWorkspace } from '../../hooks/WorkspaceContext';
import { useToast } from './ToastContext';
import { colors, spacing, radii, typography } from '../../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
};

export default function AddVocabModal({ visible, onClose, workspaceId }: Props) {
  const { activeWorkspace } = useWorkspace();
  const { showToast } = useToast();

  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [translating, setTranslating] = useState(false);

  // True once the user has manually edited the translation field.
  // We never auto-overwrite after that.
  const translationEditedByUser = useRef(false);

  const reset = () => {
    setNewWord('');
    setNewTranslation('');
    setNewNotes('');
    translationEditedByUser.current = false;
  };

  // ── Auto-translate with 700 ms debounce ─────────────────────────────────────
  // Fires whenever the word changes. Cancelled immediately if the user starts
  // typing again, or if the translation field has been manually edited.
  useEffect(() => {
    const word = newWord.trim();

    // Clear auto-fill when word is erased
    if (!word) {
      if (!translationEditedByUser.current) {
        setNewTranslation('');
      }
      setTranslating(false);
      return;
    }

    // Don't overwrite what the user typed manually
    if (translationEditedByUser.current) return;

    const sourceLang = activeWorkspace?.source_lang;
    const targetLang = activeWorkspace?.target_lang;
    if (!sourceLang || !targetLang) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      setTranslating(true);
      try {
        const db = await initDatabase();
        const email = await getSetting(db, SETTINGS_KEYS.MYMEMORY_EMAIL);

        // Workspace convention: source_lang = unknown (being learned),
        // target_lang = known (native). Word is typed in source_lang;
        // translation should be in target_lang.
        // MyMemory langpair: "sourceLang|targetLang"
        const result = await translateWord(word, sourceLang, targetLang, email);

        if (!cancelled && !translationEditedByUser.current) {
          setNewTranslation(result.translatedText);
        }
      } catch {
        // Silent — user can fill in manually or leave blank
      } finally {
        if (!cancelled) setTranslating(false);
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newWord, activeWorkspace?.source_lang, activeWorkspace?.target_lang]);

  // ── Reset state when modal is opened/closed ──────────────────────────────────
  useEffect(() => {
    if (!visible) {
      // Small delay so the closing animation doesn't glitch
      const t = setTimeout(reset, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // ── Add word ─────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newWord.trim()) {
      showToast('Error', 'Please enter a word', 'error');
      return;
    }
    // If translation is still loading, wait — the button is disabled during
    // this state anyway, but guard here too.
    if (translating) return;

    setAdding(true);
    try {
      const db = await initDatabase();
      const newVocab = getNewVocabItem(
        workspaceId,
        newWord.trim(),
        newTranslation.trim(),   // may be '' — that's valid
        newNotes.trim() || undefined
      );
      await createVocabItem(db, newVocab);
      showToast('Added', `"${newWord.trim()}" added to vocabulary`, 'success');
      onClose(); // reset handled via visible effect
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to add word', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // ── Derived UI state ─────────────────────────────────────────────────────────
  const busy = adding || translating;
  // source_lang = unknown (learned), target_lang = known (native)
  const langPairLabel =
    activeWorkspace
      ? `${activeWorkspace.source_lang} → ${activeWorkspace.target_lang}`
      : null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>Add Word</Text>
            <Text style={styles.subtitle}>
              {langPairLabel
                ? `Type a word in ${activeWorkspace!.source_lang.toUpperCase()} — translation is fetched automatically.`
                : 'Enter a word and its translation.'}
            </Text>

            {/* ── Word ── */}
            <Text style={styles.label}>Word</Text>
            <TextInput
              style={styles.input}
              placeholder={`Word in ${activeWorkspace?.source_lang?.toUpperCase() ?? 'the learned language'}`}
              placeholderTextColor={colors.textCtaUnfocused}
              value={newWord}
              onChangeText={text => {
                // If word is cleared, reset the manual-edit flag so auto-fill
                // can kick in again when the user types something new.
                if (!text.trim()) {
                  translationEditedByUser.current = false;
                }
                setNewWord(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* ── Translation ── */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Translation{' '}
                <Text style={styles.optionalHint}>(optional)</Text>
              </Text>
              {translating && (
                <ActivityIndicator
                  size="small"
                  color={colors.accentPurple}
                  style={styles.spinner}
                />
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                translating && styles.inputTranslating,
              ]}
              placeholder={
                translating
                  ? 'Translating…'
                  : langPairLabel
                  ? `Auto-translated (${langPairLabel})`
                  : 'Enter the translation'
              }
              placeholderTextColor={
                translating ? colors.accentPurple : colors.textCtaUnfocused
              }
              value={newTranslation}
              onChangeText={text => {
                translationEditedByUser.current = true;
                setNewTranslation(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!translating}
            />

            {/* ── Notes ── */}
            <Text style={styles.label}>
              Notes <Text style={styles.optionalHint}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any helpful context…"
              placeholderTextColor={colors.textCtaUnfocused}
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              returnKeyType="done"
            />

            {/* ── Actions ── */}
            <TouchableOpacity
              style={[styles.addBtn, busy && styles.btnDisabled]}
              onPress={handleAdd}
              disabled={busy}
              activeOpacity={0.7}
            >
              {adding
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.addBtnText}>Add to Vocabulary</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  keyboard: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111111',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
    paddingTop: spacing.m,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.l,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.m },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: { ...typography.smallCaps },
  optionalHint: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '400',
  },
  spinner: { marginRight: 2 },

  input: {
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.m,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: spacing.m,
  },
  inputTranslating: {
    borderWidth: 1,
    borderColor: colors.accentPurple,
    opacity: 0.7,
  },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },

  addBtn: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#000000' },
  btnDisabled: { opacity: 0.5 },

  cancelBtn: {
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '500', color: '#ffffff' },
});
