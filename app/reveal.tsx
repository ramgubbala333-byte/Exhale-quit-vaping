import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import MaxWidth from '@/components/MaxWidth';
import { Body, Display, Label, PrimaryButton, Screen } from '@/components/ui';
import { dailyCost, formatCount, formatMoney, projections } from '@/lib/calc';
import { nextMilestone } from '@/lib/milestones';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

const planDesk = require('../assets/illustrations/02-plan-desk.jpg');

/**
 * The endowed-progress plan reveal. Shown right after onboarding and
 * reachable again from Settings ("My plan reveal"). The plan does not
 * start at zero: the user has already done real work to get here, and
 * the screen says so, then shows what their own numbers turn into.
 * Projections are arithmetic on the user's own inputs, nothing more.
 */

const STAMPS = [
  'You showed up',
  'You set your numbers',
  'You chose your approach',
];

export default function Reveal() {
  const plan = useStore((s) => s.plan);
  const params = useLocalSearchParams<{ from?: string }>();

  if (!plan) return null;

  const perDay = dailyCost(plan);
  const proj = projections(plan);
  const first = nextMilestone(plan, new Date());
  const isTaper = plan.approach === 'taper' && !plan.taperCompleted;
  const fromSettings = params.from === 'settings';
  // The finish is a declaration, not a button label: the sentence the
  // user said out loud on day one. Taper users start their cut-down;
  // everyone else signs the quit with their own name.
  const finishTitle = fromSettings
    ? 'Back to my app'
    : isTaper
      ? 'Start my cut-down'
      : plan.userName
        ? `${plan.userName} doesn't vape.`
        : "I don't vape.";

  return (
    <Screen>
      <MaxWidth>
        <View style={styles.headerArtFrame}>
          <Image
            source={planDesk}
            style={styles.artFill}
            resizeMode="cover"
            accessibilityLabel="Watercolor illustration of a desk at dusk with a lamp, an open notebook, and a phone face-down"
          />
        </View>
        <Label color={colors.amber}>Your plan</Label>
        <Display size={34} style={{ marginTop: spacing.xs }}>
          Your plan is already moving
        </Display>
        <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
          You are not starting from zero. Three steps are already stamped,
          because you just did them:
        </Body>

        <View style={styles.stamps}>
          {STAMPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.stampRow,
                i === STAMPS.length - 1 && { borderBottomWidth: 0 },
              ]}>
              <Text style={styles.stampIndex}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stampText}>{s}</Text>
                <Text style={styles.stampTitle}>Done, just now</Text>
              </View>
              <Text style={styles.stampCheck}>✓</Text>
            </View>
          ))}
        </View>

        <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          What quitting pays back
        </Label>
        <Text maxFontSizeMultiplier={1.15} style={styles.bigNumber}>
          {formatMoney(proj.moneyPerMonth)}
        </Text>
        <Text style={styles.bigCaption}>in a month 🤯 … and</Text>
        <Text maxFontSizeMultiplier={1.15} style={styles.bigNumber}>
          {formatMoney(proj.moneyPerYear)}
        </Text>
        <Text style={styles.bigCaption}>in a year 🤑</Text>

        <View style={[styles.ledger, { marginTop: spacing.xl }]}>
          <RevealLine label="Kept in 1 week" value={formatMoney(perDay * 7)} />
          <RevealLine
            label="Kept in 6 months"
            value={formatMoney(perDay * (365 / 2))}
          />
          <RevealLine
            label="Puffs avoided in 1 year"
            value={formatCount(plan.puffsPerDay * 365)}
            last
          />
        </View>

        {first && (
          <Body color={colors.inkMuted} style={{ marginTop: spacing.lg }}>
            Your first milestone is{' '}
            <Text style={styles.emphasis}>
              {first.label}: {first.title}
            </Text>
            , landing {first.label} after your quit moment. It is close on
            purpose.
          </Body>
        )}

        <Body color={colors.inkMuted} style={{ marginTop: spacing.md }}>
          Your reasons: {plan.reasons.join(' · ')}
        </Body>

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton
            title={finishTitle}
            haptic={fromSettings ? 'tap' : 'success'}
            onPress={() =>
              fromSettings ? router.back() : router.replace('/(tabs)')
            }
          />
        </View>
      </MaxWidth>
    </Screen>
  );
}

function RevealLine({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.line, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerArtFrame: {
    width: '52%',
    alignSelf: 'center',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  artFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  stamps: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  stampIndex: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.amber,
    width: 56,
  },
  stampCheck: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.pine,
    marginLeft: spacing.md,
  },
  stampTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.inkMuted,
    marginTop: 2,
  },
  stampText: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.pineDeep,
  },
  bigNumber: {
    fontFamily: fonts.displayBold,
    fontSize: 52,
    lineHeight: 58,
    color: colors.pine,
    marginTop: spacing.sm,
  },
  bigCaption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.inkMuted,
    marginTop: 2,
  },
  ledger: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  lineLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  lineValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.pine,
  },
  emphasis: {
    fontFamily: fonts.bodySemiBold,
    color: colors.pineDeep,
  },
});
