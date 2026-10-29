import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import CravingBarChart, { type DayCravings } from '@/components/CravingBarChart';
import { Body, Display, Label, Screen, StatRow } from '@/components/ui';
import {
  elapsedSeconds,
  formatCount,
  formatDurationShort,
  formatMoney,
  formatMoneyExact,
  moneySaved,
  puffsAvoided,
} from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, spacing } from '@/theme';

export default function Stats() {
  const plan = useStore((s) => s.plan);
  const cravings = useStore((s) => s.cravings);
  const bestStreakSeconds = useStore((s) => s.bestStreakSeconds);
  const relapseCount = useStore((s) => s.relapseCount);

  const week = useMemo<DayCravings[]>(() => {
    const days: DayCravings[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const sameDay = (iso: string) => {
        const t = new Date(iso);
        return (
          t.getFullYear() === d.getFullYear() &&
          t.getMonth() === d.getMonth() &&
          t.getDate() === d.getDate()
        );
      };
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        resisted: cravings.filter(
          (c) => c.outcome === 'resisted' && sameDay(c.timestamp),
        ).length,
        slipped: cravings.filter(
          (c) => c.outcome === 'slipped' && sameDay(c.timestamp),
        ).length,
      });
    }
    return days;
  }, [cravings]);

  const peakHour = useMemo<string>(() => {
    if (cravings.length === 0) return 'No cravings logged yet';
    const byHour = new Array(24).fill(0) as number[];
    cravings.forEach((c) => {
      byHour[new Date(c.timestamp).getHours()] += 1;
    });
    const peak = byHour.indexOf(Math.max(...byHour));
    const label = new Date();
    label.setHours(peak, 0, 0, 0);
    return label.toLocaleTimeString('en-US', { hour: 'numeric' });
  }, [cravings]);

  if (!plan) return null;

  const resisted = cravings.filter((c) => c.outcome === 'resisted').length;
  const slipped = cravings.filter((c) => c.outcome === 'slipped').length;
  const total = resisted + slipped;
  const resistRate =
    total > 0 ? `${Math.round((resisted / total) * 100)}%` : '—';
  const currentStreak = elapsedSeconds(plan);
  const longestStreak = Math.max(bestStreakSeconds, currentStreak);
  const saved = moneySaved(plan);

  return (
    <Screen>
      <Display size={32}>Your numbers</Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        Patterns, not judgement. Knowing when cravings hit is how you get
        ahead of them.
      </Body>

      <Label style={styles.sectionLabel}>Cravings, last 7 days</Label>
      <View style={styles.chartCard}>
        <CravingBarChart data={week} />
      </View>

      <Label style={styles.sectionLabel}>Craving record</Label>
      <View style={styles.ledger}>
        <StatRow label="Cravings faced" value={formatCount(total)} />
        <StatRow label="Resisted" value={formatCount(resisted)} />
        <StatRow label="Slipped" value={formatCount(slipped)} />
        <StatRow label="Resist rate" value={resistRate} />
        <StatRow label="Peak craving time" value={peakHour} last />
      </View>

      <Label style={styles.sectionLabel}>Streaks</Label>
      <View style={styles.ledger}>
        <StatRow
          label="Current streak"
          value={formatDurationShort(currentStreak)}
        />
        <StatRow
          label="Longest streak"
          value={formatDurationShort(longestStreak)}
        />
        <StatRow
          label="Restarts"
          value={formatCount(relapseCount)}
          detail="Each restart still counts. Quitting often takes a few runs."
          last
        />
      </View>

      <Label style={styles.sectionLabel}>Money and puffs</Label>
      <View style={styles.ledger}>
        <StatRow label="Total money kept" value={formatMoneyExact(saved)} />
        <StatRow
          label="That is roughly, per month"
          value={formatMoney(saved > 0 ? saved / Math.max(1, currentStreak / 86400) * 30.4 : 0)}
        />
        <StatRow
          label="Puffs avoided"
          value={formatCount(puffsAvoided(plan))}
          last
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  chartCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    padding: spacing.md,
  },
  ledger: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
});
