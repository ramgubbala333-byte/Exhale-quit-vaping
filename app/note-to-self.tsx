import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import MaxWidth from '@/components/MaxWidth';
import { Body, Display, GhostButton, Label, Screen } from '@/components/ui';
import { formatDate, formatMoneyExact, isTaperActive } from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { Plan } from '@/types';

/**
 * Note to self: the day-one declaration, composed entirely from the
 * user's own stored plan (name, device, pace, quit moment, price,
 * taper state) in plain sentences, ending with the "Why I'm done"
 * reasons card. Nothing here is hardcoded; a plan without a name
 * simply starts at "I do not vape." Routed from Home and Settings.
 */

const UNIT_NOUN: Record<Plan['deviceType'], string> = {
  disposable: 'disposable',
  pod: 'pod',
  refillable: 'bottle of liquid',
};

/** "October 29, 2026, 8:24 pm" — long date, lowercase time, as written. */
function longDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase();
  return `${date}, ${time}`;
}

/** "every 5 days" / "every 3.5 days" / "every day" from units per week. */
function pacePhrase(plan: Plan): string {
  const days = 7 / plan.unitsPerWeek;
  if (days < 1.5) return 'every day';
  const rounded = Math.round(days * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `every ${text} days`;
}

function declarationLines(plan: Plan): string[] {
  const noun = UNIT_NOUN[plan.deviceType];
  const lines: string[] = [];
  if (plan.userName) lines.push(`Hi, my name is ${plan.userName}.`);

  if (isTaperActive(plan)) {
    lines.push('I am cutting down on vaping, a little less every week.');
    lines.push(
      `I started on ${formatDate(plan.taper!.startDate)}. My quit day is ${formatDate(plan.taper!.targetQuitDate)}.`,
    );
  } else {
    lines.push('I do not vape.');
    lines.push(`I stopped that on ${longDateTime(plan.quitDate)}.`);
  }

  lines.push(
    `I used to go through an entire ${noun} ${pacePhrase(plan)}.`,
  );
  lines.push(
    `I was paying ${formatMoneyExact(plan.costPerUnit)} for 1 ${noun}.`,
  );
  return lines;
}

export default function NoteToSelf() {
  const plan = useStore((s) => s.plan);
  if (!plan) return null;

  const lines = declarationLines(plan);

  return (
    <Screen>
      <MaxWidth>
        <Label color={colors.amber}>Note to self 💌</Label>
        <Display size={32} style={{ marginTop: spacing.xs }}>
          Read this on the hard days
        </Display>
        <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
          You wrote this on day one, with a clear head. It is still true.
        </Body>

        <View style={styles.declaration}>
          {lines.map((line, i) => (
            <Text key={i} style={styles.declarationLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.signature}>
            — {plan.userName ?? 'You, on day one'}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          style={({ pressed }) => [
            styles.whyCard,
            { opacity: pressed ? 0.88 : 1 },
          ]}>
          <Label color={colors.amberBright}>Why I'm done ❤️</Label>
          {plan.reasons.length > 0 ? (
            plan.reasons.map((r) => (
              <Text key={r} style={styles.whyReason}>
                {r}
              </Text>
            ))
          ) : (
            <Text style={styles.whyReason}>
              No reasons written yet. Tap to add the ones that matter.
            </Text>
          )}
          <Text style={styles.whyCaption}>Tap to edit your reasons</Text>
        </Pressable>

        <View style={{ marginTop: spacing.xl }}>
          <GhostButton title="Back" onPress={() => router.back()} />
        </View>
      </MaxWidth>
    </Screen>
  );
}

const styles = StyleSheet.create({
  declaration: {
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    paddingTop: spacing.lg,
  },
  declarationLine: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 35,
    color: colors.pineDeep,
    marginBottom: spacing.md,
  },
  signature: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  whyCard: {
    backgroundColor: colors.pine,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  whyReason: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 27,
    color: colors.bg,
    marginTop: spacing.sm,
  },
  whyCaption: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.amberBright,
    marginTop: spacing.lg,
  },
});
