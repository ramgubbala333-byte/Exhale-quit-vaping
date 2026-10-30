import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import FlavourPicker from '@/components/FlavourPicker';
import IfThenPlanForm from '@/components/IfThenPlanForm';
import MistVeil from '@/components/MistVeil';
import {
  Body,
  Chip,
  Display,
  Field,
  GhostButton,
  Label,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { formatDate, taperBudgetForWeek, taperZeroDate } from '@/lib/calc';
import { REASON_OPTIONS } from '@/lib/reasons';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

const welcomeMist = require('../assets/illustrations/01-welcome-mist.jpg');
import type { DeviceType, Plan, QuitApproach } from '@/types';

/**
 * Onboarding, rebuilt as a short sentence-style flow (owner-directed,
 * modelled on the intro flow he praised): three steps, each a sentence
 * the user completes, then the Plan Reveal does the celebrating.
 *   1. Name + quit moment: "Hi, my name is ___ / I quit vaping on ___"
 *   2. The habit sentence: device, pace, price, plus the details.
 *   3. The plan: approach, reasons, one if-then plan.
 * Everything downstream needs is still collected here and lands in the
 * same Plan shape as before; the only new field is the optional name.
 */

const DEVICE_OPTIONS: {
  value: DeviceType;
  chip: string;
  noun: string;
  unit: string;
}[] = [
  { value: 'disposable', chip: 'Disposable', noun: 'disposable', unit: 'device' },
  { value: 'pod', chip: 'Pod system', noun: 'pod', unit: 'pod' },
  { value: 'refillable', chip: 'Refill bottle', noun: 'bottle of liquid', unit: 'bottle' },
];

const CUT_OPTIONS = [10, 20, 25, 33, 50];

const STEPS = ['Welcome', 'Your habit', 'Your plan'];

type PickerState = { which: 'quit' | 'target'; mode: 'date' | 'time' } | null;

export default function Onboarding() {
  const setPlan = useStore((s) => s.setPlan);
  const addCravingPlan = useStore((s) => s.addCravingPlan);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [quitDate, setQuitDate] = useState(() => new Date());
  const [deviceType, setDeviceType] = useState<DeviceType>('disposable');
  const [daysText, setDaysText] = useState('');
  const [puffsText, setPuffsText] = useState('');
  const [costText, setCostText] = useState('');
  const [nicotineText, setNicotineText] = useState('');
  const [deviceSizeText, setDeviceSizeText] = useState('');
  const [puffsPerDeviceText, setPuffsPerDeviceText] = useState('');
  const [flavours, setFlavours] = useState<string[]>([]);
  const [customFlavour, setCustomFlavour] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showFlavours, setShowFlavours] = useState(false);
  const [approach, setApproach] = useState<QuitApproach>('now');
  const [cutPercent, setCutPercent] = useState(25);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [planDraft, setPlanDraft] = useState<{
    trigger: string;
    action: string;
  } | null>(null);

  const device =
    DEVICE_OPTIONS.find((d) => d.value === deviceType) ?? DEVICE_OPTIONS[0];

  const habit = useMemo(() => {
    const puffs = parseInt(puffsText, 10);
    const days = parseFloat(daysText);
    const cost = parseFloat(costText);
    if (!(puffs > 0) || !(days > 0) || !(cost > 0)) return null;
    // The sentence collects a pace ("one device every 5 days"); the
    // plan stores the equivalent units-per-week the math runs on.
    return { puffs, unitsPerWeek: 7 / days, cost };
  }, [puffsText, daysText, costText]);

  /** Scratch plan used only to run the taper projection math. */
  const taperPreview = useMemo<Plan | null>(() => {
    if (!habit) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return {
      deviceType,
      puffsPerDay: habit.puffs,
      unitsPerWeek: habit.unitsPerWeek,
      costPerUnit: habit.cost,
      quitDate: start.toISOString(),
      reasons: [],
      createdAt: start.toISOString(),
      approach: 'taper',
      taper: {
        weeklyCutPercent: cutPercent,
        startDate: start.toISOString(),
        targetQuitDate: start.toISOString(),
      },
    };
  }, [habit, deviceType, cutPercent]);

  const zeroDate = useMemo(
    () => (taperPreview ? taperZeroDate(taperPreview) : null),
    [taperPreview],
  );

  /** The quit day for a taper: the user's pick, else the projected zero day. */
  const effectiveTarget = targetDate ?? zeroDate ?? new Date();

  const draft: Plan | null = useMemo(() => {
    if (!habit) return null;
    const nicotine = parseFloat(nicotineText);
    const sizeMl = parseFloat(deviceSizeText);
    const perDevice = parseInt(puffsPerDeviceText, 10);
    const trimmedName = name.trim();
    const base: Plan = {
      userName: trimmedName ? trimmedName : undefined,
      deviceType,
      puffsPerDay: habit.puffs,
      unitsPerWeek: habit.unitsPerWeek,
      costPerUnit: habit.cost,
      quitDate: quitDate.toISOString(),
      reasons,
      createdAt: new Date().toISOString(),
      nicotineMg: nicotine > 0 ? nicotine : undefined,
      deviceSizeMl: sizeMl > 0 ? sizeMl : undefined,
      puffsPerDevice: perDevice > 0 ? perDevice : undefined,
      flavours: flavours.length > 0 ? flavours : undefined,
      approach,
    };
    if (approach === 'taper') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      base.taper = {
        weeklyCutPercent: cutPercent,
        startDate: start.toISOString(),
        targetQuitDate: effectiveTarget.toISOString(),
      };
      // Until the taper flips, the quit clock is anchored to the quit day.
      base.quitDate = effectiveTarget.toISOString();
    }
    return base;
  }, [
    habit,
    name,
    deviceType,
    quitDate,
    reasons,
    nicotineText,
    deviceSizeText,
    puffsPerDeviceText,
    flavours,
    approach,
    cutPercent,
    effectiveTarget,
  ]);

  const toggleReason = (r: string) =>
    setReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  const toggleFlavour = (f: string) =>
    setFlavours((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const addCustomFlavour = () => {
    const text = customFlavour.trim();
    if (!text) return;
    if (!flavours.includes(text)) setFlavours((prev) => [...prev, text]);
    setCustomFlavour('');
  };

  const addCustomReason = () => {
    const text = customReason.trim();
    if (!text) return;
    if (!reasons.includes(text)) setReasons((prev) => [...prev, text]);
    setCustomReason('');
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!picker) return;
    const which = picker.which;
    const mode = picker.mode;
    if (Platform.OS === 'ios') {
      if (event.type === 'set' && selected) {
        if (which === 'quit') setQuitDate(selected);
        else setTargetDate(selected);
      }
      return;
    }
    // Android: the dialog closes after each pick, so chain date -> time
    // for the quit moment to keep it a single gesture.
    setPicker(null);
    if (event.type !== 'set' || !selected) return;
    if (which === 'quit') {
      setQuitDate(selected);
      if (mode === 'date') {
        setTimeout(() => setPicker({ which: 'quit', mode: 'time' }), 50);
      }
    } else {
      setTargetDate(selected);
    }
  };

  const canContinue =
    step === 1 ? habit !== null : step === 2 ? reasons.length > 0 : true;

  const finish = () => {
    if (!draft) return;
    if (draft.reasons.length === 0) {
      Alert.alert(
        'Add a reason',
        'Pick at least one reason to come back to on hard days.',
      );
      return;
    }
    setPlan(draft);
    if (planDraft) addCravingPlan(planDraft.trigger, planDraft.action);
    router.replace('/reveal');
  };

  return (
    <View style={{ flex: 1 }}>
      <MistVeil progress={step / (STEPS.length - 1)} />
      <Screen>
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressSegment,
                { backgroundColor: i <= step ? colors.pine : colors.line },
              ]}
            />
          ))}
        </View>
        <Label style={{ marginBottom: spacing.xs }}>{STEPS[step]}</Label>

        {step === 0 && (
          <View>
            <View style={styles.welcomeArtFrame}>
              <Image
                source={welcomeMist}
                style={styles.artFill}
                resizeMode="cover"
                accessibilityLabel="Watercolor illustration of morning mist thinning at a window"
              />
            </View>
            <Display size={34} style={{ marginBottom: spacing.md }}>
              Ready to break up with your vape? 👋
            </Display>
            <Body size={16} color={colors.inkMuted}>
              Good. Mistless is the calm companion for it: your streak, the
              money you keep, your health coming back, and a plan for the
              craving moments. Everything stays on this phone. No account,
              no feed, no noise.
            </Body>
            <Body size={16} color={colors.inkMuted} style={{ marginTop: spacing.md }}>
              Setting up takes a minute. Two sentences and we begin.
            </Body>

            <Text style={styles.sentenceLabel}>Hi, my name is</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="words"
              returnKeyType="done"
              style={styles.pillInput}
            />

            <Text style={styles.sentenceLabel}>I quit vaping on</Text>
            <Pressable
              onPress={() => setPicker({ which: 'quit', mode: 'date' })}
              style={({ pressed }) => [
                styles.pill,
                { opacity: pressed ? 0.75 : 1 },
              ]}>
              <Text style={styles.pillText}>{momentLabel(quitDate)}</Text>
            </Pressable>
            <Body size={13} color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
              Tap to set the moment of your last puff. Quitting right now?
              Leave it exactly as it is.
            </Body>
          </View>
        )}

        {step === 1 && (
          <View>
            <Display size={30} style={{ marginBottom: spacing.sm }}>
              The old habit, honestly
            </Display>
            <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
              Rough numbers are fine. They power your savings and milestone
              math, and you can edit them later.
            </Body>

            <Text style={styles.sentenceLabel}>
              I used to go through an entire
            </Text>
            <View style={styles.chipRow}>
              {DEVICE_OPTIONS.map((d) => (
                <Chip
                  key={d.value}
                  label={d.chip}
                  selected={deviceType === d.value}
                  onPress={() => setDeviceType(d.value)}
                />
              ))}
            </View>
            <View style={styles.sentenceRow}>
              <Text style={styles.sentenceLabelInline}>every</Text>
              <TextInput
                value={daysText}
                onChangeText={setDaysText}
                placeholder="5"
                placeholderTextColor={colors.inkFaint}
                keyboardType="decimal-pad"
                style={styles.daysInput}
              />
              <Text style={styles.sentenceLabelInline}>days</Text>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <Field
                label={`I was paying, per ${device.noun} (USD)`}
                value={costText}
                onChangeText={setCostText}
                keyboardType="decimal-pad"
                placeholder="e.g. 30"
              />
              <Field
                label="Puffs per day (roughly)"
                value={puffsText}
                onChangeText={setPuffsText}
                keyboardType="number-pad"
                placeholder="e.g. 300"
              />
              <Field
                label="Nicotine strength (mg/mL, optional)"
                value={nicotineText}
                onChangeText={setNicotineText}
                keyboardType="decimal-pad"
                placeholder="e.g. 50 (most disposables), 20, 3"
              />
              {(daysText !== '' || costText !== '' || puffsText !== '') &&
              habit === null ? (
                <Text style={styles.errorText}>
                  Fill in the pace, the price, and your puffs per day, all
                  above zero.
                </Text>
              ) : null}
            </View>

            <GhostButton
              title={
                showDetails
                  ? 'Hide the details'
                  : 'More details, if you know them (mL, puffs per device)'
              }
              onPress={() => setShowDetails((v) => !v)}
            />
            {showDetails && (
              <View>
                <Field
                  label={`Liquid per ${device.noun} (mL)`}
                  value={deviceSizeText}
                  onChangeText={setDeviceSizeText}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 13"
                />
                <Field
                  label={`Puffs per ${device.noun} (if it is printed on the box)`}
                  value={puffsPerDeviceText}
                  onChangeText={setPuffsPerDeviceText}
                  keyboardType="number-pad"
                  placeholder="e.g. 5000"
                />
              </View>
            )}

            <GhostButton
              title={
                showFlavours
                  ? 'Hide flavours'
                  : flavours.length > 0
                    ? `Your usual flavours (${flavours.length} picked) · edit`
                    : 'Add your usual flavours (optional)'
              }
              onPress={() => setShowFlavours((v) => !v)}
            />
            {showFlavours && (
              <View>
                <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
                  The ones that will call your name. Naming them now makes
                  them easier to spot, and refuse, later.
                </Body>
                <FlavourPicker
                  selected={flavours}
                  onToggle={toggleFlavour}
                  customText={customFlavour}
                  onCustomTextChange={setCustomFlavour}
                  onAddCustom={addCustomFlavour}
                />
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View>
            <Display size={30} style={{ marginBottom: spacing.sm }}>
              Your plan to stay quit
            </Display>
            <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
              Three quick things: how you quit, why, and one plan for the
              hard moment.
            </Body>

            <Label style={{ marginBottom: spacing.sm }}>
              Quit now, or cut down first?
            </Label>
            <View style={styles.chipRow}>
              <Chip
                label="Quit now"
                selected={approach === 'now'}
                onPress={() => setApproach('now')}
              />
              <Chip
                label="Cut down first"
                selected={approach === 'taper'}
                onPress={() => setApproach('taper')}
              />
            </View>

            {approach === 'now' && (
              <Body color={colors.inkMuted}>
                Cold turkey: your quit clock starts at the moment you set
                on the first screen, and every tracker runs from there.
              </Body>
            )}

            {approach === 'taper' && (
              <View>
                <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
                  A taper gives you a daily puff budget that shrinks every
                  week until it reaches zero, then the full quit begins.
                  You log puffs with one tap on the home screen.
                </Body>
                <Label style={{ marginBottom: spacing.sm }}>
                  Shrink the budget each week by
                </Label>
                <View style={styles.chipRow}>
                  {CUT_OPTIONS.map((c) => (
                    <Chip
                      key={c}
                      label={`${c}%`}
                      selected={cutPercent === c}
                      onPress={() => {
                        setCutPercent(c);
                        setTargetDate(null);
                      }}
                    />
                  ))}
                </View>
                {taperPreview && (
                  <View style={styles.summaryLedger}>
                    <SummaryLine
                      label="This week's budget"
                      value={`${taperBudgetForWeek(taperPreview, 0)} / day`}
                    />
                    <SummaryLine
                      label="Next week"
                      value={`${taperBudgetForWeek(taperPreview, 1)} / day`}
                    />
                    <SummaryLine
                      label="Budget reaches zero around"
                      value={zeroDate ? formatDate(zeroDate.toISOString()) : '—'}
                      last
                    />
                  </View>
                )}
                <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
                  Your quit day
                </Label>
                <Pressable
                  onPress={() => setPicker({ which: 'target', mode: 'date' })}
                  style={({ pressed }) => [
                    styles.pill,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <Text style={styles.pillText}>
                    {effectiveTarget.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </Pressable>
                <Body size={13} color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
                  Set to when your budget reaches zero. Tap to move it; if
                  the budget hits zero sooner, Mistless flips you to the
                  full quit automatically.
                </Body>
                {targetDate && (
                  <GhostButton
                    title="Use the projected zero day"
                    onPress={() => setTargetDate(null)}
                  />
                )}
              </View>
            )}

            <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
              Why I'm done ❤️
            </Label>
            <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
              Pick every reason that is true. On the hardest days, the app
              will hand these back to you.
            </Body>
            <View style={styles.chipRow}>
              {REASON_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  selected={reasons.includes(r)}
                  onPress={() => toggleReason(r)}
                />
              ))}
              {reasons
                .filter((r) => !REASON_OPTIONS.includes(r))
                .map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    selected
                    onPress={() => toggleReason(r)}
                  />
                ))}
            </View>
            <Field
              label="Add your own reason"
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="e.g. To be present for my daughter"
              returnKeyType="done"
              onSubmitEditing={addCustomReason}
            />
            <GhostButton title="Add this reason" onPress={addCustomReason} />

            <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
              One plan for the hard moment
            </Label>
            <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
              Cravings have favourite moments. Decide yours now, while you
              are calm, and future you can borrow the sentence. One is
              plenty to start; this step is skippable.
            </Body>
            {planDraft ? (
              <View style={styles.planRow}>
                <Text style={styles.planText}>
                  If {lowerFirst(planDraft.trigger)}, then I will{' '}
                  {lowerFirst(planDraft.action)}.
                </Text>
                <GhostButton
                  title="Remove it"
                  onPress={() => setPlanDraft(null)}
                />
              </View>
            ) : (
              <IfThenPlanForm
                submitLabel="Save my plan"
                onSubmit={(trigger, action) => setPlanDraft({ trigger, action })}
              />
            )}
          </View>
        )}

        {picker && (
          <DateTimePicker
            value={picker.which === 'quit' ? quitDate : effectiveTarget}
            mode={picker.mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={picker.which === 'quit' ? new Date() : undefined}
            minimumDate={picker.which === 'target' ? new Date() : undefined}
            onChange={onPickerChange}
          />
        )}
        {Platform.OS === 'ios' && picker && (
          <GhostButton title="Done" onPress={() => setPicker(null)} />
        )}

        <View style={styles.footer}>
          {step < 2 ? (
            <PrimaryButton
              title="Continue"
              disabled={!canContinue}
              onPress={() => setStep((s) => Math.min(2, s + 1))}
            />
          ) : (
            <PrimaryButton
              title="See my plan"
              disabled={!canContinue}
              haptic="commit"
              onPress={finish}
            />
          )}
          {step > 0 && (
            <GhostButton
              title="Back"
              onPress={() => setStep((s) => Math.max(0, s - 1))}
            />
          )}
        </View>
      </Screen>
    </View>
  );
}

/** "Today at 8:24 PM" for a moment today, like the reference flow. */
function momentLabel(d: Date): string {
  const now = new Date();
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (d.toDateString() === now.toDateString()) return `Today at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${time}`;
  }
  return `${d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })} at ${time}`;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function SummaryLine({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryLine, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeArtFrame: {
    width: '62%',
    alignSelf: 'center',
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
  progressRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginRight: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  sentenceLabel: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.pineDeep,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sentenceLabelInline: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.pineDeep,
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pillInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  pillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.pine,
  },
  daysInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.ink,
    width: 84,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.clay,
    marginTop: -spacing.sm,
  },
  summaryLedger: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  summaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
    marginRight: spacing.md,
  },
  summaryValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.pine,
  },
  footer: { marginTop: spacing.xl },
  planRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  planText: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 26,
    color: colors.pineDeep,
  },
});
