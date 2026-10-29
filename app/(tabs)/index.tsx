import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import MaxWidth from '@/components/MaxWidth';
import QuitTimer from '@/components/QuitTimer';
import { SavingsGoalStrip } from '@/components/SavingsGoalJar';
import {
  Body,
  Display,
  Label,
  PrimaryButton,
  Screen,
  StatRow,
} from '@/components/ui';
import {
  daysUntilFlip,
  elapsedSeconds,
  formatCount,
  formatDurationShort,
  formatMoneyExact,
  isTaperActive,
  lifetimeMoneySaved,
  moneySaved,
  puffsAvoided,
  taperBudgetForWeek,
  taperBudgetToday,
  taperWeekIndex,
  unitsAvoided,
} from '@/lib/calc';
import type { Plan } from '@/types';
import { nextMilestone, progressToNext } from '@/lib/milestones';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

export default function Home() {
  const plan = useStore((s) => s.plan);
  const cravings = useStore((s) => s.cravings);
  const taperPuffs = useStore((s) => s.taperPuffs);
  const logPuff = useStore((s) => s.logPuff);
  const advanceTaperIfReady = useStore((s) => s.advanceTaperIfReady);
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
  const [now, setNow] = useState(() => new Date());

  // Refresh the derived numbers once a minute (the timer ticks itself).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // If a taper's quit day (or zero-budget day) has arrived, flip it into a
  // full quit before rendering the standard dashboard.
  useEffect(() => {
    advanceTaperIfReady();
  }, [advanceTaperIfReady]);

  if (!plan) return null;

  const resisted = cravings.filter((c) => c.outcome === 'resisted').length;
  const saved = moneySaved(plan, now);
  const lifetimeSaved = lifetimeMoneySaved(plan, banked, now);
  const next = nextMilestone(plan, now);
  const progress = progressToNext(plan, now);
  const streakSeconds = elapsedSeconds(plan, now);
  const taperActive = isTaperActive(plan, now);

  return (
    <Screen>
      <MaxWidth>
      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>Mistless</Text>
        <Text style={styles.dateText}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {taperActive ? (
        <TaperPanel
          plan={plan}
          now={now}
          loggedToday={
            taperPuffs.filter((p) => {
              const t = new Date(p.timestamp);
              return (
                t.getFullYear() === now.getFullYear() &&
                t.getMonth() === now.getMonth() &&
                t.getDate() === now.getDate()
              );
            }).length
          }
          onLogPuff={logPuff}
        />
      ) : (
        <>
          <Label style={{ marginTop: spacing.lg }}>Nicotine-free for</Label>
          <QuitTimer plan={plan} />

          <View style={styles.savedBlock}>
            <Label color={colors.amber}>Money kept so far</Label>
            <Display size={44} color={colors.pineDeep}>
              {formatMoneyExact(saved)}
            </Display>
          </View>

          <View style={styles.ledger}>
            <StatRow
              label="Puffs avoided"
              value={formatCount(puffsAvoided(plan, now))}
            />
            <StatRow
              label="Pods and devices not bought"
              value={unitsAvoided(plan, now).toFixed(1)}
            />
            <StatRow
              label="Cravings resisted"
              value={formatCount(resisted)}
            />
            <StatRow
              label="Current streak"
              value={formatDurationShort(streakSeconds)}
              last
            />
          </View>
        </>
      )}

      {savingsGoal && (
        <Pressable onPress={() => router.push('/(tabs)/stats')}>
          <SavingsGoalStrip goal={savingsGoal} moneyKept={lifetimeSaved} />
        </Pressable>
      )}

      {!taperActive && next && (
        <Pressable
          onPress={() => router.push('/(tabs)/milestones')}
          style={styles.milestoneTeaser}>
          <View style={{ flex: 1 }}>
            <Label color={colors.pine}>Next milestone</Label>
            <Text style={styles.milestoneTitle}>
              {next.label}: {next.title}
            </Text>
            <Text style={styles.milestoneRemaining}>
              in {formatDurationShort(next.remainingSeconds)}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { height: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
        </Pressable>
      )}

      <Pressable
        onPress={() => router.push('/sos')}
        style={({ pressed }) => [
          styles.sosButton,
          { opacity: pressed ? 0.88 : 1 },
        ]}>
        <Text style={styles.sosTitle}>I have a craving</Text>
        <Text style={styles.sosSub}>
          Ride it out with a 3-minute breathing session
        </Text>
      </Pressable>

      <Body
        size={13}
        color={colors.inkMuted}
        style={{ marginTop: spacing.lg, textAlign: 'center' }}>
        Your reasons: {plan.reasons.join(' · ')}
      </Body>
    </MaxWidth>
    </Screen>
  );
}

/**
 * Cut-down mode home panel: today's shrinking puff budget, a one-tap
 * puff logger, and the countdown to quit day. When the budget reaches
 * zero or the quit day arrives, the store flips the plan to a full quit
 * and this panel is replaced by the standard timer dashboard.
 */
function TaperPanel({
  plan,
  now,
  loggedToday,
  onLogPuff,
}: {
  plan: Plan;
  now: Date;
  loggedToday: number;
  onLogPuff: () => void;
}) {
  const budget = taperBudgetToday(plan, now);
  const week = taperWeekIndex(plan, now);
  const nextWeekBudget = taperBudgetForWeek(plan, week + 1);
  const remaining = budget - loggedToday;
  const daysLeft = daysUntilFlip(plan, now);

  return (
    <View>
      <Label style={{ marginTop: spacing.lg }}>
        Cutting down · Week {week + 1}
      </Label>
      <Display size={40} color={colors.pineDeep} style={{ marginTop: spacing.xs }}>
        {remaining > 0
          ? `${remaining} of ${budget} puffs left today`
          : "Today's budget is used up"}
      </Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        {remaining > 0
          ? 'Log each puff with one tap. Staying under the line is the whole game this week.'
          : 'That is the line held for today. Anything from here is over budget, and tomorrow the line drops again.'}
      </Body>

      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton title="Log a puff" onPress={onLogPuff} />
      </View>

      <View style={styles.ledger}>
        <StatRow label="Logged today" value={formatCount(loggedToday)} />
        <StatRow
          label="Next week's budget"
          value={`${nextWeekBudget} / day`}
        />
        <StatRow
          label="Quit day"
          value={daysLeft === 0 ? 'Today' : `In ${daysLeft} days`}
          last
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  wordmark: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.pineDeep,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  savedBlock: {
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    paddingTop: spacing.lg,
  },
  ledger: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  milestoneTeaser: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  milestoneTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 4,
  },
  milestoneRemaining: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  progressTrack: {
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginLeft: spacing.md,
  },
  progressFill: {
    width: '100%',
    backgroundColor: colors.pine,
    borderRadius: 3,
  },
  sosButton: {
    backgroundColor: colors.amberBright,
    borderRadius: radii.md,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  sosTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.pineDeep,
  },
  sosSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.pineDeep,
    marginTop: 2,
  },
});
