import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../../../../lib/db/schema';
import { getVocabByWorkspace, createVocabItem, deleteVocabItem } from '../../../../lib/db/queries/vocab';
import { getNewVocabItem } from '../../../../lib/scheduler/spacedRepetition';
import { exportVocabToCsv } from '../../../../lib/csv/csvExport';
import { pickAndParseCsv } from '../../../../lib/csv/csvImport';
import { useWorkspace } from '../../../../hooks/WorkspaceContext';
import { colors, spacing, radii, typography, componentStyles } from '../../../../constants/theme';
import Icon from '../../../../components/ui/Icon';

type Props = {
  onAddWord?: () => void;
};

export default function VocabListScreen({ onAddWord }: Props) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? '';
  const insets = useSafeAreaInsets();

  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadVocab = async () => {
      try {
        const database = await initDatabase();
        setDb(database);
        const vocab = await getVocabByWorkspace(database, workspaceId);
        setVocabItems(vocab);
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load vocabulary');
      } finally {
        setLoading(false);
      }
    };
    if (workspaceId) loadVocab();
  }, [workspaceId]);

  const handleExport = async () => {
    setMenuVisible(false);
    if (vocabItems.length === 0) {
      Alert.alert('Nothing to export', 'Add some words first.');
      return;
    }
    setExporting(true);
    try {
      await exportVocabToCsv(vocabItems, activeWorkspace?.name ?? 'vocab');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setMenuVisible(false);
    if (!db) return;
    setImporting(true);
    try {
      const rows = await pickAndParseCsv();
      if (!rows || rows.length === 0) {
        setImporting(false);
        return;
      }
      let added = 0;
      let skipped = 0;
      for (const row of rows) {
        try {
          const newVocab = getNewVocabItem(workspaceId, row.word, row.translation);
          const created = await createVocabItem(db, newVocab);
          setVocabItems(prev => [created, ...prev]);
          added++;
        } catch {
          skipped++;
        }
      }
      Alert.alert('Import complete', `Added ${added} words${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}.`);
    } catch (err) {
      Alert.alert('Import failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImporting(false);
    }
  };

  const getAccuracyColor = (item: any) => {
    if (item.total_attempts === 0) return colors.textSecondary;
    const acc = item.total_correct / item.total_attempts;
    if (acc >= 0.8) return colors.success;
    if (acc >= 0.5) return colors.accentPurple;
    return colors.error;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Vocabulary</Text>
          <Text style={styles.subtitle}>{vocabItems.length} word{vocabItems.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          {(importing || exporting) && <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: spacing.s }} />}
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn} activeOpacity={0.7}>
            <Icon name="more-vertical" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vocabItems.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vocabItems.filter(v => v.weight < 0.2).length}</Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vocabItems.filter(v => v.weight >= 0.7).length}</Text>
          <Text style={styles.statLabel}>Learning</Text>
        </View>
      </View>

      {/* List */}
      {vocabItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="list" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Words Yet</Text>
          <Text style={styles.emptyText}>Tap + to add your first vocabulary word.</Text>
        </View>
      ) : (
        <FlatList
          data={vocabItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.l, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.vocabCard}>
              <View style={styles.vocabMain}>
                <Text style={styles.vocabWord}>{item.word}</Text>
                <Text style={styles.vocabTranslation}>{item.translation}</Text>
              </View>
              {item.notes ? <Text style={styles.vocabNotes}>{item.notes}</Text> : null}
              <View style={styles.vocabDivider} />
              <View style={styles.vocabStats}>
                <Text style={styles.vocabStatLabel}>Weight: <Text style={styles.vocabStatValue}>{item.weight.toFixed(2)}</Text></Text>
                <Text style={styles.vocabStatLabel}>Streak: <Text style={styles.vocabStatValue}>{item.correct_streak}</Text></Text>
                <Text style={styles.vocabStatLabel}>Accuracy: <Text style={[styles.vocabStatValue, { color: getAccuracyColor(item) }]}>
                  {item.total_attempts > 0 ? Math.round((item.total_correct / item.total_attempts) * 100) + '%' : '—'}
                </Text></Text>
              </View>
            </View>
          )}
        />
      )}

      {/* 3-dot menu modal */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={handleExport} activeOpacity={0.7}>
              <Icon name="download" size={20} color="#ffffff" />
              <Text style={styles.menuItemText}>Export as CSV</Text>
            </TouchableOpacity>
            <View style={styles.menuItemDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleImport} activeOpacity={0.7}>
              <Icon name="upload" size={20} color="#ffffff" />
              <Text style={styles.menuItemText}>Import from CSV</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  centered: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff' },
  subtitle: { ...typography.smallCaps, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  menuBtn: { padding: spacing.s },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    marginHorizontal: spacing.l,
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.m,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  statLabel: { ...typography.smallCaps, fontSize: 10 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.divider },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.h3, marginTop: spacing.m, marginBottom: spacing.s, textAlign: 'center' },
  emptyText: { ...typography.body, textAlign: 'center' },

  vocabCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.m,
    marginBottom: spacing.s,
  },
  vocabMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vocabWord: { ...typography.h3, flex: 1 },
  vocabTranslation: { fontSize: 16, color: colors.accentPurple, fontStyle: 'italic' },
  vocabNotes: { ...typography.body, fontSize: 13, marginTop: spacing.s, color: colors.textSecondary },
  vocabDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.s },
  vocabStats: { flexDirection: 'row', justifyContent: 'space-between' },
  vocabStatLabel: { ...typography.smallCaps, fontSize: 10 },
  vocabStatValue: { color: '#ffffff', fontWeight: '500' },

  // Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.l,
    paddingBottom: 80, // above tab bar
  },
  menuSheet: {
    backgroundColor: '#1a1a1a',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    padding: spacing.m,
    paddingHorizontal: spacing.l,
  },
  menuItemText: { fontSize: 16, color: '#ffffff', fontWeight: '500' },
  menuItemDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.m },
});