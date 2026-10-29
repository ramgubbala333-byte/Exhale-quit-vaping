import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Display, GhostButton, Label, Screen } from '@/components/ui';
import { colors, fonts, radii, spacing } from '@/theme';

function FaqRow({
  q,
  a,
  last = false,
}: {
  q: string;
  a: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.faqRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{a}</Text>
    </View>
  );
}

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

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        Questions, answered plainly
      </Label>
      <View>
        <FaqRow
          q="Is Mistless free?"
          a="Yes, completely. The counter, SOS, lapse rescue, plans, missions and health timeline are free forever. A paid Plus tier may add extras one day; nothing you use now will move behind it."
        />
        <FaqRow
          q="Do I need an account?"
          a="No. There is no sign-up, no email, no password. You open the app and set your plan."
        />
        <FaqRow
          q="What happens if I slip?"
          a="Nothing is taken from you. Your lifetime totals, kept money and milestones stay banked. The rescue flow helps you name what happened, make one small plan for that moment, and resume. Comebacks are counted with pride in Stats."
        />
        <FaqRow
          q="Does it work for disposables, pods and pouches?"
          a="Yes. You set your own numbers in puffs or units per day and what each one costs, so disposables, pod systems, refillable tanks and nicotine pouches all fit the same math."
        />
        <FaqRow
          q="Is my data private?"
          a="Yes. Everything is stored on this phone only. No account, no server, no analytics, nothing sent anywhere. The only way data leaves is if you export it yourself from Settings."
        />
        <FaqRow
          q="Is this a medical app?"
          a="No. Mistless is not a medical device and does not diagnose, treat, cure, or prevent any condition. The health timeline is general population-level information from public sources like the WHO and CDC, not medical advice about you. Talk to a healthcare professional for medical advice, and call 1-800-QUIT-NOW (US) if cravings feel unmanageable."
          last
        />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <GhostButton title="Back" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  faqRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  faqQ: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.pineDeep,
    marginBottom: 4,
  },
  faqA: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  privacyBand: {
    backgroundColor: colors.pine,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  privacyText: { fontFamily: fonts.bodySemiBold },
});
