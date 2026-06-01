import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function WorkspacesLayout() {
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
