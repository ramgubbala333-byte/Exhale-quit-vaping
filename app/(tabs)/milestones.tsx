import { useState } from 'react';
import { Modal, Share, StyleSheet, Text, View } from 'react-native';

import AchievementsGrid from '@/components/AchievementsGrid';
import MaxWidth from '@/components/MaxWidth';
import {
  Body,
  Display,
  GhostButton,
  Label,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import {
  elapsedDays,
  formatDurationShort,
  formatMoneyExact,
  moneySaved,
} from '@/lib/calc';
import { milestoneStates, type MilestoneState } from '@/lib/milestones';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

/**
 * One playful marker per milestone card (owner-directed exception to
 * the app's no-emoji rule, this screen only). Keyed by milestone id so
 * the milestones engine stays pure data.
 */
const MILESTONE_EMOJI: Record<string, string> = {
  m20min: '💓',
  m8h: '🌬️',
  m24h: '🌅',
  m48h: '🍃',
  m72h: '🌿',
  m1w: '🌈',
  m2w: '🏃',
  m1mo: '🫁',
  m6w: '🌱',
  m2mo: '💪',
  m3mo: '🎈',
  m4mo: '🔋',
  m6mo: '🏅',
  m9mo: '🌳',
  m1y: '🎉',
};

/** "Oct 30" / "Nov 2" — the short calendar form used on journey cards. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The health journey: a vertical pine-rail timeline of free-forever
 * milestone cards, plus the achievements grid below it.
 */
export default function Milestones() {
  const plan = useStore((s) => s.plan);
  const [shareTarget, setShareTarget] = useState<MilestoneState | null>(null);
  if (!plan) return null;

  const states = milestoneStates(plan);
  const reachedCount = states.filter((s) => s.reached).length;
  const daysFree = Math.floor(elapsedDays(plan));
  const saved = moneySaved(plan);

  const shareText = shareTarget
    ? `Milestone reached with Mistless: ${shareTarget.label} — ${shareTarget.title}. ` +
      `${daysFree} day${daysFree === 1 ? '' : 's'} vape-free and ${formatMoneyExact(saved)} kept so far.`
    : '';

  const doShare = async () => {
    try {
      await Share.share({ message: shareText, title: 'My Mistless milestone' });
    } catch {
      // Share sheet dismissed or unavailable; nothing to clean up.
    }
  };

  return (
    <Screen>
      <MaxWidth>
      <Display size={32}>My health journey</Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        How the body recovers after the last puff, step by step. This is
        general wellness information, not medical advice. {reachedCount} of{' '}
        {states.length} milestones reached, and every single one of them
        is free, forever. No locks on this road.
      </Body>

      <View style={styles.timeline}>
        {states.map((m, i) => (
          <View key={m.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  {
                    backgroundColor: m.reached ? colors.pine : colors.surface,
                    borderColor: m.reached ? colors.pine : colors.lineStrong,
                  },
                ]}>
                {m.reached && <Text style={styles.nodeCheck}>✓</Text>}
              </View>
              {i < states.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: m.reached
                        ? colors.pine
                        : colors.line,
                    },
                  ]}
                />
              )}
            </View>
            <View
              style={[
                styles.card,
                !m.reached && styles.cardUpcoming,
              ]}>
              <Label color={m.reached ? colors.pine : colors.inkFaint}>
                {m.label}
              </Label>
              <Text style={styles.rowTitle}>
                {MILESTONE_EMOJI[m.id] ? `${MILESTONE_EMOJI[m.id]} ` : ''}
                {m.title}
              </Text>
              <Text style={styles.rowDesc}>{m.description}</Text>
              <Text style={styles.rowMeta}>
                {m.reached
                  ? `Reached ${shortDate(m.at)}`
                  : `Arrives ${shortDate(m.at)} · in ${formatDurationShort(m.remainingSeconds)}`}
              </Text>
              {m.reached && (
                <View style={styles.shareRow}>
                  <GhostButton
                    title="Share this milestone"
                    onPress={() => setShareTarget(m)}
                  />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <Body size={12} color={colors.inkFaint} style={styles.estimatesNote}>
        General population-level estimates (WHO/CDC), not personal
        measurements.
      </Body>

      <AchievementsGrid />

      <Modal
        visible={shareTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShareTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.shareCard}>
            <Label color={colors.amberBright}>Mistless · Milestone</Label>
            <Text style={styles.shareCardTitle}>
              {shareTarget?.label}: {shareTarget?.title}
            </Text>
            <Text style={styles.shareCardBig}>
              {daysFree} day{daysFree === 1 ? '' : 's'} vape-free
            </Text>
            <Text style={styles.shareCardSub}>
              {formatMoneyExact(saved)} kept so far
            </Text>
          </View>
          <View style={styles.modalActions}>
            <PrimaryButton title="Share" onPress={doShare} />
            <GhostButton title="Close" onPress={() => setShareTarget(null)} />
          </View>
        </View>
      </Modal>
    </MaxWidth>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeline: { marginTop: spacing.xl },
  row: { flexDirection: 'row' },
  rail: { alignItems: 'center', width: 28, marginRight: spacing.md },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCheck: {
    color: colors.bg,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    lineHeight: 14,
  },
  connector: { width: 2, flex: 1, minHeight: 30, marginVertical: 4 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardUpcoming: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.line,
  },
  rowTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
    marginTop: 3,
  },
  rowDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: 4,
  },
  rowMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.amber,
    marginTop: 6,
  },
  shareRow: { alignItems: 'flex-start', marginLeft: -12 },
  estimatesNote: { marginBottom: spacing.xl, marginTop: -spacing.sm },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 46, 40, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  shareCard: {
    backgroundColor: colors.pine,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  shareCardTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 31,
    color: colors.bg,
    marginTop: spacing.sm,
  },
  shareCardBig: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    color: colors.bg,
    marginTop: spacing.lg,
  },
  shareCardSub: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.amberBright,
    marginTop: spacing.xs,
  },
  modalActions: {
    marginTop: spacing.lg,
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
});
