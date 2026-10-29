import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import CravingBarChart, { type DayCravings } from '@/components/CravingBarChart';
import CravingForecast from '@/components/CravingForecast';
import MaxWidth from '@/components/MaxWidth';
import { SavingsGoalJar } from '@/components/SavingsGoalJar';
import TriggerHeatmap from '@/components/TriggerHeatmap';
import {
  Body,
  Display,
  GhostButton,
  Label,
  Screen,
  StatRow,
} from '@/components/ui';
import {
  elapsedSeconds,
  formatCount,
  formatDurationShort,
  formatMoney,
  formatMoneyExact,
  lifetimeFreeSeconds,
  lifetimeMoneySaved,
  lifetimePuffsAvoided,
  lifetimeUnitsAvoided,
  moneySaved,
  puffsAvoided,
} from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme';

export default function Stats() {
  const plan = useStore((s) => s.plan);
  const cravings = useStore((s) => s.cravings);
  const bestStreakSeconds = useStore((s) => s.bestStreakSeconds);
  const relapseCount = useStore((s) => s.relapseCount);
  const savingsGoal = useStore((s) => s.savingsGoal);
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
  const lifetimeMoney = lifetimeMoneySaved(plan, banked);
  const lifetimePuffs = lifetimePuffsAvoided(plan, banked);
  const lifetimeUnits = lifetimeUnitsAvoided(plan, banked);
  const lifetimeFree = lifetimeFreeSeconds(plan, banked);

  return (
    <Screen>
      <MaxWidth>
      <Display size={32}>Your numbers</Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        Patterns, not judgement. Knowing when cravings hit is how you get
        ahead of them.
      </Body>

      {total === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing logged yet, and that is fine</Text>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            These charts wake up the first time a craving hits and you
            ride it out in SOS. That first log starts your record, your
            trigger map, and your danger-window forecast.
          </Body>
          <View style={styles.emptyAction}>
            <GhostButton title="Open SOS" onPress={() => router.push('/sos')} />
          </View>
        </View>
      )}

      <Label style={styles.sectionLabel}>Cravings, last 7 days</Label>
      <View style={styles.chartCard}>
        <CravingBarChart data={week} />
      </View>

      <Label style={styles.sectionLabel}>When cravings hit</Label>
      <View style={styles.chartCard}>
        <TriggerHeatmap cravings={cravings} />
      </View>

      <Label style={styles.sectionLabel}>Your danger window</Label>
      <View style={styles.chartCard}>
        <CravingForecast cravings={cravings} />
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

      <Label style={styles.sectionLabel}>Money and puffs, this run</Label>
      <View style={styles.ledger}>
        <StatRow label="Money kept this run" value={formatMoneyExact(saved)} />
        <StatRow
          label="That is roughly, per month"
          value={formatMoney(saved > 0 ? saved / Math.max(1, currentStreak / 86400) * 30.4 : 0)}
        />
        <StatRow
          label="Puffs avoided this run"
          value={formatCount(puffsAvoided(plan))}
          last
        />
      </View>

      <Label style={styles.sectionLabel}>Lifetime</Label>
      <Body color={colors.inkMuted} style={{ marginBottom: spacing.sm }}>
        Every attempt counts. These totals are banked when a streak ends
        and never go down: a slip restarts the current streak, it does not
        touch anything here.
      </Body>
      <View style={styles.ledger}>
        <StatRow
          label="Total money kept, all attempts"
          value={formatMoneyExact(lifetimeMoney)}
        />
        <StatRow
          label="Total puffs avoided, all attempts"
          value={formatCount(lifetimePuffs)}
        />
        <StatRow
          label="Pods and devices not bought, all attempts"
          value={lifetimeUnits.toFixed(1)}
        />
        <StatRow label="Total cravings resisted" value={formatCount(resisted)} />
        <StatRow
          label="Total time nicotine-free"
          value={`${Math.floor(lifetimeFree / 86400)} days`}
          detail="Adding up every streak you have ever held."
          last
        />
      </View>

      {savingsGoal && (
        <>
          <Label style={styles.sectionLabel}>Your savings goal</Label>
          <SavingsGoalJar goal={savingsGoal} moneyKept={lifetimeMoney} />
        </>
      )}
    </MaxWidth>
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
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
  },
  emptyAction: { alignItems: 'flex-start', marginLeft: -12, marginBottom: -6 },
});
