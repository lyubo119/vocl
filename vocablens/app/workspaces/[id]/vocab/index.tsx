import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../../../../lib/db/schema';
import { getVocabByWorkspace, createVocabItem, deleteVocabItem, updateVocabItem } from '../../../../lib/db/queries/vocab';
import { getNewVocabItem } from '../../../../lib/scheduler/spacedRepetition';
import { exportVocabToCsv } from '../../../../lib/csv/csvExport';
import { pickAndParseCsv } from '../../../../lib/csv/csvImport';
import { useWorkspace } from '../../../../hooks/WorkspaceContext';
import { useToast } from '../../../../components/overlays/ToastContext';
import { colors, spacing, radii, typography } from '../../../../constants/theme';
import Icon from '../../../../components/ui/Icon';

type Props = {
  onAddWord?: () => void;
};

const SWIPE_ACTION_WIDTH = 84;

type SwipeToDeleteRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
};

function SwipeToDeleteRow({ children, onDelete }: SwipeToDeleteRowProps) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const startXRef = React.useRef(0);
  const openRef = React.useRef(false);
  const deleteActionOpacity = translateX.interpolate({
    inputRange: [-SWIPE_ACTION_WIDTH, -20, 0],
    outputRange: [1, 0.15, 0],
    extrapolate: 'clamp',
  });
  const deleteActionScale = translateX.interpolate({
    inputRange: [-SWIPE_ACTION_WIDTH, 0],
    outputRange: [1, 0.88],
    extrapolate: 'clamp',
  });

  const setOpen = (open: boolean) => {
    openRef.current = open;
    Animated.spring(translateX, {
      toValue: open ? -SWIPE_ACTION_WIDTH : 0,
      useNativeDriver: true,
      tension: 160,
      friction: 18,
    }).start();
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 8,
      onPanResponderGrant: () => {
        startXRef.current = openRef.current ? -SWIPE_ACTION_WIDTH : 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const rawX = startXRef.current + gestureState.dx;
        const clampedX = Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, rawX));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalX = startXRef.current + gestureState.dx;
        const shouldOpen = finalX < -SWIPE_ACTION_WIDTH * 0.45 || gestureState.vx < -0.45;
        setOpen(shouldOpen);
      },
      onPanResponderTerminate: () => setOpen(false),
    })
  ).current;

  return (
    <View style={styles.swipeRow}>
      <Animated.View
        style={[
          styles.deleteActionContainer,
          {
            opacity: deleteActionOpacity,
            transform: [{ scale: deleteActionScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteActionButton}
          onPress={onDelete}
          activeOpacity={0.8}
        >
          <Icon name="trash-minimal" size={16} color="#ffffff" strokeWidth={1.7} />
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        style={[styles.swipeContent, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default function VocabListScreen({ onAddWord }: Props) {
  const { activeWorkspace } = useWorkspace();
  const { showToast } = useToast();
  const workspaceId = activeWorkspace?.id ?? '';
  const insets = useSafeAreaInsets();

  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadVocab = async () => {
      try {
        const database = await initDatabase();
        setDb(database);
        const vocab = await getVocabByWorkspace(database, workspaceId);
        setVocabItems(vocab);
      } catch (err) {
        showToast('Error', err instanceof Error ? err.message : 'Failed to load vocabulary', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (workspaceId) loadVocab();
  }, [workspaceId]);

  const handleExport = async () => {
    setMenuVisible(false);
    if (vocabItems.length === 0) {
      showToast('Nothing to export', 'Add some words first.', 'info');
      return;
    }
    setExporting(true);
    try {
      await exportVocabToCsv(vocabItems, activeWorkspace?.name ?? 'vocab');
    } catch (err) {
      showToast('Export failed', err instanceof Error ? err.message : 'Unknown error', 'error');
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
      showToast('Import complete', `Added ${added} words${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}.`, 'success');
    } catch (err) {
      showToast('Import failed', err instanceof Error ? err.message : 'Unknown error', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDeactivateMastered = async () => {
    setMenuVisible(false);
    if (!db) return;
    
    const toDeactivate = vocabItems.filter(item => {
      if (item.is_deactivated) return false;
      if (item.total_attempts === 0) return false;
      return (item.total_correct / item.total_attempts) >= 0.8;
    });

    if (toDeactivate.length === 0) {
      showToast('Notice', 'No active mastered words found (80%+ accuracy).', 'info');
      return;
    }

    try {
      let updatedCount = 0;
      for (const item of toDeactivate) {
        await updateVocabItem(db, item.id, { is_deactivated: 1 });
        updatedCount++;
      }
      // Refresh list
      const vocab = await getVocabByWorkspace(db, workspaceId);
      setVocabItems(vocab);
      showToast('Success', `Deactivated ${updatedCount} mastered word${updatedCount !== 1 ? 's' : ''}.`, 'success');
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Unknown error', 'error');
    }
  };

  const toggleDeactivate = async (item: any) => {
    if (!db) return;
    try {
      const newStatus = item.is_deactivated ? 0 : 1;
      const updated = await updateVocabItem(db, item.id, { is_deactivated: newStatus });
      setVocabItems(prev => prev.map(v => v.id === item.id ? updated : v));
    } catch (err) {
      showToast('Error', 'Failed to update word status.', 'error');
    }
  };

  const handleDeleteVocab = async (item: any) => {
    if (!db) return;
    try {
      await deleteVocabItem(db, item.id);
      setVocabItems(prev => prev.filter(v => v.id !== item.id));
      showToast('Deleted', `"${item.word}" removed from the list.`, 'success');
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to delete word.', 'error');
    }
  };

  const filteredVocab = vocabItems
    .filter(v => {
      const q = searchQuery.toLowerCase();
      return v.word.toLowerCase().includes(q) || v.translation.toLowerCase().includes(q);
    })
    .sort((a, b) => a.word.localeCompare(b.word));

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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vocabulary..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Icon name="x-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {filteredVocab.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="list" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>{searchQuery ? 'No Results' : 'No Words Yet'}</Text>
          <Text style={styles.emptyText}>{searchQuery ? 'Try adjusting your search query.' : 'Tap + to add your first vocabulary word.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVocab}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.l, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SwipeToDeleteRow onDelete={() => handleDeleteVocab(item)}>
              <TouchableOpacity 
                style={[styles.vocabCard, item.is_deactivated && styles.vocabCardDeactivated]}
                onLongPress={() => toggleDeactivate(item)}
                activeOpacity={0.7}
              >
                <View style={styles.vocabMain}>
                  <Text style={[styles.vocabWord, item.is_deactivated && styles.textDeactivated]}>{item.word}</Text>
                  <Text style={[styles.vocabTranslation, item.is_deactivated && styles.textDeactivated]}>{item.translation}</Text>
                </View>
                {item.notes ? <Text style={[styles.vocabNotes, item.is_deactivated && styles.textDeactivated]}>{item.notes}</Text> : null}
                <View style={styles.vocabDivider} />
                <View style={styles.vocabStats}>
                  <Text style={[styles.vocabStatLabel, item.is_deactivated && styles.textDeactivated]}>Weight: <Text style={styles.vocabStatValue}>{item.weight.toFixed(2)}</Text></Text>
                  <Text style={[styles.vocabStatLabel, item.is_deactivated && styles.textDeactivated]}>Streak: <Text style={styles.vocabStatValue}>{item.correct_streak}</Text></Text>
                  <Text style={[styles.vocabStatLabel, item.is_deactivated && styles.textDeactivated]}>Accuracy: <Text style={[styles.vocabStatValue, !item.is_deactivated && { color: getAccuracyColor(item) }]}>
                    {item.total_attempts > 0 ? Math.round((item.total_correct / item.total_attempts) * 100) + '%' : '—'}
                  </Text></Text>
                </View>
              </TouchableOpacity>
            </SwipeToDeleteRow>
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
            <View style={styles.menuItemDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDeactivateMastered} activeOpacity={0.7}>
              <Icon name="eye-off" size={20} color="#ffffff" />
              <Text style={styles.menuItemText}>Deactivate Mastered (80%+)</Text>
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
  },
  swipeRow: {
    marginBottom: spacing.s,
    position: 'relative',
    overflow: 'hidden',
  },
  swipeContent: {
    zIndex: 2,
  },
  deleteActionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionButton: {
    width: SWIPE_ACTION_WIDTH - spacing.s,
    height: '100%',
    borderRadius: radii.lg,
    backgroundColor: '#c53b3b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vocabMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vocabWord: { ...typography.h3, flex: 1 },
  vocabTranslation: { fontSize: 16, color: colors.accentPurple, fontStyle: 'italic' },
  vocabNotes: { ...typography.body, fontSize: 13, marginTop: spacing.s, color: colors.textSecondary },
  vocabDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.s },
  vocabStats: { flexDirection: 'row', justifyContent: 'space-between' },
  vocabStatLabel: { ...typography.smallCaps, fontSize: 10 },
  vocabStatValue: { color: '#ffffff', fontWeight: '500' },
  vocabCardDeactivated: { backgroundColor: '#2a2a2a' },
  textDeactivated: { color: colors.textSecondary },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    paddingHorizontal: spacing.m,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: spacing.s,
  },
  clearSearchBtn: {
    padding: spacing.xs,
  },

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
