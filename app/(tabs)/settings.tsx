import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

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
import { dailyCost, formatMoney } from '@/lib/calc';
import {
  cancelReminders,
  ensureNotificationPermission,
  scheduleReminders,
} from '@/lib/notifications';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme';
import type { DeviceType } from '@/types';

const DEVICE_OPTIONS: { value: DeviceType; label: string }[] = [
  { value: 'disposable', label: 'Disposables' },
  { value: 'pod', label: 'Pod system' },
  { value: 'refillable', label: 'Refillable tank' },
];

export default function Settings() {
  const plan = useStore((s) => s.plan);
  const updatePlan = useStore((s) => s.updatePlan);
  const resetAll = useStore((s) => s.resetAll);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);

  const [puffsText, setPuffsText] = useState<string | null>(null);
  const [unitsText, setUnitsText] = useState<string | null>(null);
  const [costText, setCostText] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [saved, setSaved] = useState(false);

  if (!plan) return null;

  const puffs = puffsText ?? String(plan.puffsPerDay);
  const units = unitsText ?? String(plan.unitsPerWeek);
  const cost = costText ?? String(plan.costPerUnit);

  const savePlan = () => {
    const p = parseInt(puffs, 10);
    const u = parseFloat(units);
    const c = parseFloat(cost);
    if (!(p > 0) || !(u > 0) || !(c > 0)) {
      Alert.alert('Check the numbers', 'Habit numbers must all be above zero.');
      return;
    }
    updatePlan({ puffsPerDay: p, unitsPerWeek: u, costPerUnit: c });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Milestone alerts depend on the quit date, not the numbers, but a
    // re-save is a cheap moment to keep schedules in sync.
    if (notificationsEnabled) {
      scheduleReminders({ ...plan, puffsPerDay: p, unitsPerWeek: u, costPerUnit: c });
    }
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setPickerMode(null);
    if (event.type === 'set' && selected) {
      const next = { ...plan, quitDate: selected.toISOString() };
      updatePlan({ quitDate: next.quitDate });
      if (notificationsEnabled) scheduleReminders(next);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Exhale could not get notification permission. You can allow it in your phone settings.',
        );
        return;
      }
      setNotificationsEnabled(true);
      await scheduleReminders(plan);
    } else {
      setNotificationsEnabled(false);
      await cancelReminders();
    }
  };

  const confirmResetAll = () => {
    Alert.alert(
      'Reset everything?',
      'This permanently deletes your plan, streak, journal, and craving history from this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete it all',
          style: 'destructive',
          onPress: async () => {
            await cancelReminders();
            resetAll();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Display size={32}>Settings</Display>

      <Label style={styles.sectionLabel}>Your habit baseline</Label>
      <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
        These numbers drive the savings math. Right now they add up to about{' '}
        {formatMoney(dailyCost(plan))} a day.
      </Body>
      <View style={styles.chipRow}>
        {DEVICE_OPTIONS.map((d) => (
          <Chip
            key={d.value}
            label={d.label}
            selected={plan.deviceType === d.value}
            onPress={() => updatePlan({ deviceType: d.value })}
          />
        ))}
      </View>
      <Field
        label="Puffs per day"
        value={puffs}
        onChangeText={setPuffsText}
        keyboardType="number-pad"
      />
      <Field
        label="Pods or devices per week"
        value={units}
        onChangeText={setUnitsText}
        keyboardType="decimal-pad"
      />
      <Field
        label="Cost per pod or device (USD)"
        value={cost}
        onChangeText={setCostText}
        keyboardType="decimal-pad"
      />
      <PrimaryButton title={saved ? 'Saved' : 'Save habit numbers'} onPress={savePlan} />

      <Label style={styles.sectionLabel}>Quit date</Label>
      <Body color={colors.inkMuted}>
        Currently set to{' '}
        {new Date(plan.quitDate).toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
        . Changing it recalculates your streak and milestones.
      </Body>
      <View style={styles.pickerButtons}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <GhostButton title="Change date" onPress={() => setPickerMode('date')} />
        </View>
        <View style={{ flex: 1 }}>
          <GhostButton title="Change time" onPress={() => setPickerMode('time')} />
        </View>
      </View>
      {pickerMode && (
        <DateTimePicker
          value={new Date(plan.quitDate)}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={onPickerChange}
        />
      )}
      {Platform.OS === 'ios' && pickerMode && (
        <GhostButton title="Done" onPress={() => setPickerMode(null)} />
      )}

      <Label style={styles.sectionLabel}>Reminders</Label>
      <View style={styles.toggleRow}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={styles.toggleTitle}>Daily check-in and milestones</Text>
          <Text style={styles.toggleDetail}>
            A 9 AM check-in plus an alert when each health milestone lands.
            Stored and scheduled on this phone only.
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ true: colors.pine, false: colors.lineStrong }}
          thumbColor={colors.surface}
        />
      </View>

      <Label style={styles.sectionLabel}>Exhale Plus</Label>
      <GhostButton
        title="See what Plus will include"
        onPress={() => router.push('/paywall')}
      />

      <Label style={styles.sectionLabel}>About</Label>
      <GhostButton title="About Exhale" onPress={() => router.push('/about')} />

      <Label style={styles.sectionLabel}>Danger zone</Label>
      <GhostButton title="Reset all data" danger onPress={confirmResetAll} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  pickerButtons: { flexDirection: 'row', marginTop: spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    padding: spacing.md,
  },
  toggleTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  toggleDetail: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    marginTop: 3,
  },
});
