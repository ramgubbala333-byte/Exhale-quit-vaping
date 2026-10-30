import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';

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
import {
  formatCount,
  formatDate,
  formatMoney,
  projections,
  taperBudgetForWeek,
  taperZeroDate,
} from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

const welcomeMist = require('../assets/illustrations/01-welcome-mist.jpg');
import type { DeviceType, Plan, QuitApproach } from '@/types';

const DEVICE_OPTIONS: { value: DeviceType; label: string; unit: string }[] = [
  { value: 'disposable', label: 'Disposables', unit: 'device' },
  { value: 'pod', label: 'Pod system', unit: 'pod' },
  { value: 'refillable', label: 'Refillable tank', unit: 'bottle of liquid' },
];

const CUT_OPTIONS = [10, 20, 25, 33, 50];

const REASON_OPTIONS = [
  'My health',
  'The money',
  'My family',
  'Breathing easier',
  'Better focus',
  'For my kids',
  'I am tired of depending on it',
  'My fitness',
  'A fresh start',
];

const STEPS = [
  'Welcome',
  'Your habit',
  'Approach',
  'Quit moment',
  'Your reasons',
  'Craving plans',
  'Your plan',
];

type PickerState = { which: 'quit' | 'target'; mode: 'date' | 'time' } | null;

export default function Onboarding() {
  const setPlan = useStore((s) => s.setPlan);
  const addCravingPlan = useStore((s) => s.addCravingPlan);

  const [step, setStep] = useState(0);
  const [deviceType, setDeviceType] = useState<DeviceType>('disposable');
  const [puffsText, setPuffsText] = useState('');
  const [unitsText, setUnitsText] = useState('');
  const [costText, setCostText] = useState('');
  const [nicotineText, setNicotineText] = useState('');
  const [deviceSizeText, setDeviceSizeText] = useState('');
  const [puffsPerDeviceText, setPuffsPerDeviceText] = useState('');
  const [flavours, setFlavours] = useState<string[]>([]);
  const [customFlavour, setCustomFlavour] = useState('');
  const [approach, setApproach] = useState<QuitApproach>('now');
  const [cutPercent, setCutPercent] = useState(25);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [quitDate, setQuitDate] = useState(() => new Date());
  const [picker, setPicker] = useState<PickerState>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [planDrafts, setPlanDrafts] = useState<
    { trigger: string; action: string }[]
  >([]);

  const unitLabel =
    DEVICE_OPTIONS.find((d) => d.value === deviceType)?.unit ?? 'pod';

  const habit = useMemo(() => {
    const puffs = parseInt(puffsText, 10);
    const units = parseFloat(unitsText);
    const cost = parseFloat(costText);
    if (!(puffs > 0) || !(units > 0) || !(cost > 0)) return null;
    return { puffs, units, cost };
  }, [puffsText, unitsText, costText]);

  /** Scratch plan used only to run the taper projection math. */
  const taperPreview = useMemo<Plan | null>(() => {
    if (!habit) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return {
      deviceType,
      puffsPerDay: habit.puffs,
      unitsPerWeek: habit.units,
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
    const base: Plan = {
      deviceType,
      puffsPerDay: habit.puffs,
      unitsPerWeek: habit.units,
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

  const proj = useMemo(() => (draft ? projections(draft) : null), [draft]);

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
    if (Platform.OS !== 'ios') setPicker(null);
    if (event.type === 'set' && selected && picker) {
      if (picker.which === 'quit') setQuitDate(selected);
      else setTargetDate(selected);
    }
  };

  const canContinue =
    step === 1 ? habit !== null : step === 4 ? reasons.length > 0 : true;

  const finish = () => {
    if (!draft) return;
    if (draft.reasons.length === 0) {
      Alert.alert('Add a reason', 'Pick at least one reason to come back to on hard days.');
      return;
    }
    setPlan(draft);
    planDrafts.forEach((p) => addCravingPlan(p.trigger, p.action));
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
          <Display size={42} style={{ marginBottom: spacing.md }}>
            Breathe out.{'\n'}For good.
          </Display>
          <Body size={16} color={colors.inkMuted}>
            Mistless is a calm companion for quitting vaping. It tracks your
            streak, the money you keep, and the health milestones ahead, and
            it talks you through cravings when they hit. Everything stays on
            this phone. No account, no feed, no noise.
          </Body>
          <Body size={16} color={colors.inkMuted} style={{ marginTop: spacing.md }}>
            Setting up takes a minute: your old habit, how you want to quit,
            and your reasons.
          </Body>
        </View>
      )}

      {step === 1 && (
        <View>
          <Display size={30} style={{ marginBottom: spacing.sm }}>
            Your habit, honestly
          </Display>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
            Rough numbers are fine. They power your savings and milestone
            math, and you can edit them later.
          </Body>

          <Label style={{ marginBottom: spacing.sm }}>What did you use?</Label>
          <View style={styles.chipRow}>
            {DEVICE_OPTIONS.map((d) => (
              <Chip
                key={d.value}
                label={d.label}
                selected={deviceType === d.value}
                onPress={() => setDeviceType(d.value)}
              />
            ))}
          </View>

          <Field
            label="Puffs per day (roughly)"
            value={puffsText}
            onChangeText={setPuffsText}
            keyboardType="number-pad"
            placeholder="e.g. 300"
          />
          <Field
            label={`${capitalize(unitLabel)}s per week`}
            value={unitsText}
            onChangeText={setUnitsText}
            keyboardType="decimal-pad"
            placeholder="e.g. 4"
          />
          <Field
            label={`Cost per ${unitLabel} (USD)`}
            value={costText}
            onChangeText={setCostText}
            keyboardType="decimal-pad"
            placeholder="e.g. 15"
          />
          {puffsText !== '' && habit === null ? (
            <Text style={styles.errorText}>
              Fill in all three numbers with values above zero.
            </Text>
          ) : null}

          <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
            The details, if you know them (optional)
          </Label>
          <Field
            label="Nicotine strength (mg/mL)"
            value={nicotineText}
            onChangeText={setNicotineText}
            keyboardType="decimal-pad"
            placeholder="e.g. 50 (most disposables), 20, 3"
          />
          <Field
            label={`Liquid per ${unitLabel} (mL)`}
            value={deviceSizeText}
            onChangeText={setDeviceSizeText}
            keyboardType="decimal-pad"
            placeholder="e.g. 13"
          />
          <Field
            label={`Puffs per ${unitLabel} (if it is printed on the box)`}
            value={puffsPerDeviceText}
            onChangeText={setPuffsPerDeviceText}
            keyboardType="number-pad"
            placeholder="e.g. 5000"
          />

          <Label style={{ marginBottom: spacing.sm }}>
            Your usual flavours (pick any)
          </Label>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
            The ones that will call your name. Naming them now makes them
            easier to spot, and refuse, later.
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

      {step === 2 && (
        <View>
          <Display size={30} style={{ marginBottom: spacing.sm }}>
            How do you want to quit?
          </Display>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
            Both roads work. Pick the one you will actually stay on.
          </Body>

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
              Cold turkey: your quit clock starts at the moment you choose
              next, and every tracker runs from there.
            </Body>
          )}

          {approach === 'taper' && (
            <View>
              <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
                A taper gives you a daily puff budget that shrinks every
                week until it reaches zero, then the full quit begins. You
                log puffs with one tap on the home screen.
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
                    label="Week after"
                    value={`${taperBudgetForWeek(taperPreview, 2)} / day`}
                  />
                  <SummaryLine
                    label="Budget reaches zero around"
                    value={zeroDate ? formatDate(zeroDate.toISOString()) : '—'}
                    last
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {step === 3 && approach === 'now' && (
        <View>
          <Display size={30} style={{ marginBottom: spacing.sm }}>
            When did you quit?
          </Display>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
            Set the moment of your last puff. If you are quitting right now,
            leave it as is.
          </Body>

          <View style={styles.dateCard}>
            <Text style={styles.dateValue}>
              {quitDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.dateValue}>
              {quitDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.pickerButtons}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <PrimaryButton
                title="Change date"
                onPress={() => setPicker({ which: 'quit', mode: 'date' })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Change time"
                tone="amber"
                onPress={() => setPicker({ which: 'quit', mode: 'time' })}
              />
            </View>
          </View>
          <GhostButton
            title="I am quitting right now"
            onPress={() => setQuitDate(new Date())}
          />
        </View>
      )}

      {step === 3 && approach === 'taper' && (
        <View>
          <Display size={30} style={{ marginBottom: spacing.sm }}>
            Your quit day
          </Display>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
            This is the day the budget ends and the full quit begins. It is
            set to when your budget reaches zero; move it if you want a
            different day. If the budget hits zero sooner, Mistless flips you
            to the full quit automatically.
          </Body>

          <View style={styles.dateCard}>
            <Text style={styles.dateValue}>
              {effectiveTarget.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <PrimaryButton
            title="Change quit day"
            onPress={() => setPicker({ which: 'target', mode: 'date' })}
          />
          {targetDate && (
            <GhostButton
              title="Use the projected zero day"
              onPress={() => setTargetDate(null)}
            />
          )}
        </View>
      )}

      {step === 4 && (
        <View>
          <Display size={30} style={{ marginBottom: spacing.sm }}>
            Why are you quitting?
          </Display>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
            Pick every reason that is true. On the hardest days, the app will
            hand these back to you.
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
        </View>
      )}

      {step === 5 && (
        <View>
          <Display size={30} style={{ marginBottom: spacing.sm }}>
            Make your if-then plans
          </Display>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
            Cravings are not random; they have favourite moments. A plan
            made now, while you are calm, is the version of you that shows
            up later. Research on if-then planning is unusually clear:
            one or two specific plans beat five vague intentions. Build
            up to three.
          </Body>

          {planDrafts.map((p, i) => (
            <View key={i} style={styles.planRow}>
              <Text style={styles.planText}>
                If {p.trigger.toLowerCase()}, then I will{' '}
                {p.action.charAt(0).toLowerCase() + p.action.slice(1)}.
              </Text>
              <GhostButton
                title="Remove"
                onPress={() =>
                  setPlanDrafts((prev) => prev.filter((_, j) => j !== i))
                }
              />
            </View>
          ))}

          {planDrafts.length < 3 ? (
            <IfThenPlanForm
              submitLabel={
                planDrafts.length === 0 ? 'Save my first plan' : 'Add this plan'
              }
              onSubmit={(trigger, action) =>
                setPlanDrafts((prev) => [...prev, { trigger, action }])
              }
            />
          ) : (
            <Body color={colors.inkMuted}>
              Three plans is the full set. They will be waiting in SOS,
              and you can edit them any time in Settings.
            </Body>
          )}

          {planDrafts.length === 0 && (
            <Body color={colors.inkMuted} style={{ marginTop: spacing.lg }}>
              No plans yet is allowed, but even one makes the first hard
              moment easier. You can also add them later in Settings.
            </Body>
          )}
        </View>
      )}

      {step === 6 && proj && draft && (
        <View>
          <Display size={30} style={{ marginBottom: spacing.sm }}>
            Here is what quitting returns to you
          </Display>
          <Body color={colors.inkMuted} style={{ marginBottom: spacing.lg }}>
            Based on the habit you described, staying quit means roughly:
          </Body>
          <View style={styles.summaryLedger}>
            <SummaryLine
              label="Money kept, per month"
              value={formatMoney(proj.moneyPerMonth)}
            />
            <SummaryLine
              label="Money kept, per year"
              value={formatMoney(proj.moneyPerYear)}
            />
            <SummaryLine
              label={`${capitalize(unitLabel)}s not bought, per year`}
              value={formatCount(proj.unitsPerYear)}
            />
            <SummaryLine
              label="Puffs skipped, per year"
              value={formatCount(proj.puffsPerYear)}
              last={approach === 'now'}
            />
            {approach === 'taper' && draft.taper && (
              <SummaryLine
                label="Your quit day"
                value={formatDate(draft.taper.targetQuitDate)}
                last
              />
            )}
          </View>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.lg }}>
            Your reasons: {draft.reasons.join(' · ')}
          </Body>
          {draft.flavours && draft.flavours.length > 0 && (
            <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
              The flavours you are leaving behind: {draft.flavours.join(' · ')}
            </Body>
          )}
          {planDrafts.length > 0 && (
            <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
              Your if-then plans: {planDrafts.map((p) => p.trigger).join(' · ')}
            </Body>
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
        {step < 6 ? (
          <PrimaryButton
            title={step === 0 ? 'Begin' : 'Continue'}
            disabled={!canContinue}
            onPress={() => setStep((s) => Math.min(6, s + 1))}
          />
        ) : (
          <PrimaryButton
            title={approach === 'taper' ? 'Start my cut-down' : 'Start my quit'}
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
    <View
      style={[
        styles.summaryLine,
        last && { borderBottomWidth: 0 },
      ]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  welcomeArtFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
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
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.clay,
    marginTop: -spacing.sm,
  },
  dateCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  dateValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.pineDeep,
    lineHeight: 30,
  },
  pickerButtons: { flexDirection: 'row' },
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
