import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import BreathingCircle, { BREATH_PATTERNS } from '@/components/BreathingCircle';
import {
  Body,
  Chip,
  Display,
  GhostButton,
  Label,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import {
  formatMoneyExact,
  lifetimeMoneySaved,
  savingsGoalPercent,
} from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

/**
 * PRODUCT POLICY: the SOS toolkit and the core quit counter are free
 * forever and must NEVER be placed behind the Exhale Plus paywall.
 * Craving support is the heart of the app; charging for it in the moment
 * someone is struggling would be both wrong and self-defeating. Plus is
 * for depth (analytics, plans, audio), never for rescue.
 */

const URGE_SECONDS = 180; // Cravings typically crest and fade within ~3 minutes.
const PLEDGE_SECONDS = 600; // The delay pledge: ten honest minutes.

const BASE_LINES = [
  'This feeling is a wave. It rises, it peaks, it passes.',
  'You are not giving something up. You are taking something back.',
  'Three minutes from now, this urge will be smaller.',
  'Every craving you ride out is one more rep of practice.',
  'Your future self is already glad you stayed.',
];

type Tool = 'menu' | 'breathing' | 'urge' | 'pledge' | 'why';
type FlowState = 'active' | 'resisted' | 'slipped';

const TOOLS: { id: Exclude<Tool, 'menu'>; title: string; detail: string }[] = [
  {
    id: 'breathing',
    title: 'Breathing',
    detail: 'Slow your body down with a guided circle, 4-4-4 or 4-7-8.',
  },
  {
    id: 'urge',
    title: 'Urge timer',
    detail: 'Three minutes. Most cravings crest and fade inside that window.',
  },
  {
    id: 'pledge',
    title: 'Delay pledge',
    detail: 'Promise yourself ten minutes, then decide again with a clear head.',
  },
  {
    id: 'why',
    title: 'Why cards',
    detail: 'Your own reasons, and what your kept money is building toward.',
  },
];

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Sos() {
  const plan = useStore((s) => s.plan);
  const logCraving = useStore((s) => s.logCraving);
  const resetQuitDate = useStore((s) => s.resetQuitDate);
  const savingsGoal = useStore((s) => s.savingsGoal);
  const bankedMoney = useStore((s) => s.lifetimeMoneyBanked);
  const bankedPuffs = useStore((s) => s.lifetimePuffsBanked);
  const bankedUnits = useStore((s) => s.lifetimeUnitsBanked);
  const bankedFreeSeconds = useStore((s) => s.lifetimeFreeSecondsBanked);
  const { width } = useWindowDimensions();

  const [tool, setTool] = useState<Tool>('menu');
  const [flow, setFlow] = useState<FlowState>('active');
  const [patternId, setPatternId] = useState(BREATH_PATTERNS[0].id);
  const [remaining, setRemaining] = useState(URGE_SECONDS);
  const startedAtRef = useRef(Date.now());

  const lines = useMemo(() => {
    const reasonLines = (plan?.reasons ?? []).map(
      (r) => `Remember why you started: ${r.toLowerCase()}.`,
    );
    return [...reasonLines, ...BASE_LINES];
  }, [plan]);

  const [lineIndex, setLineIndex] = useState(0);

  const timerRunning = tool === 'urge' || tool === 'pledge';

  useEffect(() => {
    if (tool === 'urge') setRemaining(URGE_SECONDS);
    if (tool === 'pledge') setRemaining(PLEDGE_SECONDS);
    if (tool !== 'menu') startedAtRef.current = Date.now();
  }, [tool]);

  useEffect(() => {
    if (flow !== 'active' || !timerRunning) return;
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
  }, [flow, timerRunning, tool, lines.length]);

  const sessionSeconds = () =>
    Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

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

  const pattern =
    BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];

  const lifetimeSaved = plan
    ? lifetimeMoneySaved(
        plan,
        {
          money: bankedMoney,
          puffs: bankedPuffs,
          units: bankedUnits,
          freeSeconds: bankedFreeSeconds,
        },
        new Date(),
      )
    : 0;
  const goalPercent = savingsGoalPercent(savingsGoal, lifetimeSaved);

  const outcomeButtons = (
    <View style={{ marginTop: spacing.xl }}>
      <PrimaryButton title="I resisted" onPress={onResisted} />
      <GhostButton title="I slipped" onPress={onSlipped} />
      <GhostButton title="Back to tools" onPress={() => setTool('menu')} />
    </View>
  );

  return (
    <Screen>
      {flow === 'active' && tool === 'menu' && (
        <View>
          <Label color={colors.amber}>Craving toolkit</Label>
          <Display size={32} style={{ marginTop: spacing.xs }}>
            Pick your tool
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            A craving is a few minutes long. Each of these is built to get
            you through those minutes in a different way. All of them are
            free, always.
          </Body>
          <View style={{ marginTop: spacing.lg }}>
            {TOOLS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTool(t.id)}
                style={({ pressed }) => [
                  styles.toolRow,
                  { opacity: pressed ? 0.75 : 1 },
                ]}>
                <Text style={styles.toolTitle}>{t.title}</Text>
                <Text style={styles.toolDetail}>{t.detail}</Text>
              </Pressable>
            ))}
          </View>
          <GhostButton title="Close" onPress={() => router.back()} />
        </View>
      )}

      {flow === 'active' && tool === 'breathing' && (
        <View>
          <Label color={colors.amber}>Breathing</Label>
          <Display size={30} style={{ marginTop: spacing.xs }}>
            Slow it down
          </Display>
          <View style={[styles.chipRow, { marginTop: spacing.md }]}>
            {BREATH_PATTERNS.map((p) => (
              <Chip
                key={p.id}
                label={p.label}
                selected={patternId === p.id}
                onPress={() => setPatternId(p.id)}
              />
            ))}
          </View>
          <BreathingCircle pattern={pattern} />
          <Text style={styles.line}>{lines[lineIndex]}</Text>
          {outcomeButtons}
        </View>
      )}

      {flow === 'active' && tool === 'urge' && (
        <View>
          <Label color={colors.amber}>Urge timer</Label>
          <Display size={30} style={{ marginTop: spacing.xs }}>
            Ride the wave
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            Cravings crest and fade in about three minutes. Watch the clock
            run out on this one.
          </Body>
          <Text style={styles.countdown} maxFontSizeMultiplier={1.2}>{formatClock(remaining)}</Text>
          {remaining === 0 && (
            <Text style={styles.passedNote}>
              The peak has passed. Whatever you choose now, choose it calmly.
            </Text>
          )}
          <Text style={styles.line}>{lines[lineIndex]}</Text>
          {outcomeButtons}
        </View>
      )}

      {flow === 'active' && tool === 'pledge' && (
        <View>
          <Label color={colors.amber}>Delay pledge</Label>
          <Display size={30} style={{ marginTop: spacing.xs }}>
            Ten honest minutes
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            The pledge: "I will wait ten minutes before I decide anything."
            Not forever. Just ten minutes. When the clock ends, check back
            in with yourself.
          </Body>
          <Text style={styles.countdown} maxFontSizeMultiplier={1.2}>{formatClock(remaining)}</Text>
          {remaining === 0 ? (
            <View>
              <Text style={styles.passedNote}>
                Ten minutes kept. How is the craving now?
              </Text>
              <View style={{ marginTop: spacing.lg }}>
                <PrimaryButton title="It passed, I resisted" onPress={onResisted} />
                <GhostButton
                  title="Still strong, switch to breathing"
                  onPress={() => setTool('breathing')}
                />
                <GhostButton title="I slipped" onPress={onSlipped} />
              </View>
            </View>
          ) : (
            <GhostButton title="Break the pledge and go back" onPress={() => setTool('menu')} />
          )}
        </View>
      )}

      {flow === 'active' && tool === 'why' && (
        <View>
          <Label color={colors.amber}>Why cards</Label>
          <Display size={30} style={{ marginTop: spacing.xs }}>
            Your reasons, up close
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            Swipe through them slowly. You wrote these on day one for
            exactly this moment.
          </Body>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - spacing.lg * 2}
            decelerationRate="fast"
            style={{ marginTop: spacing.lg, marginHorizontal: -spacing.lg }}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
            {(plan?.reasons ?? []).map((r, i) => (
              <View key={i} style={[styles.whyCard, { width: width - spacing.lg * 2 - 8 }]}>
                <Label color={colors.amberBright}>Reason {i + 1}</Label>
                <Text style={styles.whyText}>{r}</Text>
              </View>
            ))}
            <View style={[styles.whyCard, { width: width - spacing.lg * 2 - 8 }]}>
              <Label color={colors.amberBright}>What it is buying you</Label>
              <Text style={styles.whyText}>
                {formatMoneyExact(lifetimeSaved)} kept so far
              </Text>
              {savingsGoal && goalPercent !== null && (
                <Text style={styles.whySub}>
                  That is {Math.floor(goalPercent)}% of your {savingsGoal.name}.
                </Text>
              )}
            </View>
          </ScrollView>
          <View style={{ marginTop: spacing.xl }}>
            <PrimaryButton title="That helped, log it as resisted" onPress={onResisted} />
            <GhostButton title="Back to tools" onPress={() => setTool('menu')} />
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
            journal, your resisted count just went up, and every one you log
            makes your patterns clearer.
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
            what happens next.
          </Body>
          <Body
            color={colors.ink}
            style={{ marginTop: spacing.md, textAlign: 'center' }}>
            And hear this clearly: restarting the clock does not erase your
            progress. Your lifetime totals, every dollar kept, puff avoided,
            and craving resisted across all your attempts, are banked in
            your Stats and stay there. Only the current streak starts over.
          </Body>
          <Body
            color={colors.inkMuted}
            style={{ marginTop: spacing.md, textAlign: 'center' }}>
            You can restart the clock from right now, or keep your original
            quit date and carry on. Either way, Mistless is still in your
            corner.
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  toolRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  toolTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.pineDeep,
  },
  toolDetail: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: 3,
  },
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
  whyCard: {
    backgroundColor: colors.pine,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.sm,
    minHeight: 220,
    justifyContent: 'center',
  },
  whyText: {
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 36,
    color: colors.bg,
    marginTop: spacing.sm,
  },
  whySub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.pineSoft,
    marginTop: spacing.sm,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
