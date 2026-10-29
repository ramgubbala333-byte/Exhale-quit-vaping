import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Body, Display, GhostButton, Label, Screen } from '@/components/ui';
import { colors, fonts, radii, spacing } from '@/theme';

export default function About() {
  return (
    <Screen>
      <Label color={colors.pine}>About</Label>
      <Display size={34} style={{ marginTop: spacing.xs }}>
        Mistless
      </Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        A calm, private companion for quitting vaping. Version 1.0.
      </Body>

      <View style={styles.privacyBand}>
        <Body color={colors.bg} size={17} style={styles.privacyText}>
          No account. No tracking. Mistless collects nothing — your data
          never leaves this phone unless you export it yourself.
        </Body>
      </View>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        Private by design
      </Label>
      <Body>
        Mistless is local-first. Everything you enter lives in storage on
        this phone only. There is no account, no server, and no analytics,
        and your data never leaves this device unless you deliberately
        export it yourself from Settings. If you delete the app, the data
        goes with it.
      </Body>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        About the health timeline
      </Label>
      <Body>
        The milestone descriptions summarise general wellness information
        published by public health sources about how the body recovers
        after quitting nicotine. They are general population-level
        estimates (WHO/CDC), not personal measurements. They are
        educational, not medical advice, and individual experiences vary.
        If you have symptoms that worry you, talk to a clinician. If
        cravings feel unmanageable, free help lines such as 1-800-QUIT-NOW
        (US) can connect you with a trained quit coach.
      </Body>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        Important
      </Label>
      <Body>
        Mistless is not a medical device and does not diagnose, treat, cure,
        or prevent any medical condition. Talk to a healthcare professional
        for medical advice.
      </Body>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        Free, for now and honestly
      </Label>
      <Body>
        Mistless is fully free. A Plus tier is planned for the future; if it
        launches, everything you use today stays free.
      </Body>

      <View style={{ marginTop: spacing.xl }}>
        <GhostButton title="Back" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  privacyBand: {
    backgroundColor: colors.pine,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  privacyText: { fontFamily: fonts.bodySemiBold },
});
