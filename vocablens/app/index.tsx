import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useWorkspace } from '../hooks/WorkspaceContext';
import { colors } from '../constants/theme';

export default function Index() {
  const { loading, lastWorkspaceId, workspaces } = useWorkspace();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // If we have a last workspace, go directly to it
  if (lastWorkspaceId) {
    const exists = workspaces.find(w => w.id === lastWorkspaceId);
    if (exists) {
      return <Redirect href={`/workspaces/${lastWorkspaceId}`} />;
    }
  }

  // Otherwise go to workspace list
  return <Redirect href="/workspaces" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});