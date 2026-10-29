import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Display, GhostButton, Label, Screen } from '@/components/ui';
import { dailyCost, formatMoney, formatMoneyExact } from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { colors, fonts, radii, spacing } from '@/theme';

/**
 * Mistless Plus paywall, DORMANT. Nothing here can be bought: the
 * purchase layer in src/services/revenuecat.ts is a stub and stays one
 * until monetization is approved. This screen is presentation prep:
 * the conversion anatomy is designed now so wiring later is trivial.
 *
 * Pricing lives in these constants until a real pricing decision lands.
 * Placeholder figures come from the category research (quit-vaping
 * apps cluster at $5.99-9.99 weekly, $29.99-59.99 yearly, $49.99-169.99
 * lifetime); they are illustrative, not a launch price list.
 */
const PRICE_MONTHLY = 9.99;
const PRICE_YEARLY = 39.99;
const PRICE_LIFETIME = 59.99;

/** Headline capabilities, bolded first. The rest follow plain. */
const PLUS_HEADLINES = [
  'Advanced pattern reports',
  'Widget pack for your home screen',
  'Plan coaching stack: guided if-then reviews',
];
const PLUS_FEATURES = [
  'Deeper craving analytics: triggers, places, and patterns over time',
  'Guided audio sessions for the hardest moments of the day',
  'Personalised milestone plans and custom reminders',
  'Long-range pattern reports across months and years',
];

/** Product policy: these never move behind a paywall. */
const FREE_FOREVER = [
  'Quit counter and kept-money ledger',
  'The full SOS toolkit, wave included',
  'Lapse rescue, never a reset',
  'Health timeline and daily missions',
];

type BillingPeriod = 'monthly' | 'yearly';

export default function Paywall() {
  const plan = useStore((s) => s.plan);
  const cravings = useStore((s) => s.cravings);
  const [period, setPeriod] = useState<BillingPeriod>('yearly');

  const perDay = plan ? dailyCost(plan) : 0;
  const keptPerYear = perDay * 365;
  const resistedCount = cravings.filter((c) => c.outcome === 'resisted').length;
  const yearlyPerMonth = PRICE_YEARLY / 12;

  return (
    <Screen>
      <View style={styles.seal}>
        <Text style={styles.sealText}>Plus</Text>
      </View>
      <Label color={colors.amber} style={{ marginTop: spacing.md }}>
        Coming soon
      </Label>
      <Display size={34} style={{ marginTop: spacing.xs }}>
        Mistless Plus
      </Display>
      <Body color={colors.inkMuted} style={{ marginTop: spacing.sm }}>
        Mistless is completely free right now, and every feature in the app
        is already yours. Plus is a future layer for people who want to go
        deeper. Nothing is on sale today.
      </Body>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setPeriod('monthly')}
          style={[
            styles.toggleHalf,
            period === 'monthly' && styles.toggleHalfActive,
          ]}>
          <Text
            style={[
              styles.toggleText,
              period === 'monthly' && styles.toggleTextActive,
            ]}>
            Monthly
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPeriod('yearly')}
          style={[
            styles.toggleHalf,
            period === 'yearly' && styles.toggleHalfActive,
          ]}>
          <Text
            style={[
              styles.toggleText,
              period === 'yearly' && styles.toggleTextActive,
            ]}>
            Yearly
          </Text>
        </Pressable>
      </View>

      {period === 'monthly' ? (
        <View style={[styles.tierCard, styles.tierCardActive]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tierLabel}>Monthly</Text>
            <Text style={styles.tierNote}>Full flexibility, cancel anytime.</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.tierPrice}>{formatMoneyExact(PRICE_MONTHLY)}</Text>
            <Text style={styles.tierPer}>per month</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.tierCard, styles.tierCardActive]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tierLabel}>Yearly</Text>
            <Text style={styles.tierNote}>
              {formatMoneyExact(PRICE_YEARLY)} billed once a year.
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.tierStrike}>
              {formatMoneyExact(PRICE_MONTHLY)}/mo
            </Text>
            <Text style={styles.tierPrice}>
              {formatMoneyExact(yearlyPerMonth)}
              <Text style={styles.tierPer}> /mo</Text>
            </Text>
          </View>
        </View>
      )}

      <View style={styles.tierCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierLabel}>Lifetime</Text>
          <Text style={styles.tierNote}>One payment, yours for good.</Text>
        </View>
        <Text style={styles.tierPrice}>{formatMoneyExact(PRICE_LIFETIME)}</Text>
      </View>

      {plan && (
        <View style={styles.outcomeBlock}>
          <Label color={colors.amber} style={{ marginBottom: spacing.sm }}>
            In your numbers
          </Label>
          <Text style={styles.outcomeLine}>
            At your pace, you keep about {formatMoney(keptPerYear)} a year
            by not vaping. Plus exists to protect that: deeper patterns,
            earlier warnings, stronger plans.
          </Text>
          <Text style={styles.outcomeLine}>
            {resistedCount > 0
              ? `You have already ridden out ${resistedCount} craving${
                  resistedCount === 1 ? '' : 's'
                } with the free tools. Plus adds guided plans for the next ones.`
              : 'Every craving you ride out gets logged here, and Plus turns that history into guided plans for the next ones.'}
          </Text>
        </View>
      )}

      <Label style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        What Plus adds
      </Label>
      <View>
        {PLUS_HEADLINES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons
              name="checkmark"
              size={18}
              color={colors.pine}
              style={{ marginTop: 2 }}
            />
            <Text style={[styles.featureText, styles.featureHeadline]}>
              {f}
            </Text>
          </View>
        ))}
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
        Free forever, on purpose
      </Label>
      <View style={styles.freeBlock}>
        {FREE_FOREVER.map((f) => (
          <View key={f} style={styles.freeRow}>
            <Ionicons name="lock-open-outline" size={16} color={colors.pine} />
            <Text style={styles.freeText}>{f}</Text>
          </View>
        ))}
        <Text style={styles.freeNote}>
          The tools that carry a quit are never the ones we charge for.
        </Text>
      </View>

      <Text style={styles.reassure}>
        Cancel anytime. Keep your data either way.
      </Text>

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
  seal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    color: colors.pine,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.pill,
    padding: 4,
    marginTop: spacing.lg,
  },
  toggleHalf: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  toggleHalfActive: { backgroundColor: colors.pine },
  toggleText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  toggleTextActive: { color: colors.bg },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tierCardActive: { borderColor: colors.pine, borderWidth: 2 },
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
    fontSize: 19,
    color: colors.pine,
  },
  tierPer: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  tierStrike: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  outcomeBlock: {
    backgroundColor: colors.pineDeep,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  outcomeLine: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.bg,
    marginBottom: spacing.sm,
  },
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
  featureHeadline: {
    fontFamily: fonts.bodySemiBold,
    color: colors.pineDeep,
  },
  freeBlock: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  freeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  freeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
    marginLeft: spacing.sm,
  },
  freeNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  reassure: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.pineDeep,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  comingSoon: {
    backgroundColor: colors.amberSoft,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  comingSoonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.pineDeep,
  },
});
