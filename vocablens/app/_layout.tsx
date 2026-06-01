import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCallback, useEffect } from 'react';
import { WorkspaceProvider } from '../hooks/WorkspaceContext';
import { useWorkspace } from '../hooks/WorkspaceContext';
import { ToastProvider } from '../components/overlays/ToastContext';
import { colors } from '../constants/theme';
import {
  addNotificationResponseListener,
  clearLastNotificationResponseAsync,
  getLastNotificationResponseAsync,
  initializeNotifications,
} from '../lib/notifications';

function NotificationRouteHandler() {
  const router = useRouter();
  const { lastWorkspaceId } = useWorkspace();

  const routeFromResponse = useCallback(async (response: any) => {
    const data = response.notification.request.content.data as {
      route?: string;
      workspaceId?: string;
      targetTab?: string;
      targetMode?: string;
    };

    if (data?.route !== 'challenge') return;

    const requestedWorkspaceId = typeof data.workspaceId === 'string' ? data.workspaceId : undefined;
    const workspaceId = requestedWorkspaceId ?? lastWorkspaceId ?? undefined;

    if (workspaceId) {
      router.push({
        pathname: '/workspaces/[id]',
        params: {
          id: workspaceId,
          targetTab: 'play',
          targetMode: 'challenge',
        },
      });
      return;
    }

    router.push('/workspaces');
  }, [lastWorkspaceId, router]);

  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | null = null;

    const registerNotificationObservers = async () => {
      try {
        await initializeNotifications();

        const lastResponse = await getLastNotificationResponseAsync();
        if (!isMounted) return;

        if (lastResponse) {
          await routeFromResponse(lastResponse);
          await clearLastNotificationResponseAsync();
        }

        cleanup = await addNotificationResponseListener((response) => {
          void routeFromResponse(response);
        });
        if (!isMounted && cleanup) {
          cleanup();
          cleanup = null;
        }
      } catch {
        // Non-fatal: notification routing should not break app startup.
      }
    };

    registerNotificationObservers();

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [routeFromResponse]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <WorkspaceProvider>
          <NotificationRouteHandler />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bgHeader },
              headerTintColor: colors.textPrimary,
              headerShadowVisible: false,
              headerTitleStyle: { fontWeight: '500' },
              contentStyle: { backgroundColor: colors.bgPrimary },
              animation: 'none',
              headerShown: false,
            }}
          />
          <StatusBar style="light" />
        </WorkspaceProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
