import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCallback, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { WorkspaceProvider } from '../hooks/WorkspaceContext';
import { useWorkspace } from '../hooks/WorkspaceContext';
import { ToastProvider } from '../components/overlays/ToastContext';
import { colors } from '../constants/theme';

function NotificationRouteHandler() {
  const router = useRouter();
  const { lastWorkspaceId } = useWorkspace();

  const routeFromResponse = useCallback(async (response: Notifications.NotificationResponse) => {
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

    const hydrateLastResponse = async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (!isMounted || !lastResponse) return;

      await routeFromResponse(lastResponse);
      await Notifications.clearLastNotificationResponseAsync();
    };

    hydrateLastResponse();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      void routeFromResponse(response);
    });

    return () => {
      isMounted = false;
      sub.remove();
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
