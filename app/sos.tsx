import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BreathingCircle from '@/components/BreathingCircle';
import { Body, Display, GhostButton, Label, PrimaryButton, Screen } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme';

const SESSION_SECONDS = 180; // Cravings typically crest and fade within ~3 minutes.

const BASE_LINES = [
  'This feeling is a wave. It rises, it peaks, it passes.',
  'You are not giving something up. You are taking something back.',
  'Three minutes from now, this urge will be smaller.',
  'Every craving you ride out makes the next one weaker.',
  'Your future self is already glad you stayed.',
];

type FlowState = 'surfing' | 'resisted' | 'slipped';

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Sos() {
  const plan = useStore((s) => s.plan);
  const logCraving = useStore((s) => s.logCraving);
  const resetQuitDate = useStore((s) => s.resetQuitDate);

  const [flow, setFlow] = useState<FlowState>('surfing');
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const startedAtRef = useRef(Date.now());

  const lines = useMemo(() => {
    const reasonLines = (plan?.reasons ?? []).map(
      (r) => `Remember why you started: ${r.toLowerCase()}.`,
    );
    return [...reasonLines, ...BASE_LINES];
  }, [plan]);

  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (flow !== 'surfing') return;
    const countdown = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    const rotator = setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 12000);
    return () => {
      clearInterval(countdown);
      clearInterval(rotator);
    };
  }, [flow, lines.length]);

  const sessionSeconds = () =>
    Math.min(
      SESSION_SECONDS,
      Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
    );

  const onResisted = () => {
    logCraving('resisted', sessionSeconds());
    setFlow('resisted');
  };

  const onSlipped = () => {
    logCraving('slipped', sessionSeconds());
    setFlow('slipped');
  };

  const onResetAndClose = () => {
    resetQuitDate();
    router.back();
  };

  return (
    <Screen>
      {flow === 'surfing' && (
        <View>
          <Label color={colors.amber}>Craving, in progress</Label>
          <Display size={32} style={{ marginTop: spacing.xs }}>
            Ride the wave
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            Cravings crest and fade in about three minutes. Breathe with the
            circle until the clock runs out.
          </Body>

          <Text style={styles.countdown}>{formatClock(remaining)}</Text>
          {remaining === 0 && (
            <Text style={styles.passedNote}>
              The peak has passed. Whatever you choose now, choose it calmly.
            </Text>
          )}

          <BreathingCircle />

          <Text style={styles.line}>{lines[lineIndex]}</Text>

          <View style={{ marginTop: spacing.xl }}>
            <PrimaryButton title="I resisted" onPress={onResisted} />
            <GhostButton title="I slipped" onPress={onSlipped} />
            <GhostButton title="End session" onPress={() => router.back()} />
          </View>
        </View>
      )}

      {flow === 'resisted' && (
        <View style={styles.centerBlock}>
          <Label color={colors.pine}>Logged</Label>
          <Display size={34} style={{ marginTop: spacing.sm }}>
            That one is behind you
          </Display>
          <Body
            color={colors.inkMuted}
            style={{ marginTop: spacing.md, textAlign: 'center' }}>
            You faced a craving and it did not move you. It is in your
            journal, your resisted count just went up, and the next craving
            will be a little weaker for it.
          </Body>
          <View style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
            <PrimaryButton title="Back to my streak" onPress={() => router.back()} />
          </View>
        </View>
      )}

      {flow === 'slipped' && (
        <View style={styles.centerBlock}>
          <Label color={colors.clay}>Logged, honestly</Label>
          <Display size={34} style={{ marginTop: spacing.sm }}>
            A slip is data, not a verdict
          </Display>
          <Body
            color={colors.inkMuted}
            style={{ marginTop: spacing.md, textAlign: 'center' }}>
            Most successful quits include a slip or two. What matters is
            what happens next. You can restart the clock from right now, or
            keep your original quit date and carry on. Either way, Exhale is
            still in your corner.
          </Body>
          <View style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
            <PrimaryButton
              title="Restart my clock from now"
              onPress={onResetAndClose}
            />
            <GhostButton
              title="Keep my quit date and carry on"
              onPress={() => router.back()}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  countdown: {
    fontFamily: fonts.displayBold,
    fontSize: 54,
    color: colors.pineDeep,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  passedNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.amber,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  line: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 27,
    color: colors.pineDeep,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 54,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
