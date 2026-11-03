import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { RECOVERY_TRACKS, trackProgress } from '../lib/milestones';
import type { Plan } from '../types';
import { colors, fonts, spacing } from '../theme';
import { Body, Label } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 92;
const STROKE = 9;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** One soft pastel gradient pair per recovery track. */
const TRACK_GRADIENTS: Record<string, [string, string]> = {
  heart: ['#F2A65A', '#A7A9DF'],
  lungs: ['#A7A9DF', '#BFD9F2'],
  energy: ['#D8D7F6', '#F6C177'],
};

/**
 * "Your body, recovering": three rings (Heart, Lungs, Energy) whose
 * fill is the milestone ladder for that system: rungs passed plus the
 * fraction of the way to the next rung. In the PulseBuddy system the
 * rings live inside a white card as soft gradient visuals — each
 * track's stroke is its own pastel gradient over a pale lavender
 * track. Rings sweep in on mount and whenever the percentage moves.
 * Framing stays population-level.
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
      <Label>Your body, recovering</Label>
      <View style={styles.ringRow}>
        {RECOVERY_TRACKS.map((track) => {
          const progress = trackProgress(track, plan, now);
          return (
            <Ring
              key={track.id}
              trackId={track.id}
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
  trackId,
  label,
  percent,
  caption,
}: {
  trackId: string;
  label: string;
  percent: number;
  caption: string;
}) {
  const clamped = Math.min(1, Math.max(0, percent));
  const anim = useRef(new Animated.Value(0)).current;
  const pair = TRACK_GRADIENTS[trackId] ?? ['#A7A9DF', '#D8D7F6'];
  const gradId = `ring-${trackId}`;

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
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={pair[0]} />
              <Stop offset="1" stopColor={pair[1]} />
            </LinearGradient>
          </Defs>
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
            stroke={`url(#${gradId})`}
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
    color: colors.charcoal,
  },
  ringLabel: {
    fontFamily: fonts.bodyBold,
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
