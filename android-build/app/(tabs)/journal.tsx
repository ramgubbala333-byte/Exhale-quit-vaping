import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Body, Display, PrimaryButton, Screen } from '@/components/ui';
import { formatDateTime } from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme';
import type { JournalKind } from '@/types';

const KIND_LABEL: Record<JournalKind, string> = {
  note: 'Note',
  resisted: 'Craving resisted',
  slip: 'Slip logged',
  reset: 'Clock restarted',
};

const KIND_COLOR: Record<JournalKind, string> = {
  note: colors.pine,
  resisted: colors.pine,
  slip: colors.clay,
  reset: colors.amber,
};

export default function Journal() {
  const journal = useStore((s) => s.journal);

  return (
    <Screen scroll={false}>
      <Display size={32}>Journal</Display>
      <Body
        color={colors.inkMuted}
        style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        Craving outcomes land here automatically. Add your own notes any
        time; future you will want the record.
      </Body>

      {journal.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Body color={colors.inkMuted} style={{ textAlign: 'center' }}>
            Your first resisted craving, or your first note, starts the
            journal.
          </Body>
        </View>
      ) : (
        <FlatList
          data={journal}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <View style={styles.entryHead}>
                <Text
                  style={[styles.kind, { color: KIND_COLOR[item.kind] }]}>
                  {KIND_LABEL[item.kind]}
                </Text>
                <Text style={styles.when}>
                  {formatDateTime(item.timestamp)}
                </Text>
              </View>
              <Text style={styles.entryText}>{item.text}</Text>
            </View>
          )}
        />
      )}

      <View style={{ paddingTop: spacing.md }}>
        <PrimaryButton
          title="Add a note"
          onPress={() => router.push('/note')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  entry: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  entryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  kind: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  when: { fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint },
  entryText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    marginTop: 4,
  },
});
