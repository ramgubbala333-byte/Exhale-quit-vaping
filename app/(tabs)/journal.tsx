import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import MaxWidth from '@/components/MaxWidth';
import { Body, Display, Label, PrimaryButton, Screen } from '@/components/ui';
import { formatDateTime } from '@/lib/calc';
import { promptForSlot, type PromptSlot } from '@/lib/prompts';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { JournalKind } from '@/types';

const journalTea = require('../../assets/illustrations/04-journal-tea.jpg');
const eveningReflection = require('../../assets/illustrations/06-evening-reflection.jpg');

const KIND_LABEL: Record<JournalKind, string> = {
  note: 'Note',
  resisted: 'Craving resisted',
  slip: 'Slip logged',
  reset: 'Clock restarted',
  intention: 'Morning intention',
  reflection: 'Evening reflection',
};

const KIND_COLOR: Record<JournalKind, string> = {
  note: colors.pine,
  resisted: colors.pine,
  slip: colors.clay,
  reset: colors.amber,
  intention: colors.amber,
  reflection: colors.pine,
};

export default function Journal() {
  const journal = useStore((s) => s.journal);
  const now = new Date();
  const hour = now.getHours();
  const morningActive = hour < 12;
  const eveningActive = hour >= 18;

  const openPrompt = (slot: PromptSlot) => {
    router.push({
      pathname: '/note',
      params: {
        prompt: promptForSlot(slot, now),
        kind: slot === 'morning' ? 'intention' : 'reflection',
      },
    });
  };

  return (
    <Screen>
      <MaxWidth>
      <Display size={32}>Journal</Display>
      <Body
        color={colors.inkMuted}
        style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        Craving outcomes land here automatically. Add your own notes any
        time; future you will want the record.
      </Body>

      <BookendRow
        slot="morning"
        title="Morning intention"
        active={morningActive}
        activeHint="Set the day before it sets you. Tap to write."
        quietText={
          hour >= 12
            ? 'The morning intention returns tomorrow.'
            : 'The morning intention is done for today.'
        }
        onPress={() => openPrompt('morning')}
      />
      <BookendRow
        slot="evening"
        title="Evening reflection"
        active={eveningActive}
        activeHint="Close the day honestly. Tap to write."
        quietText={
          hour < 18
            ? 'The evening reflection opens at 6 PM.'
            : 'The evening reflection returns tomorrow.'
        }
        onPress={() => openPrompt('evening')}
      />

      {journal.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyArtFrame}>
            <Image
              source={journalTea}
              style={styles.artFill}
              resizeMode="cover"
              accessibilityLabel="Watercolor illustration of an open journal and a cup of tea under lamplight"
            />
          </View>
          <Text style={styles.emptyTitle}>Your story starts here</Text>
          <Body color={colors.inkMuted} style={{ textAlign: 'center' }}>
            Every craving you ride out lands here on its own. Or start
            now: one honest line about day one is a fine first entry.
          </Body>
        </View>
      ) : (
        <View style={{ paddingBottom: spacing.lg }}>
          {journal.map((item) => (
            <View key={item.id} style={styles.entry}>
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
          ))}
        </View>
      )}

      <View style={{ paddingTop: spacing.md }}>
        <PrimaryButton
          title="Add a note"
          onPress={() => router.push('/note')}
        />
      </View>
    </MaxWidth>
    </Screen>
  );
}

/**
 * One journal bookend. In its hours it is a live prompt card; outside
 * them it rests as a quiet row saying when it returns, so the ritual
 * has edges instead of nagging all day.
 */
function BookendRow({
  slot,
  title,
  active,
  activeHint,
  quietText,
  onPress,
}: {
  slot: PromptSlot;
  title: string;
  active: boolean;
  activeHint: string;
  quietText: string;
  onPress: () => void;
}) {
  if (!active) {
    return (
      <View style={styles.bookendQuiet}>
        <Text style={styles.bookendQuietTitle}>{title}</Text>
        <Text style={styles.bookendQuietText}>{quietText}</Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bookendCard,
        { opacity: pressed ? 0.85 : 1 },
      ]}>
      {slot === 'evening' && (
        <View style={styles.bookendArtFrame}>
          <Image
            source={eveningReflection}
            style={styles.artFill}
            resizeMode="cover"
            accessibilityLabel="Watercolor illustration of the window at night, moon above, a closed journal on the sill"
          />
        </View>
      )}
      <Label color={colors.amberBright}>{title}</Label>
      <Text style={styles.bookendPrompt}>{promptForSlot(slot, new Date())}</Text>
      <Text style={styles.bookendHint}>{activeHint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bookendCard: {
    backgroundColor: colors.pine,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bookendArtFrame: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
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
  bookendPrompt: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 27,
    color: colors.bg,
    marginTop: spacing.xs,
  },
  bookendHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.pineSoft,
    marginTop: spacing.sm,
  },
  bookendQuiet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
    marginBottom: spacing.md,
  },
  bookendQuietTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  bookendQuietText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyArtFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
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
