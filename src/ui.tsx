/**
 * NIRA - komponen UI dasar.
 *
 * Semua gaya mengikuti design language Telegram: satu aksen, hairline 1px,
 * radius kecil, transisi 200ms dengan opacity+transform saja.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { motion, palette, radius, shadow, spacing, type } from './theme';

/* -------------------------------------------------------------------- Icon */

/** Nama ikon MaterialCommunityIcons yang dipakai aplikasi. */
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Ikon vektor - menggantikan emoji supaya tampilan konsisten di semua HP
 * (emoji render beda-beda per device dan terlihat seperti template AI).
 */
export function Icon({
  name,
  size = 20,
  color = palette.text,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
}

/** Ikon di dalam kotak berlatar - pengganti thumbnail emoji. */
export function IconBadge({
  name,
  size = 22,
  boxSize = 44,
  color = palette.accent,
  bg = palette.accentSoft,
  radiusValue = radius.sm,
}: {
  name: IconName;
  size?: number;
  boxSize?: number;
  color?: string;
  bg?: string;
  radiusValue?: number;
}) {
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: radiusValue,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={size} color={color} />
    </View>
  );
}

/* --------------------------------------------------------------- Pressable */

/** Kartu yang sedikit mengecil saat ditekan - transform + 200ms, khas Telegram. */
export function PressCard({
  children,
  onPress,
  style,
  disabled,
  testID,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) =>
    Animated.timing(scale, { toValue: v, duration: motion.fast, easing: undefined, useNativeDriver: true }).start();

  return (
    <Pressable
      disabled={disabled}
      testID={testID}
      onPress={onPress}
      onPressIn={() => to(0.985)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ Button */

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  testID,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'green' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Ikon opsional di sebelah kiri label. */
  icon?: IconName;
}) {
  const bg =
    variant === 'primary' ? palette.accent
    : variant === 'green' ? palette.green
    : variant === 'danger' ? palette.danger
    : variant === 'secondary' ? palette.surface
    : 'transparent';
  const fg =
    variant === 'primary' || variant === 'green' || variant === 'danger'
      ? '#ffffff'
      : variant === 'ghost' ? palette.accent : palette.text;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg },
        variant === 'secondary' && { borderWidth: 1, borderColor: palette.border },
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : icon ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name={icon} size={16} color={fg} />
          <Text style={[type.button, { color: fg }]}>{label}</Text>
        </View>
      ) : (
        <Text style={[type.button, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ------------------------------------------------------------------ Header */

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={type.h1}>{title}</Text>
        {subtitle ? <Text style={[type.small, { color: palette.textMuted, marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/* ------------------------------------------------------------------- Badge */

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'green' | 'warning' | 'danger';
}) {
  const map = {
    neutral: { bg: palette.surfaceAlt, fg: palette.textMuted, bd: palette.border },
    accent: { bg: palette.accentSoft, fg: palette.accent, bd: 'rgba(51,144,236,0.25)' },
    green: { bg: palette.greenSoft, fg: '#3f7a38', bd: 'rgba(92,168,83,0.3)' },
    warning: { bg: palette.warningSoft, fg: '#8a5a12', bd: 'rgba(242,163,60,0.35)' },
    danger: { bg: palette.dangerSoft, fg: palette.danger, bd: 'rgba(223,63,64,0.3)' },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg, borderColor: map.bd }]}>
      <Text style={[type.tiny, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ Divider */

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/* ------------------------------------------------------------- Empty state */

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <IconBadge name={icon} size={30} boxSize={62} radiusValue={radius.lg} />
      <Text style={[type.h3, { marginTop: spacing.md, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.small, { color: palette.textMuted, marginTop: 4, textAlign: 'center', maxWidth: 260 }]}>
        {body}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------- Animated reveal */

/** Muncul dengan fade + naik sedikit. Hanya opacity & transform. */
export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: motion.base,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, v]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------- Text */

export function T({
  children,
  style,
  tone = 'default',
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  tone?: 'default' | 'muted' | 'dim' | 'accent';
  numberOfLines?: number;
}) {
  const color =
    tone === 'muted' ? palette.textMuted : tone === 'dim' ? palette.textDim : tone === 'accent' ? palette.accent : palette.text;
  return (
    <Text numberOfLines={numberOfLines} style={[type.body, { color }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    ...shadow.hair,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: spacing.xl,
  },
});
