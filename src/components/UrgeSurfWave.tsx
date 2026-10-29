import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { haptics } from '../lib/haptics';
import { colors, fonts, spacing } from '../theme';
import { Body, Chip, Display, GhostButton, Label, PrimaryButton } from './ui';

/**
 * Ride the wave: a five-minute urge-surf. The user rates the craving,
 * then watches a wave rise, crest, and fall on the same five-minute
 * curve cravings follow, with acceptance copy (notice it, name it, let
 * it pass) instead of a fight. They re-rate at the end and see their
 * own number drop, then log the outcome. Motion is deliberately slow:
 * in a craving, calm on screen teaches calm in the body.
 */

export const WAVE_SECONDS = 300;

type Phase = 'rate' | 'surf' | 'rerate' | 'done';

export interface WaveResult {
  intensityBefore: number;
  intensityAfter: number;
  durationSec: number;
}

function wavePath(width: number, height: number, progress: number): string {
  const mid = height / 2;
  // Amplitude follows the craving itself: rises, crests mid-way, falls.
  const hump = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, progress))), 1.1);
  const amp = 6 + (height / 2 - 14) * hump;
  const drift = progress * Math.PI * 3;
  const step = 8;
  let d = '';
  for (let x = 0; x <= width; x += step) {
    const y = mid - amp * Math.sin((x / width) * Math.PI * 3 + drift);
    d += x === 0 ? `M ${x} ${y.toFixed(1)}` : ` L ${x} ${y.toFixed(1)}`;
  }
  return d;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function IntensityPicker({
  value,
  onPick,
}: {
  value: number | null;
  onPick: (n: number) => void;
}) {
  return (
    <View style={styles.intensityWrap}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <Chip
          key={n}
          label={String(n)}
          selected={value === n}
          onPress={() => onPick(n)}
        />
      ))}
      <View style={styles.intensityEnds}>
        <Text style={styles.intensityEnd}>Barely there</Text>
        <Text style={styles.intensityEnd}>The loudest it gets</Text>
      </View>
    </View>
  );
}

export default function UrgeSurfWave({
  onOutcome,
  onBack,
}: {
  onOutcome: (outcome: 'resisted' | 'slipped', result: WaveResult) => void;
  onBack: () => void;
}) {
  const { width } = useWindowDimensions();
  const waveWidth = Math.max(260, width - spacing.lg * 2);
  const waveHeight = 150;

  const [phase, setPhase] = useState<Phase>('rate');
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(WAVE_SECONDS);
  const startRef = useRef<number>(0);
  const surfSecondsRef = useRef(0);

  useEffect(() => {
    if (phase !== 'surf') return;
    startRef.current = Date.now();
    const t = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      surfSecondsRef.current = elapsed;
      setProgress(Math.min(1, elapsed / WAVE_SECONDS));
      setRemaining(Math.max(0, Math.ceil(WAVE_SECONDS - elapsed)));
      if (elapsed >= WAVE_SECONDS) {
        clearInterval(t);
        setPhase('rerate');
      }
    }, 500);
    return () => clearInterval(t);
  }, [phase]);

  const result = (): WaveResult => ({
    intensityBefore: before ?? 0,
    intensityAfter: after ?? 0,
    durationSec: Math.max(1, Math.round(surfSecondsRef.current)),
  });

  const phaseCopy =
    progress < 0.34
      ? 'Notice it. Where do you feel it in your body?'
      : progress < 0.67
        ? 'Name it. This is the crest, and it is already turning.'
        : 'Let it pass. Watch it get smaller behind you.';

  return (
    <View>
      <Label color={colors.amber}>Ride the wave</Label>
      <Display size={30} style={{ marginTop: spacing.xs }}>
        Five minutes, ridden out
      </Display>

      {phase === 'rate' && (
        <View style={{ marginTop: spacing.md }}>
          <Body color={colors.inkMuted}>
            First, be honest: how strong is this craving right now, from
            1 to 10? No judgement either way. Most cravings peak and fade
            within a few minutes; this timer just makes the wave visible.
          </Body>
          <View style={{ marginTop: spacing.lg }}>
            <IntensityPicker value={before} onPick={setBefore} />
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton
              title="Start the wave"
              disabled={before === null}
              onPress={() => setPhase('surf')}
            />
            <GhostButton title="Back to tools" onPress={onBack} />
          </View>
        </View>
      )}

      {phase === 'surf' && (
        <View style={{ marginTop: spacing.md }}>
          <Body color={colors.inkMuted}>
            Notice it. Name it. Let it peak and pass. You do not have to
            fight a wave; you only have to stay on the board.
          </Body>
          <View style={styles.waveBox}>
            <Svg width={waveWidth} height={waveHeight}>
              <Path
                d={`${wavePath(waveWidth, waveHeight, progress)} L ${waveWidth} ${waveHeight} L 0 ${waveHeight} Z`}
                fill={colors.pineSoft}
                opacity={0.55}
              />
              <Path
                d={wavePath(waveWidth, waveHeight, progress)}
                stroke={colors.pine}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={styles.clock} maxFontSizeMultiplier={1.2}>
            {formatClock(remaining)}
          </Text>
          <Text style={styles.phaseCopy}>{phaseCopy}</Text>
          <View style={{ marginTop: spacing.lg }}>
            <GhostButton
              title="End the wave here"
              onPress={() => setPhase('rerate')}
            />
          </View>
        </View>
      )}

      {phase === 'rerate' && (
        <View style={{ marginTop: spacing.md }}>
          <Body color={colors.inkMuted}>
            The wave has had its five minutes, or you called time on it.
            Either way: how strong is the craving now?
          </Body>
          <View style={{ marginTop: spacing.lg }}>
            <IntensityPicker value={after} onPick={setAfter} />
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton
              title="See what happened"
              disabled={after === null}
              onPress={() => setPhase('done')}
            />
          </View>
        </View>
      )}

      {phase === 'done' && (
        <View style={{ marginTop: spacing.md }}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLine}>
              It arrived at <Text style={styles.scoreNum}>{before}/10</Text>
            </Text>
            <Text style={styles.scoreLine}>
              It is leaving at <Text style={styles.scoreNum}>{after}/10</Text>
            </Text>
            <Text style={styles.scoreNote}>
              {after !== null && before !== null && after < before
                ? 'That drop is the whole lesson: cravings fall on their own when you give them minutes instead of a fight.'
                : 'It did not fall much this time, and that happens too. You still spent five minutes watching it instead of obeying it.'}
            </Text>
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton
              title="I resisted"
              onPress={() => onOutcome('resisted', result())}
            />
            <GhostButton
              title="I slipped"
              onPress={() => onOutcome('slipped', result())}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  intensityWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  intensityEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
  },
  intensityEnd: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
  },
  waveBox: {
    marginTop: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  clock: {
    fontFamily: fonts.displayBold,
    fontSize: 44,
    color: colors.pineDeep,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  phaseCopy: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 27,
    color: colors.pineDeep,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 54,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    padding: spacing.lg,
  },
  scoreLine: {
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
  },
  scoreNum: {
    fontFamily: fonts.displayBold,
    color: colors.pine,
  },
  scoreNote: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkMuted,
    marginTop: spacing.md,
  },
});
