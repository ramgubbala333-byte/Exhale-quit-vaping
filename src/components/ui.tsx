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
import { colors, fonts, radii, spacing } from '../theme';

/** Page shell: warm background, safe areas, consistent horizontal padding. */
export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const inner = <View style={styles.screenInner}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
        { fontFamily: fonts.display, fontSize: size, color, lineHeight: size * 1.15 },
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
          letterSpacing: 1.4,
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
          { color: danger ? colors.clay : colors.pine },
        ]}>
        {title}
      </Text>
    </Pressable>
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
          backgroundColor: selected ? colors.pine : colors.surface,
          borderColor: selected ? colors.pine : colors.lineStrong,
        },
      ]}>
      <Text
        style={[
          styles.chipText,
          { color: selected ? colors.bg : colors.ink },
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

/** A ledger-style stat row with a hairline divider, used instead of card grids. */
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
  scrollContent: { flexGrow: 1 },
  screenInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.bg,
    letterSpacing: 0.3,
  },
  ghostButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  fieldWrap: { marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
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
    fontSize: 20,
    color: colors.pine,
  },
});
