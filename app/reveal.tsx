import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import MaxWidth from '@/components/MaxWidth';
import { Body, Display, Label, PrimaryButton, Screen } from '@/components/ui';
import { dailyCost, formatCount, formatMoney } from '@/lib/calc';
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
  const first = nextMilestone(plan, new Date());
  const isTaper = plan.approach === 'taper' && !plan.taperCompleted;

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
          What your numbers become
        </Label>
        <View style={styles.ledger}>
          <RevealLine label="Kept in 1 week" value={formatMoney(perDay * 7)} />
          <RevealLine label="Kept in 1 month" value={formatMoney(perDay * (365 / 12))} />
          <RevealLine label="Kept in 6 months" value={formatMoney(perDay * (365 / 2))} />
          <RevealLine label="Kept in 1 year" value={formatMoney(perDay * 365)} />
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
            title={
              params.from === 'settings'
                ? 'Back to my app'
                : isTaper
                  ? 'Start my cut-down'
                  : 'Start day one'
            }
            onPress={() =>
              params.from === 'settings'
                ? router.back()
                : router.replace('/(tabs)')
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
    width: '100%',
    aspectRatio: 4 / 3,
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
