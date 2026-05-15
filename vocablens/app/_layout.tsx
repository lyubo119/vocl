import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkspaceProvider } from '../hooks/WorkspaceContext';
import { ToastProvider } from '../components/overlays/ToastContext';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <WorkspaceProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bgHeader },
              headerTintColor: colors.textPrimary,
              headerShadowVisible: false,
              headerTitleStyle: { fontWeight: '500' },
              contentStyle: { backgroundColor: colors.bgPrimary },
              animation: 'fade',
              headerShown: false,
            }}
          />
          <StatusBar style="light" />
        </WorkspaceProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}