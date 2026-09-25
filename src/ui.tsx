/**
 * NIRA - komponen UI dasar (gaya iOS).
 *
 * Dunia visual: iOS Settings / WhatsApp iOS.
 *   - Judul layar 34px rata kiri (LargeTitle), bukan header tengah.
 *   - Kartu putih radius 14 di latar abu sistem.
 *   - TabBar iOS: ikon 24px + label 10px + badge merah.
 *   - Sel grup: baris putih + separator hairline + chevron ›.
 *   - Semua teks pakai Inter (font.body/h3/dll dari theme).
 *   - Tanpa emoji di mana pun — ikon selalu vektor MaterialCommunityIcons.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { motion, palette, radius, spacing, type } from './theme';

/* -------------------------------------------------------------------- Icon */

/** Nama ikon MaterialCommunityIcons yang dipakai aplikasi. */
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Ikon vektor — pengganti emoji di seluruh aplikasi. */
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

/** Ikon di dalam kotak berlatar — pengganti thumbnail emoji. */
export function IconBadge({
  name,
  size = 22,
  boxSize = 44,
  color = palette.accent,
  bg = palette.greenSoft,
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

/** Bintang rating vektor (kuning #FF9F0A). Bukan teks ★. */
export function Stars({
  value,
  size = 12,
  gap = 1,
}: {
  value: number;
  size?: number;
  gap?: number;
}) {
  const full = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name={i <= full ? 'star' : 'star-outline'}
          size={size}
          color={i <= full ? palette.star : palette.separator}
        />
      ))}
    </View>
  );
}

/** Chevron kanan iOS (›) — vektor, bukan karakter teks. */
export function Chevron({ color = palette.separator }: { color?: string }) {
  return <Icon name="chevron-right" size={17} color={color} />;
}

/* --------------------------------------------------------------- Pressable */

/**
 * Disimpan untuk kompatibilitas — kode baru pakai Pressable biasa
 * (iOS pakai opacity, bukan scale).
 */
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
  return (
    <Pressable disabled={disabled} testID={testID} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
      <View style={style}>{children}</View>
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'green' | 'danger' | 'blue';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Ikon opsional di sebelah kiri label. */
  icon?: IconName;
}) {
  const bg =
    variant === 'primary' || variant === 'green'
      ? palette.accent
      : variant === 'danger'
        ? palette.danger
        : variant === 'secondary'
          ? palette.grouped
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'green' || variant === 'danger'
      ? '#ffffff'
      : variant === 'ghost'
        ? palette.accent
        : palette.blue;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg },
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.8 },
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

/** Kartu iOS: putih, radius 14. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* -------------------------------------------------------- Judul + grup iOS */

/** Judul layar iOS: 34px rata kiri. */
export function LargeTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.largeTitleWrap}>
      <Text style={type.largeTitle}>{title}</Text>
      {subtitle ? <Text style={[type.small, { color: palette.textMuted, marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
  );
}

/** Header lama — dipertahankan supaya layar yang belum dirombak tetap jalan. */
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
    <View style={styles.largeTitleWrap}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={type.largeTitle}>{title}</Text>
          {subtitle ? <Text style={[type.small, { color: palette.textMuted, marginTop: 2 }]}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/**
 * Grup sel iOS: kartu putih berisi baris-baris + separator hairline otomatis.
 */
export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const kids = React.Children.toArray(children);
  return (
    <View style={[styles.group, style]}>
      {kids.map((k, i) => (
        <View key={i} style={[i > 0 && styles.groupSep]}>
          {k}
        </View>
      ))}
    </View>
  );
}

/** Satu baris sel: label kiri + nilai/chevron kanan. */
export function Cell({
  label,
  value,
  valueColor,
  onPress,
  testID,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  testID?: string;
}) {
  const inner = (
    <View style={styles.cell}>
      <Text style={type.body}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {value ? <Text style={[type.body, { color: valueColor ?? palette.textMuted }]}>{value}</Text> : null}
        {onPress ? <Chevron /> : null}
      </View>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} testID={testID} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
      {inner}
    </Pressable>
  );
}

/** Label seksi kecil abu (kayak "TERDEKAT DARI KAMU" di iOS). */
export function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text.toUpperCase()}</Text>;
}

/** Search bar iOS: abu bulat + ikon kaca pembesar. */
export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.searchWrap}>
      <Icon name="magnify" size={15} color={palette.textDim} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Cari'}
        placeholderTextColor={palette.textDim}
        style={styles.searchInput}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ Badge */

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'green' | 'warning' | 'danger' | 'blue';
}) {
  const map = {
    neutral: { bg: palette.grouped, fg: palette.textMuted },
    accent: { bg: palette.greenSoft, fg: palette.accent },
    green: { bg: palette.greenSoft, fg: palette.accent },
    warning: { bg: palette.warningSoft, fg: '#8a5a12' },
    danger: { bg: palette.dangerSoft, fg: palette.danger },
    blue: { bg: palette.blueSoft, fg: palette.blue },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[type.tiny, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ Divider */

/** Disimpan untuk kompatibilitas — kode baru pakai Group (separator otomatis). */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/* ------------------------------------------------------------- Empty state */

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <IconBadge name={icon} size={30} boxSize={62} radiusValue={31} />
      <Text style={[type.h3, { marginTop: spacing.md, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.small, { color: palette.textMuted, marginTop: 4, textAlign: 'center', maxWidth: 260 }]}>
        {body}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------- Animated reveal */

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

/* ------------------------------------------------------------------ TabBar */

/**
 * TabBar iOS: ikon 24px + label 10px, yang aktif biru, badge merah.
 * Dipakai App.tsx untuk konsumen & penjual.
 */
export function TabBar({
  tabs,
  active,
  onChange,
  badges,
}: {
  tabs: { key: string; label: string; icon: IconName; iconActive?: IconName }[];
  active: string;
  onChange: (k: string) => void;
  badges?: Record<string, number>;
}) {
  return (
    <View style={styles.tabbar}>
      {tabs.map((t) => {
        const on = t.key === active;
        const n = badges?.[t.key] ?? 0;
        return (
          <Pressable key={t.key} testID={`tab-${t.key}`} onPress={() => onChange(t.key)} style={styles.tabItem}>
            <View>
              <Icon
                name={on && t.iconActive ? t.iconActive : t.icon}
                size={24}
                color={on ? palette.blue : palette.textDim}
              />
              {n > 0 ? (
                <View style={styles.nbadge}>
                  <Text style={styles.nbadgeText}>{n > 9 ? '9+' : String(n)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, { color: on ? palette.blue : palette.textDim }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
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
  tone?: 'default' | 'muted' | 'dim' | 'accent' | 'blue';
  numberOfLines?: number;
}) {
  const color =
    tone === 'muted'
      ? palette.textMuted
      : tone === 'dim'
        ? palette.textDim
        : tone === 'accent'
          ? palette.accent
          : tone === 'blue'
            ? palette.blue
            : palette.text;
  return (
    <Text numberOfLines={numberOfLines} style={[type.body, { color }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  largeTitleWrap: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  group: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  groupSep: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    marginLeft: spacing.lg,
  },
  cell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    color: palette.textMuted,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.grouped,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.text,
    padding: 0,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
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
  tabbar: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, marginTop: 3, fontWeight: '500' },
  nbadge: {
    position: 'absolute',
    top: -5,
    right: -12,
    backgroundColor: palette.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  nbadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
