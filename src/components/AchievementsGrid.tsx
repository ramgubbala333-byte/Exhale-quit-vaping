import { StyleSheet, Text, View } from 'react-native';

import { ACHIEVEMENTS, type AchievementContext } from '@/lib/achievements';
import {
  elapsedSeconds,
  moneySaved,
  puffsAvoided,
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
  if (!plan) return null;

  const now = new Date();
  const ctx: AchievementContext = {
    elapsedSeconds: elapsedSeconds(plan, now),
    resistedCount: cravings.filter((c) => c.outcome === 'resisted').length,
    moneySaved: moneySaved(plan, now),
    unitsAvoided: unitsAvoided(plan, now),
    puffsAvoided: puffsAvoided(plan, now),
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
                  backgroundColor: earned ? colors.pine : colors.surface,
                  borderColor: earned ? colors.pine : colors.lineStrong,
                },
              ]}>
              <Text
                style={[
                  styles.mark,
                  { color: earned ? colors.amberBright : colors.inkFaint },
                ]}>
                {a.mark}
              </Text>
              <Text
                style={[
                  styles.tileTitle,
                  { color: earned ? colors.bg : colors.ink },
                ]}>
                {a.title}
              </Text>
              <Text
                style={[
                  styles.tileDesc,
                  { color: earned ? colors.pineSoft : colors.inkMuted },
                ]}>
                {a.description}
              </Text>
              <Text
                style={[
                  styles.tileState,
                  { color: earned ? colors.amberBright : colors.inkFaint },
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
    borderWidth: 1,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 19,
  },
  tileDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  tileState: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    marginTop: spacing.sm,
  },
});
