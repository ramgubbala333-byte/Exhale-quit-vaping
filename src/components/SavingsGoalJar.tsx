import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { formatMoney, formatMoneyExact, savingsGoalPercent } from '../lib/calc';
import type { SavingsGoal } from '../types';
import { colors, fonts, radii, spacing } from '../theme';
import { Label } from './ui';

/** Animates a 0..1 value toward the goal percent whenever it changes. */
function useAnimatedPercent(percent: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, Math.max(0, percent / 100)),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [anim, percent]);
  return anim;
}

/**
 * The savings goal jar: money kept fills a jar toward the price of the
 * thing the user is saving for. Fill is computed from real saved money
 * (lifetime total, so restarts never drain the jar), and the amber
 * level animates to the true percentage whenever it changes.
 */
export function SavingsGoalJar({
  goal,
  moneyKept,
}: {
  goal: SavingsGoal;
  moneyKept: number;
}) {
  const percent = savingsGoalPercent(goal, moneyKept) ?? 0;
  const anim = useAnimatedPercent(percent);
  const fillHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.jarWrap}>
      <View style={styles.jar}>
        <Animated.View style={[styles.jarFill, { height: fillHeight }]} />
        <View style={styles.jarPercentWrap} pointerEvents="none">
          <Text maxFontSizeMultiplier={1.2} style={styles.jarPercent}>
            {Math.floor(percent)}%
          </Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text style={styles.goalPrice}>Goal: {formatMoney(goal.price)}</Text>
        <Text style={styles.goalSaved}>
          {formatMoneyExact(Math.min(moneyKept, goal.price))} kept so far
        </Text>
        <Text style={styles.goalRemain}>
          {percent >= 100
            ? 'Fully covered by money you did not spend on vaping.'
            : `${formatMoneyExact(goal.price - moneyKept)} to go.`}
        </Text>
      </View>
    </View>
  );
}

/** Compact one-line version of the same progress, for the Home screen. */
export function SavingsGoalStrip({
  goal,
  moneyKept,
}: {
  goal: SavingsGoal;
  moneyKept: number;
}) {
  const percent = savingsGoalPercent(goal, moneyKept) ?? 0;
  const anim = useAnimatedPercent(percent);
  const fillWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.strip}>
      <View style={styles.stripHead}>
        <Label color={colors.pine}>Saving toward: {goal.name}</Label>
        <Text style={styles.stripPercent}>{Math.floor(percent)}% there</Text>
      </View>
      <View style={styles.stripTrack}>
        <Animated.View style={[styles.stripFill, { width: fillWidth }]} />
      </View>
      <Text style={styles.stripDetail}>
        {formatMoneyExact(Math.min(moneyKept, goal.price))} of{' '}
        {formatMoney(goal.price)} covered by money kept
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  jarWrap: { flexDirection: 'row', alignItems: 'center' },
  jar: {
    width: 84,
    height: 120,
    borderWidth: 2,
    borderColor: colors.pine,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginRight: spacing.lg,
  },
  jarFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.amberBright,
    opacity: 0.8,
  },
  jarPercentWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarPercent: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.pineDeep,
    textAlign: 'center',
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
  goalSaved: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.pine,
    marginTop: spacing.sm,
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
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  stripHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stripPercent: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.pine,
  },
  stripTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  stripFill: { height: '100%', backgroundColor: colors.amberBright },
  stripDetail: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
