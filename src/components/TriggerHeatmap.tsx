import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';
import type { CravingEvent } from '../types';

type Daypart = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

const DAYPARTS: Daypart[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

function daypartOf(d: Date): Daypart {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 22) return 'Evening';
  return 'Night';
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * A 7-day x daypart grid of craving counts. Cells shade from the soft
 * pine tint to full pine as the count approaches the week's busiest
 * cell, so trigger times read at a glance.
 */
export default function TriggerHeatmap({ cravings }: { cravings: CravingEvent[] }) {
  const { days, max } = useMemo(() => {
    const now = new Date();
    const rows: { label: string; date: Date; counts: Record<Daypart, number> }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const counts: Record<Daypart, number> = {
        Morning: 0,
        Afternoon: 0,
        Evening: 0,
        Night: 0,
      };
      cravings.forEach((c) => {
        const t = new Date(c.timestamp);
        if (sameDay(t, d)) counts[daypartOf(t)] += 1;
      });
      rows.push({
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        date: d,
        counts,
      });
    }
    const peak = Math.max(
      0,
      ...rows.flatMap((r) => DAYPARTS.map((p) => r.counts[p])),
    );
    return { days: rows, max: peak };
  }, [cravings]);

  if (cravings.length === 0) {
    return (
      <Text style={styles.empty}>
        No cravings logged yet. When they come, this grid will show the
        times of day they cluster in.
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.dayCell} />
        {DAYPARTS.map((p) => (
          <Text key={p} style={styles.headerCell}>
            {p.slice(0, 4)}
          </Text>
        ))}
      </View>
      {days.map((row) => (
        <View key={row.date.toISOString()} style={styles.row}>
          <Text style={styles.dayCell}>{row.label}</Text>
          {DAYPARTS.map((p) => {
            const count = row.counts[p];
            const intensity = max > 0 ? count / max : 0;
            return (
              <View
                key={p}
                style={[
                  styles.cell,
                  {
                    backgroundColor:
                      count === 0
                        ? colors.surfaceMuted
                        : `rgba(117, 118, 170, ${0.2 + intensity * 0.8})`,
                  },
                ]}>
                <Text
                  style={[
                    styles.cellText,
                    { color: intensity > 0.45 ? colors.white : colors.inkMuted },
                  ]}>
                  {count > 0 ? count : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
      <Text style={styles.caption}>
        Columns: morning 5am-12pm, afternoon 12-5pm, evening 5-10pm, night
        10pm-5am. Darker means more cravings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayCell: {
    width: 22,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.inkMuted,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.inkFaint,
    marginHorizontal: 2,
  },
  cell: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontFamily: fonts.bodySemiBold, fontSize: 12 },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkFaint,
    marginTop: spacing.sm,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
