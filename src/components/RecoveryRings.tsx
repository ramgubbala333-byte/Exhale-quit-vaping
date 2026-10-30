import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { RECOVERY_TRACKS, trackProgress } from '../lib/milestones';
import type { Plan } from '../types';
import { colors, fonts, spacing } from '../theme';
import { Body, Label } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 92;
const STROKE = 9;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * "Your body, recovering": three rings (Heart, Lungs, Energy) whose
 * fill is the milestone ladder for that system: rungs passed plus the
 * fraction of the way to the next rung. Rings sweep in on mount and
 * whenever the percentage moves. Framing stays population-level.
 */
export default function RecoveryRings({
  plan,
  now,
  style,
}: {
  plan: Plan;
  now: Date;
  /** Merged over the wrap style (e.g. a smaller marginTop inside a card). */
  style?: object;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <Label color={colors.pine}>Your body, recovering</Label>
      <View style={styles.ringRow}>
        {RECOVERY_TRACKS.map((track) => {
          const progress = trackProgress(track, plan, now);
          return (
            <Ring
              key={track.id}
              label={track.label}
              percent={progress.percent}
              caption={
                progress.next
                  ? `Next: ${progress.next.title}`
                  : 'Full ladder climbed'
              }
            />
          );
        })}
      </View>
      <Body size={12} color={colors.inkFaint} style={styles.note}>
        Rings fill along the recovery timeline on the Milestones tab.
        General population-level estimates (WHO/CDC), not personal
        measurements.
      </Body>
    </View>
  );
}

function Ring({
  label,
  percent,
  caption,
}: {
  label: string;
  percent: number;
  caption: string;
}) {
  const clamped = Math.min(1, Math.max(0, percent));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [anim, clamped]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.ringCell}>
      <View style={styles.ringBox}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.surfaceMuted}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.pine}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.percentWrap} pointerEvents="none">
          <Text maxFontSizeMultiplier={1.2} style={styles.percentText}>
            {Math.round(clamped * 100)}%
          </Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
      <Text style={styles.ringCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  ringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  ringCell: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  ringBox: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.pineDeep,
  },
  ringLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  ringCaption: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  note: { marginTop: spacing.md },
});
