import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ArtPlate from '@/components/ArtPlate';
import MaxWidth from '@/components/MaxWidth';
import {
  Body,
  CheckBadge,
  Display,
  Label,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { promptForSlot, type PromptSlot } from '@/lib/prompts';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { JournalEntry, JournalKind } from '@/types';

const journalTea = require('../../assets/illustrations/04-journal-tea.jpg');

const KIND_LABEL: Record<JournalKind, string> = {
  note: 'Note',
  resisted: 'Craving resisted',
  slip: 'Slip logged',
  reset: 'Clock restarted',
  intention: 'Morning intention',
  reflection: 'Evening reflection',
};

/** Small outline icon per entry kind, in a pale tinted circle. */
const KIND_ICON: Record<JournalKind, keyof typeof Ionicons.glyphMap> = {
  note: 'create-outline',
  resisted: 'shield-checkmark-outline',
  slip: 'water-outline',
  reset: 'refresh-outline',
  intention: 'sunny-outline',
  reflection: 'moon-outline',
};

/** Kinds that count as a completed/logged action get the green check. */
const KIND_CHECKED: Record<JournalKind, boolean> = {
  note: true,
  resisted: true,
  slip: false,
  reset: false,
  intention: true,
  reflection: true,
};

interface DayGroup {
  key: string;
  title: string;
  entries: JournalEntry[];
}

function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupByDay(entries: JournalEntry[]): DayGroup[] {
  const now = new Date();
  const todayKey = dayKeyOf(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKeyOf(yesterday);

  const groups = new Map<string, DayGroup>();
  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const key = dayKeyOf(d);
    if (!groups.has(key)) {
      const title =
        key === todayKey
          ? 'Today'
          : key === yesterdayKey
            ? 'Yesterday'
            : d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
      groups.set(key, { key, title, entries: [] });
    }
    groups.get(key)!.entries.push(entry);
  }
  return [...groups.values()];
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Journal() {
  const journal = useStore((s) => s.journal);
  const now = new Date();
  const hour = now.getHours();
  const morningActive = hour < 12;
  const eveningActive = hour >= 18;

  const groups = useMemo(() => groupByDay(journal), [journal]);

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
    <Screen padBottom={120}>
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
          <ArtPlate
            source={journalTea}
            aspect={0.5}
            widthPct={62}
            label="Watercolor illustration of an open journal and a cup of tea under lamplight"
          />
          <Text style={styles.emptyTitle}>Your story starts here</Text>
          <Body color={colors.inkMuted} style={{ textAlign: 'center' }}>
            Every craving you ride out lands here on its own. Or start
            now: one honest line about day one is a fine first entry.
          </Body>
        </View>
      ) : (
        <View style={{ paddingBottom: spacing.lg }}>
          {groups.map((group) => (
            <View key={group.key} style={styles.dayGroup}>
              <Text style={styles.dayHeader}>
                {group.title} — {group.entries.length} action
                {group.entries.length === 1 ? '' : 's'}
              </Text>
              <View style={styles.dayCard}>
                {group.entries.map((item, i) => (
                  <View
                    key={item.id}
                    style={[
                      styles.row,
                      i < group.entries.length - 1 && styles.rowDivider,
                    ]}>
                    <View style={styles.rowIcon}>
                      <Ionicons
                        name={KIND_ICON[item.kind]}
                        size={18}
                        color={colors.violetGray}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>
                        {KIND_LABEL[item.kind]}
                      </Text>
                      <Text style={styles.rowText} numberOfLines={2}>
                        {item.text}
                      </Text>
                    </View>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowTime}>
                        {timeLabel(item.timestamp)}
                      </Text>
                      {KIND_CHECKED[item.kind] ? (
                        <CheckBadge size={18} />
                      ) : (
                        <View style={styles.attentionDot} />
                      )}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.inkFaint}
                      style={{ marginLeft: spacing.xs }}
                    />
                  </View>
                ))}
              </View>
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
 * One journal bookend. In its hours it is a live prompt card in the
 * periwinkle gradient with a white pill action; outside them it rests
 * as a quiet row saying when it returns, so the ritual has edges
 * instead of nagging all day.
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
        { opacity: pressed ? 0.88 : 1 },
      ]}>
      <Label color={colors.violetGray}>{title}</Label>
      <Text style={styles.bookendPrompt}>{promptForSlot(slot, new Date())}</Text>
      <Text style={styles.bookendHint}>{activeHint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bookendCard: {
    backgroundColor: colors.pineSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bookendPrompt: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 27,
    color: colors.charcoal,
    marginTop: spacing.xs,
  },
  bookendHint: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.violetGray,
    marginTop: spacing.sm,
  },
  bookendQuiet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  bookendQuietTitle: {
    fontFamily: fonts.bodyBold,
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
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  dayGroup: { marginTop: spacing.md },
  dayHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.pineSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  rowText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    marginTop: 2,
  },
  rowMeta: { alignItems: 'flex-end', marginLeft: spacing.sm },
  rowTime: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
    marginBottom: 4,
  },
  attentionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amberBright,
    marginRight: 4,
  },
});
