import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ArtPlate from '@/components/ArtPlate';
import { CoinCollector } from '@/components/CoinCollector';
import MaxWidth from '@/components/MaxWidth';
import MilestoneCelebration from '@/components/MilestoneCelebration';
import QuitTimer from '@/components/QuitTimer';
import RecoveryRings from '@/components/RecoveryRings';
import StateBlob from '@/components/StateBlob';
import WeekDots from '@/components/WeekDots';
import {
  Body,
  CheckBadge,
  CircleIconButton,
  Display,
  GhostButton,
  Label,
  PrimaryButton,
  Screen,
  StatCard,
  StatRow,
} from '@/components/ui';
import {
  ACHIEVEMENTS,
  type AchievementContext,
} from '@/lib/achievements';
import {
  SECONDS_PER_DAY,
  daysUntilFlip,
  elapsedDays,
  elapsedSeconds,
  formatCount,
  formatDurationShort,
  isTaperActive,
  lifetimeFreeSeconds,
  lifetimeMoneySaved,
  lifetimePuffsAvoided,
  moneySaved,
  puffsAvoided,
  savingsGoalPercent,
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
import { colors, fonts, gradients, radii, spacing } from '@/theme';

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

  // Refresh the derived numbers once a minute (the timer ticks itself).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

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
  const lifetimeSaved = lifetimeMoneySaved(plan, banked, now);
  const next = nextMilestone(plan, now);
  const progress = progressToNext(plan, now);
  const streakSeconds = elapsedSeconds(plan, now);
  const taperActive = isTaperActive(plan, now);

  // The hero label names the moment the way the timer counts it:
  // still inside the first day it is the first hours, one full day
  // banked is the first day, after that plain day numbers.
  const streakDays = Math.floor(streakSeconds / SECONDS_PER_DAY);
  const momentLabel =
    streakDays === 1
      ? 'Your first day'
      : streakDays > 1
        ? `Day ${streakDays}`
        : 'Your first hours';

  // Badge strip math: the same live context the Achievements grid
  // uses, so the counts can never drift apart.
  const achievementCtx: AchievementContext = {
    elapsedSeconds: streakSeconds,
    resistedCount: resisted,
    moneySaved: moneySaved(plan, now),
    unitsAvoided: unitsAvoided(plan, now),
    puffsAvoided: puffsAvoided(plan, now),
    lifetimePuffsAvoided: lifetimePuffsAvoided(plan, banked, now),
    savingsGoalPercent: savingsGoalPercent(savingsGoal, lifetimeSaved),
    taperCompleted: plan.taperCompleted === true,
  };
  const earnedBadges = ACHIEVEMENTS.filter((a) => a.earned(achievementCtx));
  const nextBadge = ACHIEVEMENTS.find((a) => !a.earned(achievementCtx));

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
    <Screen padBottom={120}>
      <MaxWidth>
      {/* PulseBuddy header: small round plate + name top-left, white
          circular outline-icon buttons top-right. */}
      <View style={styles.headerRow}>
        <View style={styles.headerPlate}>
          <ArtPlate
            source={homeWindowsill}
            aspect={0.5}
            widthPct={100}
            label="Watercolor illustration of a windowsill with a small plant and a jar of coins in morning light"
            style={{ marginVertical: 0 }}
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.headerName}>
            {plan.userName ? `Hi, ${plan.userName}` : 'Mistless'}
          </Text>
          <Text style={styles.headerDate}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <CircleIconButton
          icon="flag-outline"
          label="Milestones"
          onPress={() => router.push('/(tabs)/milestones')}
        />
        <CircleIconButton
          icon="settings-outline"
          label="Settings"
          onPress={() => router.push('/(tabs)/settings')}
        />
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
          {/* Hero: the timer as the huge number, the state blob as the
              status device, the daily line as the status line. */}
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Label color={colors.amber}>{momentLabel}</Label>
                <QuitTimer plan={plan} />
              </View>
              <StateBlob tone="calm" size={104} />
            </View>
            <Text maxFontSizeMultiplier={1.3} style={styles.dailyLine}>
              {dailyLine(now)}
            </Text>
          </View>

          {/* Three small stat cards under the hero. */}
          <View style={styles.statTrio}>
            <StatCard
              label="Puffs avoided"
              value={formatCount(puffsAvoided(plan, now))}
              sub={`${unitsAvoided(plan, now).toFixed(1)} devices not bought`}
            />
            <StatCard
              label="Streak"
              value={formatDurationShort(streakSeconds)}
              sub={`${formatCount(resisted)} resisted`}
              style={{ marginHorizontal: spacing.sm }}
            />
            <StatCard
              label="Votes"
              value={formatCount(votes.total)}
              sub="for who you're becoming"
            />
          </View>
        </>
      )}

      {/* The savings card: coins, kept total, and the goal line when
          one is set. Tapping it opens Stats. */}
      <CoinCollector
        moneyKept={lifetimeSaved}
        goal={savingsGoal}
        onPress={() => router.push('/(tabs)/stats')}
      />

      {/* Craving help sits directly under the savings card, never
          below a screenful of cards: one wide warm pill CTA. */}
      <Pressable
        onPress={() => router.push('/sos')}
        style={({ pressed }) => [
          styles.sosWrap,
          { opacity: pressed ? 0.88 : 1 },
        ]}>
        <LinearGradient
          colors={[...gradients.sos]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sosButton}>
          <Text style={styles.sosTitle}>I have a craving</Text>
          <Text style={styles.sosSub}>
            Ride it out with a 3-minute breathing session
          </Text>
        </LinearGradient>
      </Pressable>

      {!taperActive && (
        <>
          <Pressable
            onPress={() => router.push('/(tabs)/milestones')}
            style={({ pressed }) => [
              styles.badgeCard,
              { opacity: pressed ? 0.92 : 1 },
            ]}>
            <View style={styles.badgeMarks}>
              {earnedBadges.slice(0, 3).map((a, i) => (
                <View
                  key={a.id}
                  style={[styles.badgeMark, i > 0 && styles.badgeMarkOverlap]}>
                  <Text style={styles.badgeMarkText}>{a.mark}</Text>
                </View>
              ))}
              {earnedBadges.length === 0 && (
                <View style={[styles.badgeMark, styles.badgeMarkEmpty]}>
                  <Text
                    style={[styles.badgeMarkText, { color: colors.inkFaint }]}>
                    0
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Label>Badges</Label>
              <Text style={styles.badgeCount}>
                {earnedBadges.length} of {ACHIEVEMENTS.length} earned
              </Text>
              <Text style={styles.badgeNext}>
                {nextBadge
                  ? `Next: ${nextBadge.title}`
                  : 'Every badge earned. Remarkable.'}
              </Text>
            </View>
            {!nextBadge && <CheckBadge />}
            <Text style={styles.cardChevron}>›</Text>
          </Pressable>

          <View style={styles.card}>
            <WeekDots
              plan={plan}
              cravings={cravings}
              journal={journal}
              now={now}
              style={{ marginTop: 0 }}
            />
            <RecoveryRings
              plan={plan}
              now={now}
              style={{ marginTop: spacing.lg }}
            />
          </View>

          {next && (
            <Pressable
              onPress={() => router.push('/(tabs)/milestones')}
              style={({ pressed }) => [
                styles.milestoneCard,
                { opacity: pressed ? 0.92 : 1 },
              ]}>
              <View style={{ flex: 1 }}>
                <Label>Next milestone</Label>
                <Text style={styles.milestoneTitle}>
                  {next.label}: {next.title}
                </Text>
                <Text style={styles.milestoneRemaining}>
                  in {formatDurationShort(next.remainingSeconds)}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(progress * 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.cardChevron}>›</Text>
            </Pressable>
          )}

          <ArtPlate
            source={homeWindowsill}
            aspect={0.5}
            widthPct={52}
            label="Watercolor illustration of a windowsill with a small plant and a jar of coins in morning light"
            style={{ marginTop: spacing.xl }}
          />
        </>
      )}

      <View style={styles.missionCard}>
        <View style={styles.missionHead}>
          <Label color={colors.amber}>Today's mission</Label>
          {missionRecord?.status === 'done' && <CheckBadge size={22} />}
        </View>
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

      <Pressable
        onPress={() => router.push('/note-to-self')}
        style={({ pressed }) => [
          styles.milestoneCard,
          { opacity: pressed ? 0.92 : 1 },
        ]}>
        <View style={{ flex: 1 }}>
          <Label>Note to self</Label>
          <Text style={styles.milestoneTitle}>Your day-one declaration</Text>
          <Text style={styles.milestoneRemaining}>
            Read it on the hard days. It is still true.
          </Text>
        </View>
        <Text style={styles.cardChevron}>›</Text>
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
    <View style={styles.card}>
      <Label>
        Cutting down · Week {week + 1}
      </Label>
      <Display size={38} color={colors.charcoal} style={{ marginTop: spacing.sm }}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerPlate: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  headerName: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.charcoal,
  },
  headerDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 1,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  dailyLine: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 23,
    color: colors.violetGray,
    marginTop: spacing.md,
  },
  statTrio: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  ledger: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  badgeMarks: {
    flexDirection: 'row',
    marginRight: spacing.md,
  },
  badgeMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.periwinkle,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMarkOverlap: { marginLeft: -10 },
  badgeMarkEmpty: { backgroundColor: colors.surfaceMuted },
  badgeMarkText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.white,
  },
  badgeCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 2,
  },
  badgeNext: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  milestoneTitle: {
    fontFamily: fonts.bodyBold,
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
  cardChevron: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.inkFaint,
    alignSelf: 'center',
    marginLeft: spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.periwinkle,
    borderRadius: 3,
  },
  missionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  missionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.charcoal,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.violetGray,
    marginTop: spacing.md,
  },
  missionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sosWrap: { marginTop: spacing.lg },
  sosButton: {
    borderRadius: radii.pill,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  sosTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.charcoal,
  },
  sosSub: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.75,
    marginTop: 2,
  },
});
