import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../../hooks/WorkspaceContext';
import { colors, spacing, radii, typography } from '../../../constants/theme';
import Icon from '../../../components/ui/Icon';
import { initDatabase } from '../../../lib/db/schema';
import { getSetting, setSetting, deleteSetting, SETTINGS_KEYS } from '../../../lib/db/queries/settings';

type Props = {
  onNavigateToWorkspaces: () => void;
};

export default function WorkspaceSettingsScreen({ onNavigateToWorkspaces }: Props) {
  const { activeWorkspace, workspaces, editWorkspace, removeWorkspace, setWorkspace } = useWorkspace();
  const insets = useSafeAreaInsets();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(activeWorkspace?.name ?? '');
  const [sourceLang, setSourceLang] = useState(activeWorkspace?.source_lang ?? '');
  const [targetLang, setTargetLang] = useState(activeWorkspace?.target_lang ?? '');
  const [saving, setSaving] = useState(false);

  // MyMemory email setting
  const [myMemoryEmail, setMyMemoryEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailLoaded, setEmailLoaded] = useState(false);

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const db = await initDatabase();
        const saved = await getSetting(db, SETTINGS_KEYS.MYMEMORY_EMAIL);
        setMyMemoryEmail(saved ?? '');
      } catch {
        // non-critical — ignore
      } finally {
        setEmailLoaded(true);
      }
    };
    loadEmail();
  }, []);

  const handleSaveEmail = async () => {
    setEmailSaving(true);
    try {
      const db = await initDatabase();
      const trimmed = myMemoryEmail.trim();
      if (trimmed) {
        await setSetting(db, SETTINGS_KEYS.MYMEMORY_EMAIL, trimmed);
      } else {
        await deleteSetting(db, SETTINGS_KEYS.MYMEMORY_EMAIL);
      }
      Alert.alert('Saved', trimmed ? 'Email saved. You now have 50,000 chars/day.' : 'Email cleared. Using anonymous quota (5,000 chars/day).');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save email');
    } finally {
      setEmailSaving(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No workspace selected.</Text>
        <TouchableOpacity onPress={onNavigateToWorkspaces} style={styles.btn}>
          <Text style={styles.btnText}>Go to Workspaces</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim() || !sourceLang.trim() || !targetLang.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setSaving(true);
    try {
      await editWorkspace(activeWorkspace.id, {
        name: name.trim(),
        source_lang: sourceLang.trim(),
        target_lang: targetLang.trim(),
      });
      setEditMode(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Workspace',
      `Delete "${activeWorkspace.name}" and all its vocabulary? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWorkspace(activeWorkspace.id);
              onNavigateToWorkspaces();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Current workspace card */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Current Workspace</Text>
        {!editMode ? (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.workspaceName}>{activeWorkspace.name}</Text>
                <View style={styles.langBadge}>
                  <Text style={styles.langText}>{activeWorkspace.source_lang}</Text>
                  <Text style={styles.langArrow}>→</Text>
                  <Text style={styles.langText}>{activeWorkspace.target_lang}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => {
                setName(activeWorkspace.name);
                setSourceLang(activeWorkspace.source_lang);
                setTargetLang(activeWorkspace.target_lang);
                setEditMode(true);
              }} style={styles.editBtn} activeOpacity={0.7}>
                <Icon name="settings" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Workspace name"
              placeholderTextColor={colors.textCtaUnfocused}
              autoCapitalize="words"
            />
            <View style={styles.langRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Source</Text>
                <TextInput
                  style={styles.input}
                  value={sourceLang}
                  onChangeText={setSourceLang}
                  placeholder="en"
                  placeholderTextColor={colors.textCtaUnfocused}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.langArrowModal}>→</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Target</Text>
                <TextInput
                  style={styles.input}
                  value={targetLang}
                  onChangeText={setTargetLang}
                  placeholder="de"
                  placeholderTextColor={colors.textCtaUnfocused}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.7}>
                {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditMode(false)} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Switch workspace */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Switch Workspace</Text>
        {workspaces.map(ws => (
          <TouchableOpacity
            key={ws.id}
            style={[styles.workspaceRow, ws.id === activeWorkspace.id && styles.workspaceRowActive]}
            onPress={() => setWorkspace(ws.id)}
            activeOpacity={0.7}
          >
            <View style={styles.workspaceRowInfo}>
              <Text style={styles.workspaceRowName}>{ws.name}</Text>
              <Text style={styles.workspaceRowLang}>{ws.source_lang} → {ws.target_lang}</Text>
            </View>
            {ws.id === activeWorkspace.id && (
              <Icon name="check" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.newWorkspaceBtn} onPress={onNavigateToWorkspaces} activeOpacity={0.7}>
          <Icon name="plus" size={18} color="#ffffff" />
          <Text style={styles.newWorkspaceBtnText}>Manage Workspaces</Text>
        </TouchableOpacity>
      </View>

      {/* Translation / MyMemory */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Translation (MyMemory)</Text>
        <View style={styles.card}>
          <Text style={styles.emailHint}>
            Enter your email to unlock 50,000 chars/day (instead of 5,000). No account needed — MyMemory uses it for quota tracking only.
          </Text>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={myMemoryEmail}
            onChangeText={setMyMemoryEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.textCtaUnfocused}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={emailLoaded}
          />
          <TouchableOpacity
            style={[styles.saveBtn, emailSaving && { opacity: 0.6 }]}
            onPress={handleSaveEmail}
            disabled={emailSaving}
            activeOpacity={0.7}
          >
            {emailSaving
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={styles.saveBtnText}>Save Email</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.error }]}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
          <Icon name="x" size={18} color={colors.error} />
          <Text style={styles.deleteBtnText}>Delete This Workspace</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: spacing.l, paddingBottom: spacing.xl },
  centered: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.l },
  errorText: { ...typography.body, textAlign: 'center', marginBottom: spacing.m },

  header: { marginBottom: spacing.l },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff' },

  section: { marginBottom: spacing.l },
  sectionLabel: { ...typography.smallCaps, marginBottom: spacing.s },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.m,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  workspaceName: { fontSize: 20, fontWeight: '600', color: '#ffffff', marginBottom: spacing.xs },
  langBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  langText: { fontSize: 13, color: colors.accentPurple, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' },
  langArrow: { color: colors.textSecondary },
  editBtn: { padding: spacing.s },

  fieldLabel: { ...typography.smallCaps, marginBottom: spacing.xs, marginTop: spacing.s },
  emailHint: { ...typography.body, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.s },
  input: {
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.m,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: spacing.xs,
  },
  langRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s },
  langArrowModal: { fontSize: 20, color: colors.textSecondary, marginBottom: spacing.m, paddingBottom: 2 },
  editActions: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.m },
  saveBtn: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: radii.md,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#000000' },
  cancelBtn: {
    flex: 1, backgroundColor: colors.bgButtonSub, borderRadius: radii.md,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '500', color: '#ffffff' },

  workspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.m,
    marginBottom: spacing.s,
  },
  workspaceRowActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  workspaceRowInfo: { flex: 1 },
  workspaceRowName: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  workspaceRowLang: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  newWorkspaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
  },
  newWorkspaceBtnText: { fontSize: 15, color: '#ffffff' },

  btn: { backgroundColor: '#ffffff', borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: spacing.l },
  btnText: { fontSize: 15, fontWeight: '600', color: '#000000' },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderRadius: radii.md,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  deleteBtnText: { fontSize: 15, fontWeight: '500', color: colors.error },
});
