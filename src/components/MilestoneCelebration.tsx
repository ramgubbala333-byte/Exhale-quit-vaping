import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, Share, StyleSheet, Text, View } from 'react-native';

import { formatMoneyExact } from '../lib/calc';
import { haptics } from '../lib/haptics';
import type { MilestoneState } from '../lib/milestones';
import { useReduceMotion } from '../lib/useReduceMotion';
import { colors, fonts, radii, spacing } from '../theme';
import { GhostButton, Label, PrimaryButton } from './ui';

const milestoneDawn = require('../../assets/illustrations/03-milestone-dawn.jpg');

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
  const reduceMotion = useReduceMotion();
  // Seal-stamp: the milestone mark lands like a stamp, scale 1.6 to 1
  // with a spring, trailed by a single pine ring pulse. Total motion is
  // under 1.2 seconds, no particles. Reduce-motion settles it instantly.
  const stampScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!milestone) return;
    haptics.success();
    if (reduceMotion) {
      stampScale.setValue(1);
      ringOpacity.setValue(0);
      return;
    }
    stampScale.setValue(1.6);
    ringScale.setValue(1);
    ringOpacity.setValue(0.55);
    Animated.parallel([
      Animated.spring(stampScale, {
        toValue: 1,
        friction: 5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(ringScale, {
        toValue: 2,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();
  }, [milestone, reduceMotion, stampScale, ringScale, ringOpacity]);

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
          <View style={styles.headerArtFrame}>
            <Image
              source={milestoneDawn}
              style={styles.artFill}
              resizeMode="cover"
              accessibilityLabel="Watercolor illustration of the window at clear dawn, the mist gone"
            />
          </View>
          <View style={styles.sealWrap}>
            <Animated.View
              style={[
                styles.sealRing,
                {
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.seal,
                { transform: [{ scale: stampScale }] },
              ]}>
              <Text maxFontSizeMultiplier={1.2} style={styles.sealText}>
                {milestone?.label}
              </Text>
            </Animated.View>
          </View>
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
  headerArtFrame: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
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
  sealWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sealRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: colors.amberBright,
  },
  seal: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: colors.amberBright,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  sealText: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    lineHeight: 21,
    color: colors.bg,
    textAlign: 'center',
  },
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
