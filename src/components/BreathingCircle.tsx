import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';

export type BreathPhase = 'in' | 'hold' | 'out';

const PHASE_LABEL: Record<BreathPhase, string> = {
  in: 'Breathe in',
  hold: 'Hold',
  out: 'Breathe out',
};

const PHASE_MS = 4000;

/**
 * Guided 4-4-4 breathing circle. The circle scales up on the inhale,
 * holds, and eases back down on the exhale, looping until unmounted.
 * Calls onPhaseChange so the SOS screen can narrate the session.
 */
export default function BreathingCircle({
  onPhaseChange,
}: {
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
        duration: PHASE_MS,
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
              duration: PHASE_MS,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }).start(() => {
              if (!cancelled) runCycle();
            });
          }, PHASE_MS),
        );
      });
    };

    runCycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      scale.stopAnimation();
    };
  }, [scale]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.ring, { transform: [{ scale }] }]}>
        <View style={styles.core} />
      </Animated.View>
      <Text style={styles.phaseLabel}>{PHASE_LABEL[phase]}</Text>
      <Text style={styles.phaseHint}>4 seconds in, 4 hold, 4 out</Text>
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
    borderColor: colors.pine,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pineSoft,
  },
  core: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.pine,
    opacity: 0.9,
  },
  phaseLabel: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.pineDeep,
    marginTop: 28,
  },
  phaseHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
