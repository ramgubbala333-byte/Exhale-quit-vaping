import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CravingEvent, JournalEntry, Plan } from '../types';
import { colors, fonts, spacing } from '../theme';
import { Label } from './ui';

type DotState = 'before' | 'free' | 'slip';

interface DayDot {
  key: string;
  initial: string;
  state: DotState;
  isToday: boolean;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * The last seven days as dots. Honest by construction:
 * - filled pine: a tracked day with no slip
 * - amber: a day with a logged slip or a clock restart
 * - hollow: before this quit attempt began (never back-filled)
 * Today always gets an outline ring.
 */
export default function WeekDots({
  plan,
  cravings,
  journal,
  now,
}: {
  plan: Plan;
  cravings: CravingEvent[];
  journal: JournalEntry[];
  now: Date;
}) {
  const dots = useMemo<DayDot[]>(() => {
    const windowStart = startOfDay(
      new Date(
        Math.min(
          new Date(plan.quitDate).getTime(),
          new Date(plan.createdAt).getTime(),
        ),
      ),
    );

    const slipDays = new Set<string>();
    cravings.forEach((c) => {
      if (c.outcome === 'slipped') slipDays.add(dayKey(new Date(c.timestamp)));
    });
    journal.forEach((e) => {
      if (e.kind === 'slip' || e.kind === 'reset') {
        slipDays.add(dayKey(new Date(e.timestamp)));
      }
    });

    const result: DayDot[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(new Date(now));
      day.setDate(day.getDate() - i);
      const key = dayKey(day);
      let state: DotState = 'free';
      if (day.getTime() < windowStart.getTime()) state = 'before';
      else if (slipDays.has(key)) state = 'slip';
      result.push({
        key,
        initial: day.toLocaleDateString('en-US', { weekday: 'narrow' }),
        state,
        isToday: i === 0,
      });
    }
    return result;
  }, [plan, cravings, journal, now]);

  return (
    <View style={styles.wrap}>
      <Label color={colors.pine}>Your week</Label>
      <View style={styles.row}>
        {dots.map((d) => (
          <View key={d.key} style={styles.cell}>
            <View
              style={[
                styles.ring,
                d.isToday && styles.ringToday,
              ]}>
              <View
                style={[
                  styles.dot,
                  d.state === 'free' && { backgroundColor: colors.pine },
                  d.state === 'slip' && { backgroundColor: colors.amberBright },
                  d.state === 'before' && styles.dotHollow,
                ]}
              />
            </View>
            <Text
              style={[
                styles.initial,
                d.isToday && { color: colors.pine, fontFamily: fonts.bodyBold },
              ]}>
              {d.initial}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.legend}>
        Filled: vape-free day · Amber: slip day · Hollow: before this quit
        began
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cell: { alignItems: 'center', width: 36 },
  ring: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ringToday: { borderColor: colors.pine },
  dot: { width: 22, height: 22, borderRadius: 11 },
  dotHollow: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.lineStrong,
  },
  initial: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  legend: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkFaint,
    marginTop: spacing.sm,
  },
});
