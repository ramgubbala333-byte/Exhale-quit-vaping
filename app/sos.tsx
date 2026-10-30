import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import BreathingCircle, { BREATH_PATTERNS } from '@/components/BreathingCircle';
import IfThenPlanForm from '@/components/IfThenPlanForm';
import {
  Body,
  Chip,
  Display,
  GhostButton,
  Label,
  PrimaryButton,
  Screen,
  StatRow,
} from '@/components/ui';
import UrgeSurfWave, { type WaveResult } from '@/components/UrgeSurfWave';
import {
  formatCount,
  formatMoneyExact,
  lifetimeFreeSeconds,
  lifetimeMoneySaved,
  lifetimePuffsAvoided,
  savingsGoalPercent,
} from '@/lib/calc';
import { haptics } from '@/lib/haptics';
import { planForTrigger, TRIGGERS } from '@/lib/plans';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

const sosShore = require('../assets/illustrations/01-sos-shore.jpg');
const rescueLamp = require('../assets/illustrations/03-rescue-lamp.jpg');
const supportLetter = require('../assets/illustrations/05-support-letter.jpg');

/**
 * PRODUCT POLICY: the SOS toolkit and the core quit counter are free
 * forever and must NEVER be placed behind the Mistless Plus paywall.
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

type Tool = 'menu' | 'breathing' | 'urge' | 'pledge' | 'why' | 'wave';
type FlowState = 'active' | 'resisted' | 'slipped';
type Outcome = 'resisted' | 'slipped';

const TOOLS: { id: Exclude<Tool, 'menu'>; title: string; detail: string }[] = [
  {
    id: 'wave',
    title: 'Ride the wave',
    detail: 'Five minutes of urge-surfing: rate it, watch it crest and fall, rate it again.',
  },
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
  const cravingPlans = useStore((s) => s.cravingPlans);
  const addCravingPlan = useStore((s) => s.addCravingPlan);
  const supportName = useStore((s) => s.supportName);
  const cravings = useStore((s) => s.cravings);
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

  // Trigger tagging: after an outcome, before the log is written.
  const [tagging, setTagging] = useState<{
    outcome: Outcome;
    wave?: WaveResult;
  } | null>(null);
  const [tagTrigger, setTagTrigger] = useState<string | null>(null);

  // Lapse rescue steps (shown when flow === 'slipped').
  const [rescueStep, setRescueStep] = useState(0);
  const [rescuePlan, setRescuePlan] = useState<{
    trigger: string;
    action: string;
  } | null>(null);

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
    if (flow !== 'active' || !timerRunning || tagging) return;
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
  }, [flow, timerRunning, tool, lines.length, tagging]);

  const sessionSeconds = () =>
    Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

  /** Outcome chosen: move to the trigger tag before writing the log. */
  const beginLog = (outcome: Outcome, wave?: WaveResult) => {
    setTagTrigger(null);
    setTagging({ outcome, wave });
  };

  const confirmLog = (withTrigger: boolean) => {
    if (!tagging) return;
    const { outcome, wave } = tagging;
    logCraving(outcome, wave ? wave.durationSec : sessionSeconds(), {
      trigger: withTrigger ? (tagTrigger ?? undefined) : undefined,
      intensityBefore: wave?.intensityBefore,
      intensityAfter: wave?.intensityAfter,
    });
    if (outcome === 'resisted') {
      haptics.success();
      setFlow('resisted');
    } else {
      haptics.commit();
      setRescueStep(0);
      setRescuePlan(null);
      setFlow('slipped');
    }
    setTagging(null);
  };

  const onResisted = () => beginLog('resisted');
  const onSlipped = () => beginLog('slipped');

  const onWaveOutcome = (outcome: Outcome, result: WaveResult) =>
    beginLog(outcome, result);

  const messageMyPerson = async () => {
    const message =
      'Craving hard right now. Can you keep me company for five minutes? - sent from Mistless';
    try {
      const url = `sms:?&body=${encodeURIComponent(message)}`;
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
        return;
      }
      throw new Error('sms unavailable');
    } catch {
      try {
        await Share.share({ message });
      } catch {
        // Composer unavailable; nothing else to do from here.
      }
    }
  };

  const finishRescue = (withPlan: boolean) => {
    if (withPlan && rescuePlan) {
      addCravingPlan(rescuePlan.trigger, rescuePlan.action);
    }
    resetQuitDate({ rescue: true });
    router.back();
  };

  const pattern =
    BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];

  const banked = {
    money: bankedMoney,
    puffs: bankedPuffs,
    units: bankedUnits,
    freeSeconds: bankedFreeSeconds,
  };
  const lifetimeSaved = plan ? lifetimeMoneySaved(plan, banked, new Date()) : 0;
  const lifetimePuffs = plan ? lifetimePuffsAvoided(plan, banked, new Date()) : 0;
  const lifetimeFree = plan ? lifetimeFreeSeconds(plan, banked, new Date()) : 0;
  const resistedTotal = cravings.filter((c) => c.outcome === 'resisted').length;
  const goalPercent = savingsGoalPercent(savingsGoal, lifetimeSaved);
  const matchedPlan = planForTrigger(cravingPlans, tagTrigger);

  const outcomeButtons = (
    <View style={{ marginTop: spacing.xl }}>
      <PrimaryButton title="I resisted" onPress={onResisted} />
      <GhostButton title="I slipped" onPress={onSlipped} />
      <GhostButton title="Back to tools" onPress={() => setTool('menu')} />
    </View>
  );

  return (
    <Screen>
      {tagging && (
        <View>
          <Label color={colors.amber}>One quick thing</Label>
          <Display size={30} style={{ marginTop: spacing.xs }}>
            What set it off?
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            Tagging the trigger is how your danger window gets smarter.
            Skip it if nothing fits; an untagged log still counts.
          </Body>
          <View style={[styles.chipRow, { marginTop: spacing.lg }]}>
            {TRIGGERS.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={tagTrigger === t}
                onPress={() => setTagTrigger(tagTrigger === t ? null : t)}
              />
            ))}
          </View>
          {matchedPlan && (
            <View style={styles.planCard}>
              <Label color={colors.amberBright}>Your plan for this one</Label>
              <Text style={styles.planCardText}>
                If {matchedPlan.trigger.toLowerCase()}, then I will{' '}
                {matchedPlan.action.charAt(0).toLowerCase() +
                  matchedPlan.action.slice(1)}
                .
              </Text>
              <Text style={styles.planCardSub}>
                You wrote this on a calm day, for exactly this moment.
              </Text>
            </View>
          )}
          <View style={{ marginTop: spacing.xl }}>
            <PrimaryButton
              title={tagging.outcome === 'resisted' ? 'Log it as resisted' : 'Log it'}
              onPress={() => confirmLog(true)}
            />
            <GhostButton
              title="Skip the tag"
              onPress={() => confirmLog(false)}
            />
          </View>
        </View>
      )}

      {!tagging && flow === 'active' && tool === 'menu' && (
        <View>
          <View style={styles.headerArtFrameTall}>
            <Image
              source={sosShore}
              style={styles.artFill}
              resizeMode="cover"
              accessibilityLabel="Watercolor illustration of a calm shoreline at dawn, one wave receding"
            />
          </View>
          <Label color={colors.amber}>Craving toolkit</Label>
          <Display size={32} style={{ marginTop: spacing.xs }}>
            Pick your tool
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            A craving is a few minutes long. Each of these is built to get
            you through those minutes in a different way. All of them are
            free, always.
          </Body>

          {cravingPlans.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <Label style={{ marginBottom: spacing.sm }}>My plans</Label>
              {cravingPlans.map((p) => (
                <View key={p.id} style={styles.planRow}>
                  <Text style={styles.planTrigger}>{p.trigger}</Text>
                  <Text style={styles.planAction}>then I will {p.action.charAt(0).toLowerCase() + p.action.slice(1)}</Text>
                </View>
              ))}
            </View>
          )}

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

          {supportName && (
            <Pressable
              onPress={messageMyPerson}
              style={({ pressed }) => [
                styles.personRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}>
              <Text style={styles.toolTitle}>Message {supportName}</Text>
              <Text style={styles.toolDetail}>
                One tap opens a message that says it plainly: craving hard,
                keep me company for five minutes.
              </Text>
            </Pressable>
          )}

          <GhostButton title="Close" onPress={() => router.back()} />
        </View>
      )}

      {!tagging && flow === 'active' && tool === 'wave' && (
        <UrgeSurfWave
          onOutcome={onWaveOutcome}
          onBack={() => setTool('menu')}
        />
      )}

      {!tagging && flow === 'active' && tool === 'breathing' && (
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

      {!tagging && flow === 'active' && tool === 'urge' && (
        <View>
          <Label color={colors.amber}>Urge timer</Label>
          <Display size={30} style={{ marginTop: spacing.xs }}>
            Watch the clock run out on it
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
            Cravings crest and fade in about three minutes. Or try Ride the
            wave from the tools menu for the full five-minute version.
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

      {!tagging && flow === 'active' && tool === 'pledge' && (
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

      {!tagging && flow === 'active' && tool === 'why' && (
        <View>
          <View style={styles.headerArtFrame}>
            <Image
              source={supportLetter}
              style={styles.artFill}
              resizeMode="cover"
              accessibilityLabel="Watercolor illustration of a letter, a phone, and a cup of tea under lamplight"
            />
          </View>
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

      {!tagging && flow === 'resisted' && (
        <View style={styles.centerBlock}>
          <Label color={colors.pine}>Logged</Label>
          <Display size={34} style={{ marginTop: spacing.sm }}>
            That one is behind you
          </Display>
          <Body
            color={colors.inkMuted}
            style={{ marginTop: spacing.md, textAlign: 'center' }}>
            You faced a craving and it did not move you. It is in your
            journal, your resisted count just went up, and every one you
            log makes your patterns clearer. That is another vote for the
            person you are becoming.
          </Body>
          <View style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
            <PrimaryButton title="Back to my streak" onPress={() => router.back()} />
          </View>
        </View>
      )}

      {!tagging && flow === 'slipped' && rescueStep === 0 && (
        <View>
          <View style={styles.headerArtFrame}>
            <Image
              source={rescueLamp}
              style={styles.artFill}
              resizeMode="cover"
              accessibilityLabel="Watercolor illustration of the desk after rain, the lamp lit again, a fresh blank page"
            />
          </View>
          <Label color={colors.clay}>Rescue, step 1 of 3</Label>
          <Display size={32} style={{ marginTop: spacing.xs }}>
            A slip is data, not a verdict
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.md }}>
            One slip is a minute that went wrong, not a quit that failed.
            Most people who stay quit for good slipped on the way; what
            separated them was not perfection, it was what they did in the
            next ten minutes. That is what this is.
          </Body>
          <Body color={colors.ink} style={{ marginTop: spacing.md }}>
            Nothing about this erases you. The next screen shows your
            record, and it is all still there.
          </Body>
          <View style={{ marginTop: spacing.xl }}>
            <PrimaryButton
              title="Show me what is still mine"
              onPress={() => setRescueStep(1)}
            />
            <GhostButton title="Not now" onPress={() => router.back()} />
          </View>
        </View>
      )}

      {!tagging && flow === 'slipped' && rescueStep === 1 && (
        <View>
          <Label color={colors.clay}>Rescue, step 2 of 3</Label>
          <Display size={32} style={{ marginTop: spacing.xs }}>
            All of this is banked
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.md }}>
            Restarting the clock moves one number: the current streak.
            These totals count every attempt you have ever made, and they
            do not go down. Ever.
          </Body>
          <View style={styles.ledger}>
            <StatRow
              label="Money kept, all attempts"
              value={formatMoneyExact(lifetimeSaved)}
            />
            <StatRow
              label="Puffs avoided, all attempts"
              value={formatCount(lifetimePuffs)}
            />
            <StatRow
              label="Cravings resisted, all time"
              value={formatCount(resistedTotal)}
            />
            <StatRow
              label="Total time nicotine-free"
              value={`${Math.floor(lifetimeFree / 86400)} days`}
              last
            />
          </View>
          <View style={{ marginTop: spacing.xl }}>
            <PrimaryButton
              title="Plan for the moment that got me"
              onPress={() => setRescueStep(2)}
            />
          </View>
        </View>
      )}

      {!tagging && flow === 'slipped' && rescueStep === 2 && (
        <View>
          <Label color={colors.clay}>Rescue, step 3 of 3</Label>
          <Display size={32} style={{ marginTop: spacing.xs }}>
            One plan for next time
          </Display>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
            A slip usually means one situation had no plan yet. Give it
            one now, while it is fresh, and it joins your plans in SOS.
          </Body>

          {rescuePlan ? (
            <View style={styles.planCard}>
              <Label color={colors.amberBright}>Your new plan</Label>
              <Text style={styles.planCardText}>
                If {rescuePlan.trigger.toLowerCase()}, then I will{' '}
                {rescuePlan.action.charAt(0).toLowerCase() +
                  rescuePlan.action.slice(1)}
                .
              </Text>
            </View>
          ) : cravingPlans.length < 3 ? (
            <IfThenPlanForm
              submitLabel="Save this plan"
              onSubmit={(trigger, action) => setRescuePlan({ trigger, action })}
            />
          ) : (
            <Body color={colors.inkMuted}>
              You already carry three plans, the full set. You can swap one
              in Settings whenever you like.
            </Body>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <PrimaryButton
              title="Resume my quit"
              haptic="commit"
              onPress={() => finishRescue(true)}
            />
            {!rescuePlan && (
              <GhostButton
                title="Resume without adding a plan"
                onPress={() => finishRescue(false)}
              />
            )}
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
  headerArtFrame: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  headerArtFrameTall: {
    width: '100%',
    aspectRatio: 1 / 2,
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  toolRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  personRow: {
    backgroundColor: colors.pineSoft,
    borderWidth: 1,
    borderColor: colors.pine,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  planRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
    paddingVertical: 10,
  },
  planTrigger: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  planAction: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 2,
  },
  planCard: {
    backgroundColor: colors.pine,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  planCardText: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 28,
    color: colors.bg,
    marginTop: spacing.xs,
  },
  planCardSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.pineSoft,
    marginTop: spacing.xs,
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
  ledger: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
