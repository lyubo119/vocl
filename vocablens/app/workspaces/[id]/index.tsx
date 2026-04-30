import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import BottomTabBar from '../../../components/navigation/BottomTabBar';
import { colors } from '../../../constants/theme';

// Screens
import PlayScreen from './play';
import StatsScreen from './stats';
import VocabListScreen from './vocab/index';
import WorkspaceSettingsScreen from './settings';
import AddVocabModal from '../../../components/overlays/AddVocabModal';

export default function WorkspaceLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('play');
  const [addModalVisible, setAddModalVisible] = useState(false);

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
        return <PlayScreen />;
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