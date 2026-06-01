import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../hooks/WorkspaceContext';
import { Workspace } from '../../lib/db/schema';
import { getVocabByWorkspace, createVocabItem } from '../../lib/db/queries/vocab';
import { getNewVocabItem } from '../../lib/scheduler/spacedRepetition';
import { useRouter } from 'expo-router';
import { useToast } from '../../components/overlays/ToastContext';
import { colors, spacing, radii, typography } from '../../constants/theme';
import Icon from '../../components/ui/Icon';
import LanguageSelect from '../../components/ui/LanguageSelect';
import { areSameTranslationLanguage, normalizeTranslationLanguageCode } from '../../lib/translation/languages';

export default function WorkspacesScreen() {
  const { workspaces, activeWorkspace, loading, error, createNewWorkspace, setWorkspace, db } = useWorkspace();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [sourceLang, setSourceLang] = useState('en-GB');
  const [targetLang, setTargetLang] = useState('de-DE');
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copyVocab, setCopyVocab] = useState(true);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetHeightRef = useRef(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (modalVisible) {
      sheetTranslateY.setValue(0);
    }
  }, [modalVisible, sheetTranslateY]);

  const closeCreateModal = () => {
    setModalVisible(false);
  };

  const closeCreateModalBySwipe = (currentY: number) => {
    const clampedY = Math.max(0, currentY);
    const targetY = Math.max(sheetHeightRef.current + 48, 520);
    const remaining = Math.max(0, targetY - clampedY);
    const duration = Math.min(180, Math.max(90, remaining * 0.35));

    sheetTranslateY.stopAnimation();
    sheetTranslateY.setValue(clampedY);
    Animated.timing(sheetTranslateY, {
      toValue: targetY,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const snapCreateModalBack = () => {
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 160,
      friction: 18,
    }).start();
  };

  const createModalPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        sheetTranslateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 1) {
          closeCreateModalBySwipe(gestureState.dy);
          return;
        }
        snapCreateModalBack();
      },
      onPanResponderTerminate: () => {
        snapCreateModalBack();
      },
    })
  ).current;

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      showToast('Error', 'Please enter a workspace name', 'error');
      return;
    }
    setCreating(true);
    try {
      const sourceCode = normalizeTranslationLanguageCode(sourceLang.trim() || 'en-GB');
      const targetCode = normalizeTranslationLanguageCode(targetLang.trim() || 'de-DE');
      const ws = await createNewWorkspace(newWorkspaceName.trim(), sourceCode, targetCode);
      
      const matchingWorkspace = workspaces.find(w => 
        (areSameTranslationLanguage(w.source_lang, sourceCode) && areSameTranslationLanguage(w.target_lang, targetCode)) ||
        (areSameTranslationLanguage(w.source_lang, targetCode) && areSameTranslationLanguage(w.target_lang, sourceCode))
      );

      if (matchingWorkspace && copyVocab && db) {
        const oldVocab = await getVocabByWorkspace(db, matchingWorkspace.id);
        const isInverted = areSameTranslationLanguage(matchingWorkspace.source_lang, targetCode);
        for (const item of oldVocab) {
          try {
            const word = isInverted ? item.translation : item.word;
            const translation = isInverted ? item.word : item.translation;
            const newVocab = getNewVocabItem(ws.id, word, translation);
            await createVocabItem(db, newVocab);
          } catch (e) {
            // ignore errors
          }
        }
      }

      setNewWorkspaceName('');
      setSourceLang('en-GB');
      setTargetLang('de-DE');
      closeCreateModal();
      showToast('Created', `Workspace "${ws.name}" created`, 'success');
      requestAnimationFrame(() => {
        router.replace(`/workspaces/${ws.id}`);
      });
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to create workspace', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    void setWorkspace(workspaceId);
    requestAnimationFrame(() => {
      router.replace(`/workspaces/${workspaceId}`);
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workspaces</Text>
        <Text style={styles.subtitle}>{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* List */}
      {workspaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="list" size={56} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Workspaces Yet</Text>
          <Text style={styles.emptyText}>
            Create your first workspace to start building your vocabulary.
          </Text>
        </View>
      ) : (
        <FlatList
          data={workspaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.workspaceCard, activeWorkspace?.id === item.id && styles.activeCard]}
              onPress={() => handleSelectWorkspace(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.workspaceName}>{item.name}</Text>
                <View style={styles.langBadge}>
                  <Text style={styles.langText}>{item.source_lang}</Text>
                  <Text style={styles.langArrow}>→</Text>
                  <Text style={styles.langText}>{item.target_lang}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + spacing.m }]}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Icon name="plus" size={20} color="#000000" strokeWidth={2.5} />
          <Text style={styles.fabText}>New Workspace</Text>
        </TouchableOpacity>
      </View>

      {/* Create modal */}
      <Modal
        animationType="none"
        transparent
        visible={modalVisible}
        onRequestClose={closeCreateModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeCreateModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
            <Animated.View
              style={{ transform: [{ translateY: sheetTranslateY }] }}
              {...createModalPanResponder.panHandlers}
            >
            <Pressable
              style={styles.modalContent}
              onPress={e => e.stopPropagation()}
              onLayout={(event) => {
                sheetHeightRef.current = event.nativeEvent.layout.height;
              }}
            >
              <Pressable style={styles.handleTouch} onPress={e => e.stopPropagation()}>
                <View style={styles.modalHandle} />
              </Pressable>
              <Text style={styles.modalTitle}>Create Workspace</Text>
              <Text style={styles.modalSubtitle}>Set up a new vocabulary space for a language pair.</Text>

              <Text style={styles.inputLabel}>Workspace Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Spanish Basics"
                placeholderTextColor={colors.textCtaUnfocused}
                value={newWorkspaceName}
                onChangeText={setNewWorkspaceName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <View style={styles.langRow}>
                <LanguageSelect
                  label="Source"
                  value={sourceLang}
                  onChange={setSourceLang}
                  includeAutodetect
                />
                <Text style={styles.langArrowModal}>→</Text>
                <LanguageSelect
                  label="Target"
                  value={targetLang}
                  onChange={setTargetLang}
                />
              </View>

              {(() => {
                const sourceCode = sourceLang.trim() || 'en-GB';
                const targetCode = targetLang.trim() || 'de-DE';
                const matchingWorkspace = workspaces.find(w => 
                  (areSameTranslationLanguage(w.source_lang, sourceCode) && areSameTranslationLanguage(w.target_lang, targetCode)) ||
                  (areSameTranslationLanguage(w.source_lang, targetCode) && areSameTranslationLanguage(w.target_lang, sourceCode))
                );

                if (!matchingWorkspace) return null;

                return (
                  <TouchableOpacity 
                    style={styles.copyToggle} 
                    onPress={() => setCopyVocab(!copyVocab)}
                    activeOpacity={0.7}
                  >
                    <Icon name={copyVocab ? "check-square" : "square"} size={20} color={copyVocab ? colors.success : colors.textSecondary} />
                    <Text style={styles.copyToggleText}>Copy words from {matchingWorkspace.name}</Text>
                  </TouchableOpacity>
                );
              })()}

              <TouchableOpacity
                style={[styles.createButton, creating && styles.buttonDisabled]}
                onPress={handleCreateWorkspace}
                disabled={creating}
                activeOpacity={0.7}
              >
                {creating
                  ? <ActivityIndicator size="small" color="#000000" />
                  : <Text style={styles.createButtonText}>Create Workspace</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={closeCreateModal} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  centered: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.l },
  loadingText: { ...typography.body, marginTop: spacing.m },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center' },

  header: { paddingHorizontal: spacing.l, paddingTop: spacing.l, paddingBottom: spacing.m },
  title: { fontSize: 32, fontWeight: '700', color: '#ffffff', marginBottom: spacing.xs },
  subtitle: { ...typography.smallCaps },

  listContent: { paddingHorizontal: spacing.l, paddingBottom: 120 },
  workspaceCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.m,
    marginBottom: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeCard: { borderLeftWidth: 3, borderLeftColor: '#ffffff' },
  cardContent: { flex: 1 },
  workspaceName: { ...typography.h3, marginBottom: spacing.xs },
  langBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  langText: { ...typography.smallCaps, color: colors.accentPurple, fontSize: 11 },
  langArrow: { color: colors.textSecondary, fontSize: 12 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.h3, marginTop: spacing.m, marginBottom: spacing.s, textAlign: 'center' },
  emptyText: { ...typography.body, textAlign: 'center' },

  fabContainer: { position: 'absolute', left: spacing.l, right: spacing.l },
  fab: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  fabText: { fontSize: 15, fontWeight: '600', color: '#000000' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalKeyboard: { justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
    paddingTop: spacing.m,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.divider, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.l },
  handleTouch: { alignSelf: 'stretch', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: spacing.xs },
  modalSubtitle: { ...typography.body, marginBottom: spacing.l },
  inputLabel: { ...typography.smallCaps, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.m,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: spacing.m,
  },
  langRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.m, marginBottom: spacing.m },
  langArrowModal: { fontSize: 20, color: colors.textSecondary, marginBottom: 18 },
  copyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    gap: spacing.s,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.m,
    borderRadius: radii.md,
  },
  copyToggleText: {
    fontSize: 15,
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  createButtonText: { fontSize: 15, fontWeight: '600', color: '#000000' },
  buttonDisabled: { opacity: 0.6 },
  cancelButton: {
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  cancelButtonText: { fontSize: 15, fontWeight: '500', color: '#ffffff' },
});
