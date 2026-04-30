import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function WorkspaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'none',
      }}
    />
  );
}