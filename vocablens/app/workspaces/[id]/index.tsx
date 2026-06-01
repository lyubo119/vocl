import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import BottomTabBar from '../../../components/navigation/BottomTabBar';
import { colors } from '../../../constants/theme';
import { useWorkspace } from '../../../hooks/WorkspaceContext';

// Screens
import PlayScreen from './play';
import StatsScreen from './stats';
import VocabListScreen from './vocab/index';
import WorkspaceSettingsScreen from './settings';
import AddVocabModal from '../../../components/overlays/AddVocabModal';

export default function WorkspaceLayout() {
  const { id, targetTab, targetMode } = useLocalSearchParams<{ id: string; targetTab?: string; targetMode?: string }>();
  const router = useRouter();
  const { activeWorkspace, setWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<string>(targetTab === 'stats' || targetTab === 'vocab' || targetTab === 'settings' ? targetTab : 'play');
  const [addModalVisible, setAddModalVisible] = useState(false);

  useLayoutEffect(() => {
    if (id && activeWorkspace?.id !== id) {
      void setWorkspace(id);
    }
  }, [activeWorkspace?.id, id, setWorkspace]);

  useEffect(() => {
    if (targetTab === 'stats' || targetTab === 'vocab' || targetTab === 'settings' || targetTab === 'play') {
      setActiveTab(targetTab);
    }
  }, [targetTab]);

  const handleTabPress = (tabKey: string) => {
    if (tabKey === 'add') {
      setAddModalVisible(true);
    } else {
      setActiveTab(tabKey);
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'play':
        return <PlayScreen forcedMode={targetMode === 'freeplay' ? 'freeplay' : targetMode === 'challenge' ? 'challenge' : undefined} />;
      case 'stats':
        return <StatsScreen />;
      case 'vocab':
        return <VocabListScreen onAddWord={() => setAddModalVisible(true)} />;
      case 'settings':
        return <WorkspaceSettingsScreen onNavigateToWorkspaces={() => router.replace('/workspaces')} />;
      default:
        return <PlayScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      <AddVocabModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        workspaceId={id as string}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
  },
});
