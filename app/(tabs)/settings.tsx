import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import FlavourPicker from '@/components/FlavourPicker';
import IfThenPlanForm from '@/components/IfThenPlanForm';
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
import MaxWidth from '@/components/MaxWidth';
import { dailyCost, formatMoney } from '@/lib/calc';
import { planFlavours } from '@/lib/flavours';
import {
  cancelReminders,
  ensureNotificationPermission,
  refreshAllNotifications,
} from '@/lib/notifications';
import { MAX_CRAVING_PLANS } from '@/lib/plans';
import { REASON_OPTIONS } from '@/lib/reasons';
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
  const savingsGoal = useStore((s) => s.savingsGoal);
  const setSavingsGoal = useStore((s) => s.setSavingsGoal);
  const cravingPlans = useStore((s) => s.cravingPlans);
  const addCravingPlan = useStore((s) => s.addCravingPlan);
  const removeCravingPlan = useStore((s) => s.removeCravingPlan);
  const supportName = useStore((s) => s.supportName);
  const setSupportName = useStore((s) => s.setSupportName);
  const notificationPrefs = useStore((s) => s.notificationPrefs);
  const setNotificationPrefs = useStore((s) => s.setNotificationPrefs);

  const [puffsText, setPuffsText] = useState<string | null>(null);
  const [unitsText, setUnitsText] = useState<string | null>(null);
  const [costText, setCostText] = useState<string | null>(null);
  const [nicotineText, setNicotineText] = useState<string | null>(null);
  const [flavoursSel, setFlavoursSel] = useState<string[] | null>(null);
  const [customFlavour, setCustomFlavour] = useState('');
  const [goalNameText, setGoalNameText] = useState<string | null>(null);
  const [goalPriceText, setGoalPriceText] = useState<string | null>(null);
  const [goalSaved, setGoalSaved] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [saved, setSaved] = useState(false);
  const [supportText, setSupportText] = useState<string | null>(null);
  const [supportSaved, setSupportSaved] = useState(false);
  const [reasonsSel, setReasonsSel] = useState<string[] | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [reasonsSaved, setReasonsSaved] = useState(false);
  const [reminderPickerOpen, setReminderPickerOpen] = useState(false);

  if (!plan) return null;

  const puffs = puffsText ?? String(plan.puffsPerDay);
  const units = unitsText ?? String(plan.unitsPerWeek);
  const cost = costText ?? String(plan.costPerUnit);
  const nicotine = nicotineText ?? (plan.nicotineMg ? String(plan.nicotineMg) : '');
  const selectedFlavours = flavoursSel ?? planFlavours(plan);
  const savedFlavoursLine = planFlavours(plan).join(', ');

  const toggleFlavour = (f: string) =>
    setFlavoursSel((prev) => {
      const base = prev ?? planFlavours(plan);
      return base.includes(f) ? base.filter((x) => x !== f) : [...base, f];
    });

  const addCustomFlavour = () => {
    const text = customFlavour.trim();
    if (!text) return;
    if (!selectedFlavours.includes(text)) {
      setFlavoursSel([...selectedFlavours, text]);
    }
    setCustomFlavour('');
  };
  const goalName = goalNameText ?? (savingsGoal?.name ?? '');
  const goalPrice = goalPriceText ?? (savingsGoal ? String(savingsGoal.price) : '');

  const savePlan = () => {
    const p = parseInt(puffs, 10);
    const u = parseFloat(units);
    const c = parseFloat(cost);
    if (!(p > 0) || !(u > 0) || !(c > 0)) {
      Alert.alert('Check the numbers', 'Habit numbers must all be above zero.');
      return;
    }
    const mg = parseFloat(nicotine);
    updatePlan({
      puffsPerDay: p,
      unitsPerWeek: u,
      costPerUnit: c,
      nicotineMg: mg > 0 ? mg : undefined,
      flavours: selectedFlavours.length > 0 ? selectedFlavours : undefined,
      // The library array is the single source of truth now; clear the
      // legacy single-flavour field so the two can never disagree.
      flavour: undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // A re-save is a cheap moment to keep every schedule in sync.
    if (notificationsEnabled) {
      refreshAllNotifications();
    }
  };

  const saveGoal = () => {
    const name = goalName.trim();
    const price = parseFloat(goalPrice);
    if (!name || !(price > 0)) {
      Alert.alert('Check the goal', 'Give the goal a name and a price above zero.');
      return;
    }
    setSavingsGoal({ name, price });
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2000);
  };

  const exportData = async () => {
    const s = useStore.getState();
    const payload = {
      app: 'Mistless',
      exportedAt: new Date().toISOString(),
      plan: s.plan,
      cravings: s.cravings,
      journal: s.journal,
      bestStreakSeconds: s.bestStreakSeconds,
      relapseCount: s.relapseCount,
      lifetime: {
        moneyBanked: s.lifetimeMoneyBanked,
        puffsBanked: s.lifetimePuffsBanked,
        unitsBanked: s.lifetimeUnitsBanked,
        freeSecondsBanked: s.lifetimeFreeSecondsBanked,
      },
      taperPuffs: s.taperPuffs,
      savingsGoal: s.savingsGoal,
      notificationsEnabled: s.notificationsEnabled,
      cravingPlans: s.cravingPlans,
      missionLog: s.missionLog,
      supportName: s.supportName,
      rescueCount: s.rescueCount,
      notificationPrefs: s.notificationPrefs,
    };
    try {
      await Share.share({
        title: 'Mistless data export',
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert(
        'Export failed',
        'Your phone could not open the share sheet. Your data is unchanged and still only on this device.',
      );
    }
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setPickerMode(null);
    if (event.type === 'set' && selected) {
      updatePlan({ quitDate: selected.toISOString() });
      if (notificationsEnabled) refreshAllNotifications();
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Mistless could not get notification permission. You can allow it in your phone settings.',
        );
        return;
      }
      setNotificationsEnabled(true);
      await refreshAllNotifications();
    } else {
      setNotificationsEnabled(false);
      await cancelReminders();
    }
  };

  const selectedReasons = reasonsSel ?? plan.reasons;

  const toggleReason = (r: string) =>
    setReasonsSel((prev) => {
      const base = prev ?? plan.reasons;
      return base.includes(r) ? base.filter((x) => x !== r) : [...base, r];
    });

  const addCustomReason = () => {
    const text = customReason.trim();
    if (!text) return;
    if (!selectedReasons.includes(text)) {
      setReasonsSel([...selectedReasons, text]);
    }
    setCustomReason('');
  };

  const saveReasons = () => {
    if (selectedReasons.length === 0) {
      Alert.alert(
        'Keep at least one reason',
        'Your reasons are what Mistless hands back to you on hard days.',
      );
      return;
    }
    updatePlan({ reasons: selectedReasons });
    setReasonsSaved(true);
    setTimeout(() => setReasonsSaved(false), 2000);
  };

  const saveSupport = () => {
    setSupportName(supportText ?? supportName);
    setSupportSaved(true);
    setTimeout(() => setSupportSaved(false), 2000);
  };

  const togglePref = (
    key: 'dangerWindow' | 'missionReminder' | 'savingsSweep',
    value: boolean,
  ) => {
    setNotificationPrefs({ [key]: value });
    if (notificationsEnabled) refreshAllNotifications();
  };

  const onReminderTimeChange = (
    event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (Platform.OS !== 'ios') setReminderPickerOpen(false);
    if (event.type === 'set' && selected) {
      setNotificationPrefs({
        missionReminderHour: selected.getHours(),
        missionReminderMinute: selected.getMinutes(),
      });
      if (notificationsEnabled) refreshAllNotifications();
    }
  };

  const confirmResetAll = () => {
    Alert.alert(
      'Reset everything?',
      'This permanently deletes your plan, streaks, lifetime totals, journal, and craving history from this phone.',
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
      <MaxWidth>
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
      <Field
        label="Nicotine strength (mg/mL, optional)"
        value={nicotine}
        onChangeText={setNicotineText}
        keyboardType="decimal-pad"
      />
      <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        Your flavours
      </Label>
      {savedFlavoursLine ? (
        <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
          On your plan right now: {savedFlavoursLine}.
        </Body>
      ) : (
        <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
          None picked yet. Add the ones you used, if you like.
        </Body>
      )}
      <FlavourPicker
        selected={selectedFlavours}
        onToggle={toggleFlavour}
        customText={customFlavour}
        onCustomTextChange={setCustomFlavour}
        onAddCustom={addCustomFlavour}
      />
      <PrimaryButton title={saved ? 'Saved' : 'Save habit numbers'} onPress={savePlan} />

      <Label style={styles.sectionLabel}>Savings goal</Label>
      <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
        Name the thing your kept money is buying. Your progress shows on
        Home and Stats, filled by the money you did not spend on vaping.
      </Body>
      <Field
        label="Saving toward"
        value={goalName}
        onChangeText={setGoalNameText}
        placeholder="e.g. New headphones"
      />
      <Field
        label="Price (USD)"
        value={goalPrice}
        onChangeText={setGoalPriceText}
        keyboardType="decimal-pad"
        placeholder="e.g. 180"
      />
      <PrimaryButton title={goalSaved ? 'Saved' : 'Save goal'} onPress={saveGoal} />
      {savingsGoal && (
        <GhostButton
          title="Remove goal"
          onPress={() => {
            setSavingsGoal(null);
            setGoalNameText('');
            setGoalPriceText('');
          }}
        />
      )}

      <Label style={styles.sectionLabel}>Your craving plans</Label>
      <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
        If-then plans, decided in a calm moment for the hard ones. Up to{' '}
        {MAX_CRAVING_PLANS}. They show up in SOS whenever you need them.
      </Body>
      {cravingPlans.map((p) => (
        <View key={p.id} style={styles.planManageRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.planManageText}>
              If {p.trigger.toLowerCase()}, then I will {p.action.toLowerCase()}.
            </Text>
          </View>
          <GhostButton
            title="Remove"
            danger
            onPress={() => removeCravingPlan(p.id)}
          />
        </View>
      ))}
      {cravingPlans.length < MAX_CRAVING_PLANS && (
        <IfThenPlanForm
          onSubmit={(trigger, action) => addCravingPlan(trigger, action)}
        />
      )}

      <Label style={styles.sectionLabel}>Your reasons</Label>
      <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
        Why you are done. These are the lines on your Note to Self, and the
        ones SOS hands back to you in a craving.
      </Body>
      <View style={styles.chipRow}>
        {REASON_OPTIONS.map((r) => (
          <Chip
            key={r}
            label={r}
            selected={selectedReasons.includes(r)}
            onPress={() => toggleReason(r)}
          />
        ))}
        {selectedReasons
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
      <PrimaryButton
        title={reasonsSaved ? 'Saved' : 'Save reasons'}
        onPress={saveReasons}
      />

      <Label style={styles.sectionLabel}>Your person</Label>
      <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
        One name for the SOS "Message my person" button. Mistless never
        contacts them on its own. The button only opens your messages app
        with a note ready to send.
      </Body>
      <Field
        label="Their name"
        value={supportText ?? supportName ?? ''}
        onChangeText={setSupportText}
        placeholder="e.g. Alex"
      />
      <PrimaryButton
        title={supportSaved ? 'Saved' : 'Save name'}
        onPress={saveSupport}
      />

      <Label style={styles.sectionLabel}>Your data</Label>
      <Body color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
        Everything lives on this phone. Export a copy of it all as JSON
        whenever you like; nothing leaves the device unless you share it.
      </Body>
      <GhostButton title="Export my data" onPress={exportData} />

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

      <Body color={colors.inkMuted} style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        Three more, tailored to your own patterns. They only fire while the
        master switch above is on.
      </Body>
      <View style={[styles.toggleRow, { marginBottom: spacing.sm }]}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={styles.toggleTitle}>Danger window heads-up</Text>
          <Text style={styles.toggleDetail}>
            Thirty minutes before your usual craving hour, once Mistless has
            seen one in your logs.
          </Text>
        </View>
        <Switch
          value={notificationPrefs.dangerWindow}
          onValueChange={(v) => togglePref('dangerWindow', v)}
          trackColor={{ true: colors.pine, false: colors.lineStrong }}
          thumbColor={colors.surface}
        />
      </View>
      <View style={[styles.toggleRow, { marginBottom: spacing.sm }]}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={styles.toggleTitle}>Morning mission reminder</Text>
          <Text style={styles.toggleDetail}>
            Today's one small mission, at{' '}
            {notificationPrefs.missionReminderHour % 12 === 0
              ? 12
              : notificationPrefs.missionReminderHour % 12}
            :{String(notificationPrefs.missionReminderMinute).padStart(2, '0')}{' '}
            {notificationPrefs.missionReminderHour < 12 ? 'AM' : 'PM'}.
          </Text>
        </View>
        <Switch
          value={notificationPrefs.missionReminder}
          onValueChange={(v) => togglePref('missionReminder', v)}
          trackColor={{ true: colors.pine, false: colors.lineStrong }}
          thumbColor={colors.surface}
        />
      </View>
      {notificationPrefs.missionReminder && (
        <>
          <GhostButton
            title="Change mission reminder time"
            onPress={() => setReminderPickerOpen(true)}
          />
          {reminderPickerOpen && (
            <DateTimePicker
              value={
                new Date(
                  2000,
                  0,
                  1,
                  notificationPrefs.missionReminderHour,
                  notificationPrefs.missionReminderMinute,
                )
              }
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onReminderTimeChange}
            />
          )}
          {Platform.OS === 'ios' && reminderPickerOpen && (
            <GhostButton
              title="Done"
              onPress={() => setReminderPickerOpen(false)}
            />
          )}
        </>
      )}
      <View style={styles.toggleRow}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={styles.toggleTitle}>Friday savings sweep</Text>
          <Text style={styles.toggleDetail}>
            Friday at 6 PM: what you kept this week, and a nudge to move it
            somewhere it works for you.
          </Text>
        </View>
        <Switch
          value={notificationPrefs.savingsSweep}
          onValueChange={(v) => togglePref('savingsSweep', v)}
          trackColor={{ true: colors.pine, false: colors.lineStrong }}
          thumbColor={colors.surface}
        />
      </View>

      <Label style={styles.sectionLabel}>Mistless Plus</Label>
      <GhostButton
        title="See what Plus will include"
        onPress={() => router.push('/paywall')}
      />

      <Label style={styles.sectionLabel}>About</Label>
      <GhostButton
        title="My plan reveal"
        onPress={() => router.push('/reveal?from=settings')}
      />
      <GhostButton
        title="Note to self"
        onPress={() => router.push('/note-to-self')}
      />
      <GhostButton title="About Mistless" onPress={() => router.push('/about')} />

      <Label style={styles.sectionLabel}>Danger zone</Label>
      <GhostButton title="Reset all data" danger onPress={confirmResetAll} />
    </MaxWidth>
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
  planManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  planManageText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
});
