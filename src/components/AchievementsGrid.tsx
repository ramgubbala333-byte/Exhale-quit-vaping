import { StyleSheet, Text, View } from 'react-native';

import { ACHIEVEMENTS, type AchievementContext } from '@/lib/achievements';
import {
  elapsedSeconds,
  lifetimeMoneySaved,
  lifetimePuffsAvoided,
  moneySaved,
  puffsAvoided,
  savingsGoalPercent,
  unitsAvoided,
} from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';
import { Display, Label } from './ui';

/**
 * Badge grid. Earned state is computed live from the same numbers the
 * rest of the app shows, so there is no separate "unlocked" storage that
 * could drift out of sync.
 */
export default function AchievementsGrid() {
  const plan = useStore((s) => s.plan);
  const cravings = useStore((s) => s.cravings);
  const bankedMoney = useStore((s) => s.lifetimeMoneyBanked);
  const bankedPuffs = useStore((s) => s.lifetimePuffsBanked);
  const bankedUnits = useStore((s) => s.lifetimeUnitsBanked);
  const bankedFreeSeconds = useStore((s) => s.lifetimeFreeSecondsBanked);
  const banked = {
    money: bankedMoney,
    puffs: bankedPuffs,
    units: bankedUnits,
    freeSeconds: bankedFreeSeconds,
  };
  const savingsGoal = useStore((s) => s.savingsGoal);
  if (!plan) return null;

  const now = new Date();
  const lifetimeMoney = lifetimeMoneySaved(plan, banked, now);
  const ctx: AchievementContext = {
    elapsedSeconds: elapsedSeconds(plan, now),
    resistedCount: cravings.filter((c) => c.outcome === 'resisted').length,
    moneySaved: moneySaved(plan, now),
    unitsAvoided: unitsAvoided(plan, now),
    puffsAvoided: puffsAvoided(plan, now),
    lifetimePuffsAvoided: lifetimePuffsAvoided(plan, banked, now),
    savingsGoalPercent: savingsGoalPercent(savingsGoal, lifetimeMoney),
    taperCompleted: plan.taperCompleted === true,
  };

  const earnedCount = ACHIEVEMENTS.filter((a) => a.earned(ctx)).length;

  return (
    <View style={styles.wrap}>
      <Display size={26}>Achievements</Display>
      <Label style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
        {earnedCount} of {ACHIEVEMENTS.length} earned
      </Label>
      <View style={styles.grid}>
        {ACHIEVEMENTS.map((a) => {
          const earned = a.earned(ctx);
          return (
            <View
              key={a.id}
              style={[
                styles.tile,
                {
                  backgroundColor: earned ? colors.pineSoft : colors.surface,
                },
              ]}>
              <Text
                style={[
                  styles.mark,
                  { color: earned ? colors.amberBright : colors.inkFaint },
                ]}>
                {a.mark}
              </Text>
              <Text style={styles.tileTitle}>{a.title}</Text>
              <Text style={styles.tileDesc}>{a.description}</Text>
              <Text
                style={[
                  styles.tileState,
                  { color: earned ? colors.check : colors.inkFaint },
                ]}>
                {earned ? 'EARNED' : 'LOCKED'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  mark: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    marginBottom: spacing.sm,
  },
  tileTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.ink,
  },
  tileDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    color: colors.inkMuted,
  },
  tileState: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    marginTop: spacing.sm,
  },
});
