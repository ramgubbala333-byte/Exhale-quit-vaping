import { StyleSheet, View } from 'react-native';

import { FLAVOUR_CATEGORIES } from '../lib/flavours';
import { spacing } from '../theme';
import { Chip, Field, GhostButton, Label } from './ui';

/**
 * Multi-select flavour library: chips grouped by category, plus a
 * custom entry for anything the library missed. Selected customs stay
 * visible as removable chips above the groups.
 */
export default function FlavourPicker({
  selected,
  onToggle,
  customText,
  onCustomTextChange,
  onAddCustom,
}: {
  selected: string[];
  onToggle: (flavour: string) => void;
  customText: string;
  onCustomTextChange: (text: string) => void;
  onAddCustom: () => void;
}) {
  const known = new Set(FLAVOUR_CATEGORIES.flatMap((c) => c.flavours));
  const customs = selected.filter((f) => !known.has(f));

  return (
    <View>
      {customs.length > 0 && (
        <View style={styles.chipRow}>
          {customs.map((f) => (
            <Chip key={f} label={f} selected onPress={() => onToggle(f)} />
          ))}
        </View>
      )}
      {FLAVOUR_CATEGORIES.map((cat) => (
        <View key={cat.id} style={styles.group}>
          <Label style={{ marginBottom: spacing.sm }}>{cat.label}</Label>
          <View style={styles.chipRow}>
            {cat.flavours.map((f) => (
              <Chip
                key={f}
                label={f}
                selected={selected.includes(f)}
                onPress={() => onToggle(f)}
              />
            ))}
          </View>
        </View>
      ))}
      <Field
        label="Something else? Type it"
        value={customText}
        onChangeText={onCustomTextChange}
        placeholder="e.g. Blue razz lemonade"
        returnKeyType="done"
        onSubmitEditing={onAddCustom}
      />
      <GhostButton title="Add this flavour" onPress={onAddCustom} />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
});
