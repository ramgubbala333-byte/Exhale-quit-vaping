import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import CountUpMoney from '@/components/CountUpMoney';
import MaxWidth from '@/components/MaxWidth';
import MilestoneCelebration from '@/components/MilestoneCelebration';
import QuitTimer from '@/components/QuitTimer';
import RecoveryRings from '@/components/RecoveryRings';
import { SavingsGoalStrip } from '@/components/SavingsGoalJar';
import WeekDots from '@/components/WeekDots';
import {
  Body,
  Display,
  GhostButton,
  Label,
  PrimaryButton,
  Screen,
  StatRow,
} from '@/components/ui';
import {
  daysUntilFlip,
  elapsedDays,
  elapsedSeconds,
  formatCount,
  formatDurationShort,
  isTaperActive,
  lifetimeFreeSeconds,
  lifetimeMoneySaved,
  moneySaved,
  puffsAvoided,
  taperBudgetForWeek,
  taperBudgetToday,
  taperWeekIndex,
  unitsAvoided,
} from '@/lib/calc';
import { dailyLine } from '@/lib/dailyLines';
import { haptics } from '@/lib/haptics';
import { localDateKey, missionForDate } from '@/lib/missions';
import { refreshAllNotifications } from '@/lib/notifications';
import { identityVotes } from '@/lib/votes';
import type { Plan } from '@/types';
import {
  milestoneStates,
  nextMilestone,
  progressToNext,
  type MilestoneState,
} from '@/lib/milestones';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

const homeWindowsill = require('../../assets/illustrations/02-home-windowsill.jpg');

export default function Home() {
  const plan = useStore((s) => s.plan);
  const cravings = useStore((s) => s.cravings);
  const journal = useStore((s) => s.journal);
  const celebratedMilestones = useStore((s) => s.celebratedMilestones);
  const celebrationSeeded = useStore((s) => s.celebrationSeeded);
  const markMilestoneCelebrated = useStore((s) => s.markMilestoneCelebrated);
  const seedCelebrations = useStore((s) => s.seedCelebrations);
  const taperPuffs = useStore((s) => s.taperPuffs);
  const logPuff = useStore((s) => s.logPuff);
  const missionLog = useStore((s) => s.missionLog);
  const setMissionStatus = useStore((s) => s.setMissionStatus);
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
  const [celebration, setCelebration] = useState<MilestoneState | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  // Refresh the derived numbers once a minute (the timer ticks itself).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Replay the kept-money count-up whenever Home regains focus.
  useFocusEffect(
    useCallback(() => {
      setFocusTick((t) => t + 1);
    }, []),
  );

  // Keep the notification schedule fresh (danger window, sweep amount,
  // today's mission) whenever Home mounts. Best-effort and silent.
  useEffect(() => {
    refreshAllNotifications();
  }, []);

  // Milestone celebrations: when a milestone is newly reached while the
  // app is open, show its sheet exactly once (ids persist in the store).
  // The first-ever check seeds the backlog quietly: milestones reached
  // long before this feature existed are marked celebrated in bulk,
  // except the latest one if it landed within the last week.
  useEffect(() => {
    if (!plan || celebration) return;
    const states = milestoneStates(plan, now);
    const reached = states.filter((s) => s.reached);
    if (!celebrationSeeded) {
      if (reached.length === 0) {
        seedCelebrations([]);
        return;
      }
      const latest = reached[reached.length - 1];
      const latestRecent =
        now.getTime() - new Date(latest.at).getTime() <= 7 * 86400000;
      const seedIds = reached
        .map((s) => s.id)
        .filter((id) => !(latestRecent && id === latest.id));
      seedCelebrations(seedIds);
      return;
    }
    const pending = reached.find(
      (s) => !celebratedMilestones.includes(s.id),
    );
    if (pending) {
      // Mark before showing, so the sheet fires at most once even if
      // the app is closed while it is on screen.
      markMilestoneCelebrated(pending.id);
      setCelebration(pending);
    }
  }, [
    plan,
    now,
    celebration,
    celebrationSeeded,
    celebratedMilestones,
    markMilestoneCelebrated,
    seedCelebrations,
  ]);

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

  const todayKey = localDateKey(now);
  const mission = missionForDate(now);
  const missionRecord = missionLog.find((m) => m.date === todayKey);
  const missionsDone = missionLog.filter((m) => m.status === 'done').length;
  const votes = identityVotes({
    resistedCount: resisted,
    missionsDone,
    lifetimeFreeSeconds: lifetimeFreeSeconds(plan, banked, now),
  });

  const onLogPuffWithHaptic = () => {
    haptics.commit();
    logPuff();
  };

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
          onLogPuff={onLogPuffWithHaptic}
        />
      ) : (
        <>
          <Label style={{ marginTop: spacing.lg }}>Nicotine-free for</Label>
          <QuitTimer plan={plan} />

          <Text maxFontSizeMultiplier={1.3} style={styles.dailyLine}>
            {dailyLine(now)}
          </Text>

          <View style={styles.savedBlock}>
            <Label color={colors.amber}>Money kept so far</Label>
            <CountUpMoney value={saved} focusTick={focusTick} />
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

          <View style={styles.votesRow}>
            <View style={styles.votesPill}>
              <Text style={styles.votesPillText}>
                {formatCount(votes.total)} vote{votes.total === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={styles.votesCaption}>
              for the person you are becoming
            </Text>
          </View>

          <WeekDots plan={plan} cravings={cravings} journal={journal} now={now} />

          <RecoveryRings plan={plan} now={now} />

          <View style={styles.homeArtFrame}>
            <Image
              source={homeWindowsill}
              style={styles.artFill}
              resizeMode="cover"
              accessibilityLabel="Watercolor illustration of a windowsill with a small plant and a jar of coins in morning light"
            />
          </View>
        </>
      )}

      {savingsGoal && (
        <Pressable onPress={() => router.push('/(tabs)/stats')}>
          <SavingsGoalStrip goal={savingsGoal} moneyKept={lifetimeSaved} />
        </Pressable>
      )}

      <View style={styles.missionCard}>
        <Label color={colors.amber}>Today's mission</Label>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <Text style={styles.missionDetail}>{mission.detail}</Text>
        {missionRecord?.status === 'done' ? (
          <Text style={styles.missionState}>
            Done. That is another vote cast, and the day is only partway
            through.
          </Text>
        ) : missionRecord?.status === 'skipped' ? (
          <Text style={styles.missionState}>
            Skipped, no penalty attached. Tomorrow brings a new one.
          </Text>
        ) : (
          <View style={styles.missionButtons}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <PrimaryButton
                title="Done"
                haptic="commit"
                onPress={() =>
                  setMissionStatus(todayKey, mission.id, 'done')
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <GhostButton
                title="Skip today"
                onPress={() =>
                  setMissionStatus(todayKey, mission.id, 'skipped')
                }
              />
            </View>
          </View>
        )}
      </View>

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

      <MilestoneCelebration
        milestone={celebration}
        daysFree={Math.floor(elapsedDays(plan, now))}
        moneyKept={moneySaved(plan, now)}
        onDismiss={() => setCelebration(null)}
      />
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
  homeArtFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginTop: spacing.xl,
  },
  artFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
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
  dailyLine: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 24,
    color: colors.pine,
    marginTop: spacing.lg,
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
  votesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  votesPill: {
    backgroundColor: colors.pine,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: spacing.sm,
  },
  votesPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.amberBright,
  },
  votesCaption: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    flex: 1,
  },
  missionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  missionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.pineDeep,
    marginTop: spacing.xs,
  },
  missionDetail: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: 4,
  },
  missionState: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.pine,
    marginTop: spacing.md,
  },
  missionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
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
