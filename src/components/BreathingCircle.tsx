import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';

export type BreathPhase = 'in' | 'hold' | 'out';

const PHASE_LABEL: Record<BreathPhase, string> = {
  in: 'Breathe in',
  hold: 'Hold',
  out: 'Breathe out',
};

export interface BreathPattern {
  id: string;
  label: string;
  /** Seconds for the inhale. */
  inSec: number;
  /** Seconds for the hold. */
  holdSec: number;
  /** Seconds for the exhale. */
  outSec: number;
}

export const BREATH_PATTERNS: BreathPattern[] = [
  { id: '444', label: '4-4-4 · Steady', inSec: 4, holdSec: 4, outSec: 4 },
  { id: '478', label: '4-7-8 · Calming', inSec: 4, holdSec: 7, outSec: 8 },
];

/**
 * Guided breathing circle. The circle scales up on the inhale, holds,
 * and eases back down on the exhale, looping until unmounted. The pace
 * comes from the chosen pattern (4-4-4 steady, or the slower 4-7-8).
 */
export default function BreathingCircle({
  pattern = BREATH_PATTERNS[0],
  onPhaseChange,
}: {
  pattern?: BreathPattern;
  onPhaseChange?: (phase: BreathPhase) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<BreathPhase>('in');
  const callbackRef = useRef(onPhaseChange);
  callbackRef.current = onPhaseChange;

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const setPhaseSafe = (p: BreathPhase) => {
      if (cancelled) return;
      setPhase(p);
      callbackRef.current?.(p);
    };

    const runCycle = () => {
      if (cancelled) return;
      setPhaseSafe('in');
      Animated.timing(scale, {
        toValue: 1.35,
        duration: pattern.inSec * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return;
        setPhaseSafe('hold');
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setPhaseSafe('out');
            Animated.timing(scale, {
              toValue: 1,
              duration: pattern.outSec * 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }).start(() => {
              if (!cancelled) runCycle();
            });
          }, pattern.holdSec * 1000),
        );
      });
    };

    runCycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      scale.stopAnimation();
    };
  }, [scale, pattern]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.ring, { transform: [{ scale }] }]}>
        <View style={styles.core} />
      </Animated.View>
      <Text style={styles.phaseLabel}>{PHASE_LABEL[phase]}</Text>
      <Text style={styles.phaseHint}>
        {pattern.inSec} seconds in, {pattern.holdSec} hold, {pattern.outSec} out
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  ring: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: colors.periwinkle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.calmSoft,
  },
  core: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.periwinkle,
    opacity: 0.85,
  },
  phaseLabel: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.charcoal,
    marginTop: 28,
  },
  phaseHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
