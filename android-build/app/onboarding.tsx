import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

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
import { formatCount, formatMoney, projections } from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme';
import type { DeviceType, Plan } from '@/types';

const DEVICE_OPTIONS: { value: DeviceType; label: string; unit: string }[] = [
  { value: 'disposable', label: 'Disposables', unit: 'device' },
  { value: 'pod', label: 'Pod system', unit: 'pod' },
  { value: 'refillable', label: 'Refillable tank', unit: 'bottle of liquid' },
];

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

const STEPS = ['Welcome', 'Your habit', 'Quit moment', 'Your reasons', 'Your plan'];

export default function Onboarding() {
  const setPlan = useStore((s) => s.setPlan);

  const [step, setStep] = useState(0);
  const [deviceType, setDeviceType] = useState<DeviceType>('disposable');
  const [puffsText, setPuffsText] = useState('');
  const [unitsText, setUnitsText] = useState('');
  const [costText, setCostText] = useState('');
  const [quitDate, setQuitDate] = useState(() => new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');

  const unitLabel =
    DEVICE_OPTIONS.find((d) => d.value === deviceType)?.unit ?? 'pod';

  const draft: Plan | null = useMemo(() => {
    const puffs = parseInt(puffsText, 10);
    const units = parseFloat(unitsText);
    const cost = parseFloat(costText);
    if (!(puffs > 0) || !(units > 0) || !(cost > 0)) return null;
    return {
      deviceType,
      puffsPerDay: puffs,
      unitsPerWeek: units,
      costPerUnit: cost,
      quitDate: quitDate.toISOString(),
      reasons,
      createdAt: new Date().toISOString(),
    };
  }, [puffsText, unitsText, costText, deviceType, quitDate, reasons]);

  const proj = useMemo(() => (draft ? projections(draft) : null), [draft]);

  const toggleReason = (r: string) =>
    setReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  const addCustomReason = () => {
    const text = customReason.trim();
    if (!text) return;
    if (!reasons.includes(text)) setReasons((prev) => [...prev, text]);
    setCustomReason('');
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setPickerMode(null);
    if (event.type === 'set' && selected) {
      setQuitDate(selected);
    }
  };

  const canContinue =
    step === 0 ||
    (step === 1 && draft !== null) ||
    step === 2 ||
    (step === 3 && reasons.length > 0);

  const finish = () => {
    if (!draft) return;
    if (draft.reasons.length === 0) {
      Alert.alert('Add a reason', 'Pick at least one reason to come back to on hard days.');
      return;
    }
    setPlan(draft);
    router.replace('/(tabs)');
  };

  return (
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
          <Display size={42} style={{ marginBottom: spacing.md }}>
            Breathe out.{'\n'}For good.
          </Display>
          <Body size={16} color={colors.inkMuted}>
            Exhale is a calm companion for quitting vaping. It tracks your
            streak, the money you keep, and the health milestones ahead, and
            it talks you through cravings when they hit. Everything stays on
            this phone. No account, no feed, no noise.
          </Body>
          <Body size={16} color={colors.inkMuted} style={{ marginTop: spacing.md }}>
            Setting up takes a minute: your old habit, your quit moment, and
            your reasons.
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
          {step === 1 && puffsText !== '' && draft === null ? (
            <Text style={styles.errorText}>
              Fill in all three numbers with values above zero.
            </Text>
          ) : null}
        </View>
      )}

      {step === 2 && (
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
                onPress={() => setPickerMode('date')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Change time"
                tone="amber"
                onPress={() => setPickerMode('time')}
              />
            </View>
          </View>
          <GhostButton
            title="I am quitting right now"
            onPress={() => setQuitDate(new Date())}
          />

          {pickerMode && (
            <DateTimePicker
              value={quitDate}
              mode={pickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={onPickerChange}
            />
          )}
          {Platform.OS === 'ios' && pickerMode && (
            <GhostButton title="Done" onPress={() => setPickerMode(null)} />
          )}
        </View>
      )}

      {step === 3 && (
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

      {step === 4 && proj && draft && (
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
              last
            />
          </View>
          <Body color={colors.inkMuted} style={{ marginTop: spacing.lg }}>
            Your reasons: {draft.reasons.join(' · ')}
          </Body>
        </View>
      )}

      <View style={styles.footer}>
        {step < 4 ? (
          <PrimaryButton
            title={step === 0 ? 'Begin' : 'Continue'}
            disabled={!canContinue}
            onPress={() => setStep((s) => Math.min(4, s + 1))}
          />
        ) : (
          <PrimaryButton title="Start my quit" onPress={finish} />
        )}
        {step > 0 && (
          <GhostButton
            title="Back"
            onPress={() => setStep((s) => Math.max(0, s - 1))}
          />
        )}
      </View>
    </Screen>
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
});
