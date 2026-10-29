import { StyleSheet, Text, View } from 'react-native';

import AchievementsGrid from '@/components/AchievementsGrid';
import { Body, Display, Label, Screen } from '@/components/ui';
import { formatDateTime, formatDurationShort } from '@/lib/calc';
import { milestoneStates } from '@/lib/milestones';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme';

/** Health recovery timeline plus the achievements grid below it. */
export default function Milestones() {
  const plan = useStore((s) => s.plan);
  if (!plan) return null;

  const states = milestoneStates(plan);
  const reachedCount = states.filter((s) => s.reached).length;

  return (
    <Screen>
      <Display size={32}>The road back</Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        How the body recovers after the last puff. This is general wellness
        information, not medical advice. {reachedCount} of {states.length}{' '}
        milestones reached.
      </Body>

      <View style={styles.timeline}>
        {states.map((m, i) => (
          <View key={m.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  {
                    backgroundColor: m.reached ? colors.pine : colors.surface,
                    borderColor: m.reached ? colors.pine : colors.lineStrong,
                  },
                ]}>
                {m.reached && <Text style={styles.nodeCheck}>✓</Text>}
              </View>
              {i < states.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: m.reached
                        ? colors.pine
                        : colors.line,
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.rowBody}>
              <Label color={m.reached ? colors.pine : colors.inkFaint}>
                {m.label}
              </Label>
              <Text style={styles.rowTitle}>{m.title}</Text>
              <Text style={styles.rowDesc}>{m.description}</Text>
              <Text style={styles.rowMeta}>
                {m.reached
                  ? `Reached ${formatDateTime(m.at)}`
                  : `In ${formatDurationShort(m.remainingSeconds)} · ${formatDateTime(m.at)}`}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <AchievementsGrid />
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeline: { marginTop: spacing.xl },
  row: { flexDirection: 'row' },
  rail: { alignItems: 'center', width: 28, marginRight: spacing.md },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCheck: {
    color: colors.bg,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    lineHeight: 14,
  },
  connector: { width: 2, flex: 1, minHeight: 30, marginVertical: 4 },
  rowBody: { flex: 1, paddingBottom: spacing.xl },
  rowTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
    marginTop: 3,
  },
  rowDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: 4,
  },
  rowMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.amber,
    marginTop: 6,
  },
});
