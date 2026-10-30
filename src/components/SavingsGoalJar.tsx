import { StyleSheet, Text, View } from 'react-native';

import { formatMoney, formatMoneyExact, savingsGoalPercent } from '../lib/calc';
import type { SavingsGoal } from '../types';
import { colors, fonts, spacing } from '../theme';
import { CoinJar, coinBoxCaption, coinValueNote } from './CoinJar';
import { Label } from './ui';

/**
 * The savings goal, drawn as the coin jar: money kept fills a glass jar
 * with coins toward the price of the thing the user is saving for.
 * Coins are computed from real saved money (lifetime total, so a slip
 * or a restart never takes a coin back out), and new coins drop in
 * when the jar is next seen (see CoinJar). The jar IS the money-kept
 * display: the exact kept amount sits as a caption under it, while the
 * goal's name, price, and distance left stay as ledger text beside it.
 */
export function SavingsGoalJar({
  goal,
  moneyKept,
}: {
  goal: SavingsGoal;
  moneyKept: number;
}) {
  const percent = savingsGoalPercent(goal, moneyKept) ?? 0;
  return (
    <View style={styles.jarWrap}>
      <View style={styles.jarSlot}>
        <CoinJar
          moneyKept={moneyKept}
          height={150}
          percentLabel={`${Math.floor(percent)}%`}
        />
        <Text style={styles.jarCaption}>
          {formatMoneyExact(Math.min(moneyKept, goal.price))} kept so far
          {coinValueNote(moneyKept) ? ` · ${coinValueNote(moneyKept)}` : ''}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text style={styles.goalPrice}>Goal: {formatMoney(goal.price)}</Text>
        <Text style={styles.goalRemain}>
          {percent >= 100
            ? 'Fully covered by money you did not spend on vaping.'
            : `${formatMoneyExact(goal.price - moneyKept)} to go.`}
        </Text>
      </View>
    </View>
  );
}

/**
 * The same jar with no savings goal attached: the Stats money-kept
 * display for users who never set one. Just the jar, its pile, and the
 * kept total as a caption, so the coins are visible to everyone.
 */
export function LifetimeCoinJar({ moneyKept }: { moneyKept: number }) {
  return (
    <View style={styles.lifetimeWrap}>
      <CoinJar moneyKept={moneyKept} height={150} />
      <Text style={styles.jarCaption}>{coinBoxCaption(moneyKept)}</Text>
    </View>
  );
}

/**
 * Compact version of the same jar, for the Home screen strip. Its jar
 * is passive (animateDrops off): the Home coin collector owns the drop
 * payoff, and two jars on one screen must never both consume the same
 * growth from the shared marker.
 */
export function SavingsGoalStrip({
  goal,
  moneyKept,
}: {
  goal: SavingsGoal;
  moneyKept: number;
}) {
  const percent = savingsGoalPercent(goal, moneyKept) ?? 0;
  return (
    <View style={styles.strip}>
      <View style={styles.stripRow}>
        <CoinJar moneyKept={moneyKept} height={84} animateDrops={false} />
        <View style={styles.stripText}>
          <Label color={colors.pine}>Saving toward: {goal.name}</Label>
          <Text style={styles.stripPercent}>{Math.floor(percent)}% there</Text>
          <Text style={styles.stripDetail}>
            {formatMoneyExact(Math.min(moneyKept, goal.price))} of{' '}
            {formatMoney(goal.price)} covered by money kept
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  jarWrap: { flexDirection: 'row', alignItems: 'center' },
  jarSlot: { marginRight: spacing.lg, alignItems: 'center' },
  lifetimeWrap: { alignItems: 'center' },
  jarCaption: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  goalName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  goalPrice: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 2,
  },
  goalRemain: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  strip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  stripRow: { flexDirection: 'row', alignItems: 'center' },
  stripText: { flex: 1, marginLeft: spacing.md },
  stripPercent: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.pine,
    marginTop: spacing.xs,
  },
  stripDetail: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
});
