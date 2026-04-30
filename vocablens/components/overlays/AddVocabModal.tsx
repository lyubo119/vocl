import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createVocabItem } from '../../lib/db/queries/vocab';
import { getNewVocabItem } from '../../lib/scheduler/spacedRepetition';
import { initDatabase } from '../../lib/db/schema';
import { colors, spacing, radii, typography } from '../../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
};

export default function AddVocabModal({ visible, onClose, workspaceId }: Props) {
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const reset = () => {
    setNewWord('');
    setNewTranslation('');
    setNewNotes('');
  };

  const handleAdd = async () => {
    if (!newWord.trim() || !newTranslation.trim()) {
      Alert.alert('Error', 'Word and translation are required');
      return;
    }
    setAdding(true);
    try {
      const db = await initDatabase();
      const newVocab = getNewVocabItem(workspaceId, newWord.trim(), newTranslation.trim(), newNotes.trim() || undefined);
      await createVocabItem(db, newVocab);
      reset();
      onClose();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add word');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

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
            <Text style={styles.subtitle}>Enter a word and its translation.</Text>

            <Text style={styles.label}>Word</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the word"
              placeholderTextColor={colors.textCtaUnfocused}
              value={newWord}
              onChangeText={setNewWord}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={styles.label}>Translation</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the translation"
              placeholderTextColor={colors.textCtaUnfocused}
              value={newTranslation}
              onChangeText={setNewTranslation}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any helpful context…"
              placeholderTextColor={colors.textCtaUnfocused}
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.addBtn, adding && styles.btnDisabled]}
              onPress={handleAdd}
              disabled={adding}
              activeOpacity={0.7}
            >
              {adding
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.addBtnText}>Add to Vocabulary</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
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
  label: { ...typography.smallCaps, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.m,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: spacing.m,
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
  btnDisabled: { opacity: 0.6 },
  cancelBtn: {
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '500', color: '#ffffff' },
});
