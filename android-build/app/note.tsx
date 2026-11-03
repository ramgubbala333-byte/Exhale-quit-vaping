import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Body, Display, GhostButton, PrimaryButton, Screen } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

export default function Note() {
  const addJournalEntry = useStore((s) => s.addJournalEntry);
  const [text, setText] = useState('');

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addJournalEntry(trimmed, 'note');
    router.back();
  };

  return (
    <Screen>
      <Display size={30}>A note to future you</Display>
      <Body
        color={colors.inkMuted}
        style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        What is happening, what helped, what you want to remember on the
        next hard day.
      </Body>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write it plainly. Nobody sees this but you."
        placeholderTextColor={colors.inkFaint}
        multiline
        autoFocus
        style={styles.input}
        textAlignVertical="top"
      />
      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton
          title="Save note"
          disabled={text.trim().length === 0}
          onPress={save}
        />
        <GhostButton title="Cancel" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 160,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  },
});
