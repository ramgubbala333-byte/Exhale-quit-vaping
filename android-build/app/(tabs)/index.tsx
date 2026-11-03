import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import QuitTimer from '@/components/QuitTimer';
import { Body, Display, Label, Screen, StatRow } from '@/components/ui';
import {
  elapsedSeconds,
  formatCount,
  formatDurationShort,
  formatMoneyExact,
  moneySaved,
  puffsAvoided,
  unitsAvoided,
} from '@/lib/calc';
import { nextMilestone, progressToNext } from '@/lib/milestones';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

export default function Home() {
  const plan = useStore((s) => s.plan);
  const cravings = useStore((s) => s.cravings);
  const [now, setNow] = useState(() => new Date());

  // Refresh the derived numbers once a minute (the timer ticks itself).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!plan) return null;

  const resisted = cravings.filter((c) => c.outcome === 'resisted').length;
  const saved = moneySaved(plan, now);
  const next = nextMilestone(plan, now);
  const progress = progressToNext(plan, now);
  const streakSeconds = elapsedSeconds(plan, now);

  return (
    <Screen>
      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>Exhale</Text>
        <Text style={styles.dateText}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

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

      {next && (
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
    </Screen>
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
