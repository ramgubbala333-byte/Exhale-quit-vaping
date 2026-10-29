import { Modal, Share, StyleSheet, Text, View } from 'react-native';

import { formatMoneyExact } from '../lib/calc';
import type { MilestoneState } from '../lib/milestones';
import { colors, fonts, radii, spacing } from '../theme';
import { GhostButton, Label, PrimaryButton } from './ui';

/**
 * One-time celebration sheet shown when a health milestone is newly
 * reached while the app is open. The Home screen decides when to show
 * it and records the milestone as celebrated before it appears, so it
 * can never fire twice for the same milestone.
 */
export default function MilestoneCelebration({
  milestone,
  daysFree,
  moneyKept,
  onDismiss,
}: {
  milestone: MilestoneState | null;
  daysFree: number;
  moneyKept: number;
  onDismiss: () => void;
}) {
  const shareText = milestone
    ? `Milestone reached with Mistless: ${milestone.label} — ${milestone.title}. ` +
      `${daysFree} day${daysFree === 1 ? '' : 's'} vape-free and ${formatMoneyExact(moneyKept)} kept so far.`
    : '';

  const doShare = async () => {
    try {
      await Share.share({ message: shareText, title: 'My Mistless milestone' });
    } catch {
      // Share sheet dismissed or unavailable; the celebration stays up.
    }
  };

  return (
    <Modal
      visible={milestone !== null}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Label color={colors.amber}>Milestone reached</Label>
          <Text maxFontSizeMultiplier={1.3} style={styles.title}>
            {milestone?.label}: {milestone?.title}
          </Text>
          <Text style={styles.big}>
            {daysFree} day{daysFree === 1 ? '' : 's'} vape-free
          </Text>
          <Text style={styles.sub}>
            {formatMoneyExact(moneyKept)} kept so far
          </Text>
          <View style={styles.actions}>
            <PrimaryButton title="Share this milestone" tone="amber" onPress={doShare} />
            <GhostButton title="Keep going" onPress={onDismiss} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 46, 40, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.pine,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 33,
    color: colors.bg,
    marginTop: spacing.sm,
  },
  big: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: colors.bg,
    marginTop: spacing.lg,
  },
  sub: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.amberBright,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.lg,
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
});
