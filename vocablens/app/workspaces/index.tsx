import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../hooks/WorkspaceContext';
import { Workspace } from '../../lib/db/schema';
import { useRouter } from 'expo-router';
import { colors, spacing, radii, typography, componentStyles } from '../../constants/theme';
import Icon from '../../components/ui/Icon';

export default function WorkspacesScreen() {
  const { workspaces, activeWorkspace, loading, error, createNewWorkspace, setWorkspace } = useWorkspace();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('de');
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      Alert.alert('Error', 'Please enter a workspace name');
      return;
    }
    setCreating(true);
    try {
      const ws = await createNewWorkspace(newWorkspaceName.trim(), sourceLang.trim() || 'en', targetLang.trim() || 'de');
      setNewWorkspaceName('');
      setSourceLang('en');
      setTargetLang('de');
      setModalVisible(false);
      router.push(`/workspaces/${ws.id}`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setWorkspace(workspaceId);
    router.push(`/workspaces/${workspaceId}`);
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
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHandle} />
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Source</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="en"
                    placeholderTextColor={colors.textCtaUnfocused}
                    value={sourceLang}
                    onChangeText={setSourceLang}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Text style={styles.langArrowModal}>→</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Target</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="de"
                    placeholderTextColor={colors.textCtaUnfocused}
                    value={targetLang}
                    onChangeText={setTargetLang}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

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

              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
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
  langRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.m },
  langArrowModal: { fontSize: 20, color: colors.textSecondary, marginBottom: spacing.l + 4 },
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