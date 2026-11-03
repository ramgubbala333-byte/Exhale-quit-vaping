import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Display, GhostButton, Label, Screen } from '@/components/ui';
import { PLUS_OFFERINGS } from '@/services/revenuecat';
import { colors, fonts, radii, spacing } from '@/theme';

const PLUS_FEATURES = [
  'Deeper craving analytics: triggers, places, and patterns over time',
  'Personalised milestone plans and custom reminders',
  'Guided audio sessions for the hardest moments of the day',
  'Data export, so your record is always yours to keep',
];

/**
 * Exhale Plus paywall, dormant in v1. Nothing here can be bought:
 * monetization is deliberately switched off and the purchase layer in
 * src/services/revenuecat.ts is a stub. The screen exists so the shape
 * of the offer is designed now and wired later.
 */
export default function Paywall() {
  return (
    <Screen>
      <Label color={colors.amber}>Coming soon</Label>
      <Display size={34} style={{ marginTop: spacing.xs }}>
        Exhale Plus
      </Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        Exhale is completely free right now, and every feature in the app is
        already yours. Plus is a future layer for people who want to go
        deeper. Nothing is on sale today and nothing will ever be charged
        from this screen in this version.
      </Body>

      <View style={styles.featureList}>
        {PLUS_FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons
              name="checkmark"
              size={18}
              color={colors.pine}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        Planned pricing
      </Label>
      {PLUS_OFFERINGS.map((o) => (
        <View key={o.id} style={styles.tierRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tierLabel}>{o.label}</Text>
            <Text style={styles.tierNote}>{o.note}</Text>
          </View>
          <Text style={styles.tierPrice}>{o.priceLabel}</Text>
        </View>
      ))}

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonText}>
          Subscriptions are not available yet
        </Text>
      </View>
      <GhostButton title="Back" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  featureList: { marginTop: spacing.lg },
  featureRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  featureText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    marginLeft: spacing.md,
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tierLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.ink,
  },
  tierNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  tierPrice: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.pine,
    marginLeft: spacing.md,
  },
  comingSoon: {
    backgroundColor: colors.amberSoft,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  comingSoonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.pineDeep,
  },
});
