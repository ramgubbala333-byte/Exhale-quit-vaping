import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Body, Display, GhostButton, PrimaryButton, Screen } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { JournalKind } from '@/types';

const TITLES: Record<string, string> = {
  intention: 'Morning intention',
  reflection: 'Evening reflection',
};

export default function Note() {
  const addJournalEntry = useStore((s) => s.addJournalEntry);
  const params = useLocalSearchParams<{ prompt?: string; kind?: string }>();
  const kind: JournalKind =
    params.kind === 'intention' || params.kind === 'reflection'
      ? params.kind
      : 'note';
  const [text, setText] = useState(
    params.prompt ? `${params.prompt}\n\n` : '',
  );

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addJournalEntry(trimmed, kind);
    router.back();
  };

  return (
    <Screen>
      <Display size={30}>{TITLES[kind] ?? 'A note to future you'}</Display>
      <Body
        color={colors.inkMuted}
        style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        {kind === 'note'
          ? 'What is happening, what helped, what you want to remember on the next hard day.'
          : 'The prompt is already on the page. Answer it plainly, in a sentence or three; that is a complete entry.'}
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
