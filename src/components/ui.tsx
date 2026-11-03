import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { haptics } from '../lib/haptics';
import { colors, fonts, gradients, radii, spacing } from '../theme';

/**
 * Page shell: pale lavender field with a soft pastel wash at the top,
 * safe areas, consistent horizontal padding. Content sits in white
 * cards on the tinted field (PulseBuddy separation: tint + spacing,
 * minimal shadow).
 */
export function Screen({
  children,
  scroll = true,
  padBottom,
  gradientBg,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Extra bottom room (tab screens clear the floating pill nav). */
  padBottom?: number;
  /** Full-bleed pastel gradient background (onboarding pattern). */
  gradientBg?: readonly [string, string];
}) {
  const inner = (
    <View
      style={[
        styles.screenInner,
        padBottom !== undefined && { paddingBottom: padBottom },
      ]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView
      style={[
        styles.safe,
        gradientBg && { backgroundColor: 'transparent' },
      ]}
      edges={['top', 'left', 'right']}>
      {gradientBg ? (
        <LinearGradient
          colors={[...gradientBg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={styles.fullBg}
          pointerEvents="none"
        />
      ) : (
        <LinearGradient
          colors={[...gradients.calm]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topWash}
          pointerEvents="none"
        />
      )}
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

/** A white rounded card (20–28px radii) — the system's main surface. */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Display({
  children,
  size = 30,
  color = colors.ink,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: object;
}) {
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[
        {
          fontFamily: fonts.display,
          fontSize: size,
          color,
          lineHeight: size * 1.18,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Label({
  children,
  color = colors.inkMuted,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: object;
}) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.bodySemiBold,
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  size = 15,
  color = colors.ink,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: object;
}) {
  return (
    <Text
      style={[
        { fontFamily: fonts.body, fontSize: size, color, lineHeight: size * 1.45 },
        style,
      ]}>
      {children}
    </Text>
  );
}

/**
 * The primary action: a wide white-pill's inverse — a full pill in
 * periwinkle (the PulseBuddy primary action color). `tone="amber"`
 * gives the warm peach attention pill (SOS).
 */
export function PrimaryButton({
  title,
  onPress,
  tone = 'pine',
  disabled = false,
  haptic = 'tap',
}: {
  title: string;
  onPress?: () => void;
  tone?: 'pine' | 'amber';
  disabled?: boolean;
  /** Which word of the haptic vocabulary fires on press. */
  haptic?: 'tap' | 'commit' | 'success' | 'none';
}) {
  return (
    <Pressable
      onPress={() => {
        if (haptic === 'tap') haptics.tap();
        else if (haptic === 'commit') haptics.commit();
        else if (haptic === 'success') haptics.success();
        onPress?.();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            tone === 'amber' ? colors.amberBright : colors.pine,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

/** A wide WHITE pill button — the PulseBuddy CTA on tinted surfaces. */
export function WhiteButton({
  title,
  onPress,
  color = colors.ink,
}: {
  title: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        styles.whiteButton,
        { opacity: pressed ? 0.85 : 1 },
      ]}>
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </Pressable>
  );
}

/** Quiet text-level action, kept as a pill ghost for the new system. */
export function GhostButton({
  title,
  onPress,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostButton,
        { opacity: pressed ? 0.6 : 1 },
      ]}>
      <Text
        style={[
          styles.ghostButtonText,
          { color: danger ? colors.clay : colors.violetGray },
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Small white circular outline-icon button (header actions). */
export function CircleIconButton({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circleButton,
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name={icon} size={19} color={colors.ink} />
    </Pressable>
  );
}

/** The small green check: completed / logged, PulseBuddy-style. */
export function CheckBadge({ size = 20 }: { size?: number }) {
  return (
    <View
      style={[
        styles.checkBadge,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <Ionicons name="checkmark" size={size * 0.68} color={colors.white} />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.pineSoft : colors.surface,
          borderColor: selected ? colors.periwinkle : colors.line,
        },
      ]}>
      <Text
        style={[
          styles.chipText,
          { color: selected ? colors.violetGray : colors.ink },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  return (
    <View style={styles.fieldWrap}>
      <Label style={{ marginBottom: spacing.sm }}>{label}</Label>
      <TextInput
        placeholderTextColor={colors.inkFaint}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

/**
 * One small stat card for the three-across row under a hero: caption
 * on top, a big friendly number, a small gray unit line under.
 */
export function StatCard({
  label,
  value,
  sub,
  style,
}: {
  label: string;
  value: string;
  sub?: string;
  style?: object;
}) {
  return (
    <View style={[styles.statCard, style]}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <Text maxFontSizeMultiplier={1.2} style={styles.statCardValue}>
        {value}
      </Text>
      {sub ? <Text style={styles.statCardSub}>{sub}</Text> : null}
    </View>
  );
}

/** A ledger-style stat row with a hairline divider, used in lists. */
export function StatRow({
  label,
  value,
  detail,
  last = false,
}: {
  label: string;
  value: string;
  detail?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.statRow, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        {detail ? <Text style={styles.statDetail}>{detail}</Text> : null}
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    opacity: 0.75,
  },
  fullBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: { flexGrow: 1 },
  screenInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  button: {
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteButton: { backgroundColor: colors.white },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.2,
  },
  ghostButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  checkBadge: {
    backgroundColor: colors.check,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  fieldWrap: { marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm + 4,
  },
  statCardLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  statCardValue: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
    marginTop: 4,
  },
  statCardSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  statLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  statDetail: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.violetGray,
  },
});
