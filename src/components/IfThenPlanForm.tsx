import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SUGGESTED_ACTIONS, TRIGGERS } from '../lib/plans';
import { colors, fonts, spacing } from '../theme';
import { Chip, Field, Label, PrimaryButton } from './ui';

/**
 * Builder for one if-then craving plan: pick the trigger, pick or
 * write the response, see the finished sentence, save it. Used in
 * onboarding, Settings, and the lapse-rescue flow. The parent owns the
 * list of plans; this form owns only its draft.
 */
export default function IfThenPlanForm({
  onSubmit,
  submitLabel = 'Save this plan',
}: {
  onSubmit: (trigger: string, action: string) => void;
  submitLabel?: string;
}) {
  const [trigger, setTrigger] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [customAction, setCustomAction] = useState('');

  const finalAction = customAction.trim() || action || '';
  const ready = !!trigger && finalAction.length > 0;

  const submit = () => {
    if (!trigger || !finalAction) return;
    onSubmit(trigger, finalAction);
    setTrigger(null);
    setAction(null);
    setCustomAction('');
  };

  return (
    <View>
      <Label style={{ marginBottom: spacing.sm }}>If this happens</Label>
      <View style={styles.chipRow}>
        {TRIGGERS.map((t) => (
          <Chip
            key={t}
            label={t}
            selected={trigger === t}
            onPress={() => setTrigger(t)}
          />
        ))}
      </View>

      <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        Then I will
      </Label>
      <View style={styles.chipRow}>
        {SUGGESTED_ACTIONS.map((a) => (
          <Chip
            key={a}
            label={a}
            selected={action === a && customAction.trim() === ''}
            onPress={() => {
              setAction(a);
              setCustomAction('');
            }}
          />
        ))}
      </View>
      <Field
        label="Or write your own response"
        value={customAction}
        onChangeText={setCustomAction}
        placeholder="e.g. Splash cold water on my face"
      />

      <Text style={styles.preview}>
        {ready
          ? `If ${lowerFirst(trigger!)}, then I will ${lowerFirst(finalAction)}.`
          : 'Your plan will read like a sentence you can say to yourself in the moment.'}
      </Text>

      <PrimaryButton
        title={submitLabel}
        disabled={!ready}
        onPress={submit}
      />
    </View>
  );
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  preview: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 26,
    color: colors.pineDeep,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
