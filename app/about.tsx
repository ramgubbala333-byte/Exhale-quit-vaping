import { router } from 'expo-router';
import { View } from 'react-native';

import { Body, Display, GhostButton, Label, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function About() {
  return (
    <Screen>
      <Label color={colors.pine}>About</Label>
      <Display size={34} style={{ marginTop: spacing.xs }}>
        Exhale
      </Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        A calm, private companion for quitting vaping. Version 1.0.
      </Body>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        Private by design
      </Label>
      <Body>
        Everything you enter lives in storage on this phone only. There is
        no account, no server, and no analytics. If you delete the app, the
        data goes with it.
      </Body>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        About the health timeline
      </Label>
      <Body>
        The milestone descriptions summarise general wellness information
        published by public health sources about how the body recovers
        after quitting nicotine. They are educational, not medical advice,
        and individual experiences vary. If you have symptoms that worry
        you, talk to a clinician. If cravings feel unmanageable, free help
        lines such as 1-800-QUIT-NOW (US) can connect you with a trained
        quit coach.
      </Body>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        Free, for now and honestly
      </Label>
      <Body>
        Exhale is fully free. A Plus tier is planned for the future; if it
        launches, everything you use today stays free.
      </Body>

      <View style={{ marginTop: spacing.xl }}>
        <GhostButton title="Back" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
