import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatMoney,
  formatMoneyExact,
  savingsGoalPercent,
} from '../lib/calc';
import type { SavingsGoal } from '../types';
import { colors, fonts, radii, spacing } from '../theme';
import { CoinJar, coinBoxCaption } from './CoinJar';
import { Label } from './ui';

/**
 * The savings card: the Home screen's money-kept display. Instead of
 * a bare dollar figure, lifetime money kept shows up as coins piling
 * into a jar the user can watch fill (see CoinJar for the drop
 * payoff). It renders for every user, savings goal or not, and the
 * exact total survives as the caption line under the jar. When a
 * savings goal exists, a quiet progress line under the caption folds
 * in what the old Home strip used to say. This card is the Home jar
 * that performs coin drops on focus; any second jar on the screen
 * stays passive. Tapping the card opens Stats.
 */
export function CoinCollector({
  moneyKept,
  goal,
  onPress,
}: {
  moneyKept: number;
  goal?: SavingsGoal | null;
  onPress?: () => void;
}) {
  const percent = goal ? (savingsGoalPercent(goal, moneyKept) ?? 0) : 0;
  const content = (
    <>
      <Label color={colors.pine}>Coin collector</Label>
      <View style={styles.jarSlot}>
        <CoinJar moneyKept={moneyKept} height={170} />
      </View>
      <Text style={styles.caption}>{coinBoxCaption(moneyKept)}</Text>
      {goal && (
        <View style={styles.goalBlock}>
          <View style={styles.goalRow}>
            <Text style={styles.goalName}>Toward {goal.name}</Text>
            <Text style={styles.goalAmount}>
              {formatMoneyExact(Math.min(moneyKept, goal.price))} of{' '}
              {formatMoney(goal.price)}
            </Text>
          </View>
          <View style={styles.goalTrack}>
            <View
              style={[
                styles.goalFill,
                { width: `${Math.min(100, Math.max(0, percent))}%` },
              ]}
            />
          </View>
          <Text style={styles.goalNote}>
            {percent >= 100
              ? 'Fully covered by money you did not spend on vaping.'
              : `${formatMoneyExact(Math.max(0, goal.price - moneyKept))} to go, arriving one resisted craving at a time.`}
          </Text>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed ? 0.92 : 1 },
        ]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  jarSlot: { alignItems: 'center', marginTop: spacing.md },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.pine,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  goalBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  goalName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  goalAmount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.pine,
  },
  goalTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  goalFill: {
    height: '100%',
    backgroundColor: colors.pine,
    borderRadius: 3,
  },
  goalNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
