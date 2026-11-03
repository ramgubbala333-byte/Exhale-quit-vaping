import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors } from '@/theme';

/** Entry gate: wait for storage, then route to onboarding or the app. */
export default function Index() {
  const hasHydrated = useStore((s) => s.hasHydrated);
  const plan = useStore((s) => s.plan);

  if (!hasHydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }
  if (!plan) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
