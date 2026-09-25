/**
 * NIRA - layar Jelajahi (konsumen), gaya iOS.
 *
 * Mockup F: judul 34px rata kiri, kartu dampak hijau, daftar grup iOS
 * (foto 60px + nama + harga kanan + chevron), search bar iOS.
 */
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Chevron, EmptyState, Icon, LargeTitle, SearchBar, SectionLabel, Stars, T } from '../ui';
import { angkaDesimal, resolvePhoto, rupiah } from '../data';
import { palette, radius, spacing, type, TABBAR_SPACE } from '../theme';
import { useStore } from '../store';
import type { SurplusItem } from '../types';

function discountPct(original: number, price: number): number {
  if (!Number.isFinite(original) || !Number.isFinite(price) || original <= 0) return 0;
  return Math.round(((original - price) / original) * 100);
}

function FoodRow({ item, onPress, first, last }: { item: SurplusItem; onPress: () => void; first?: boolean; last?: boolean }) {
  const { merchantOfId, orders } = useStore();
  const m = merchantOfId(item.merchantId);
  const photo = resolvePhoto(item.photo);

  const reviews = orders.filter((o) => o.merchantId === m.id && o.rated && o.stars);
  const effRating = reviews.length
    ? (m.rating * m.ratingCount + reviews.reduce((n, o) => n + (o.stars ?? 0), 0)) / (m.ratingCount + reviews.length)
    : m.rating;
  const effCount = m.ratingCount + reviews.length;

  return (
    <Pressable
      testID={`item-${item.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { opacity: 0.6 },
      ]}
    >
      {photo ? (
        <Image source={photo} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Icon name={item.icon} size={28} color={palette.textMuted} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T style={type.bodyStrong} numberOfLines={1}>{item.title}</T>
        <T tone="muted" style={type.caption} numberOfLines={1}>
          {m.name} · {m.distanceKm} km
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <Stars value={effRating} />
          <T tone="muted" style={type.tiny}>{effRating.toFixed(1)} ({effCount})</T>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <Text style={styles.price}>{rupiah(item.price)}</Text>
        <Text style={styles.strike}>{rupiah(item.originalPrice)}</Text>
        <Badge label={`-${discountPct(item.originalPrice, item.price)}%`} tone="green" />
      </View>
      <Chevron />
    </Pressable>
  );
}

export default function ExploreScreen({ onOpenItem }: { onOpenItem: (id: string) => void }) {
  const { items, merchants, impact } = useStore();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((i) => i.isActive && i.portions > 0)
      .filter((i) => {
        if (!needle) return true;
        const m = merchants.find((x) => x.id === i.merchantId);
        return (
          i.title.toLowerCase().includes(needle) ||
          i.category.toLowerCase().includes(needle) ||
          (m?.name.toLowerCase().includes(needle) ?? false)
        );
      });
  }, [items, merchants, q]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom + TABBAR_SPACE }}>
        <LargeTitle title="Jelajahi" />
        <SearchBar value={q} onChange={setQ} placeholder="Cari makanan atau warung" />

        {/* Kartu dampak hijau */}
        <View style={styles.impact}>
          <T style={[type.tiny, { color: 'rgba(255,255,255,0.85)' }]}>PORSI DISELAMATKAN</T>
          <Text style={styles.impactBig}>{impact.mealsRescued} porsi · {rupiah(impact.moneySaved)}</Text>
          <Text style={[type.small, { color: 'rgba(255,255,255,0.9)' }]}>
            {angkaDesimal(impact.co2SavedKg)} kg CO₂ tidak terbuang
          </Text>
          <View style={styles.impactRow}>
            <View style={styles.impactMini}>
              <Text style={styles.impactMiniN}>{angkaDesimal(impact.co2SavedKg)} kg</Text>
              <Text style={styles.impactMiniL}>CO₂</Text>
            </View>
            <View style={styles.impactMini}>
              <Text style={styles.impactMiniN}>{rupiah(impact.moneySaved)}</Text>
              <Text style={styles.impactMiniL}>Dihemat</Text>
            </View>
            <View style={styles.impactMini}>
              <Text style={styles.impactMiniN}>{impact.ordersCompleted}</Text>
              <Text style={styles.impactMiniL}>Pesanan</Text>
            </View>
          </View>
        </View>

        <SectionLabel text="Terdekat dari kamu" />

        {/* Satu grup iOS: semua baris dalam SATU container putih */}
        {list.length === 0 ? (
          <EmptyState
            icon="magnify"
            title="Belum ada makanan cocok"
            body="Coba kata kunci lain. Makanan surplus baru muncul menjelang jam tutup."
          />
        ) : (
          <View style={styles.listWrap}>
            {list.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <View style={styles.rowSep} /> : null}
                <FoodRow
                  item={item}
                  onPress={() => onOpenItem(item.id)}
                  first={index === 0}
                  last={index === list.length - 1}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  impact: {
    backgroundColor: palette.accent,
    borderRadius: 16,
    marginHorizontal: spacing.gutter,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  impactBig: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginVertical: 3 },
  impactRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  impactMini: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, padding: 8, alignItems: 'center' },
  impactMiniN: { fontSize: 14, fontWeight: '800', color: '#fff' },
  impactMiniL: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },
  listWrap: {
    marginHorizontal: spacing.gutter,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: palette.surface,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  rowSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
    marginLeft: 88,
  },
  thumb: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: palette.grouped },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: 15, fontWeight: '700', color: palette.accent },
  strike: { fontSize: 11.5, color: palette.textDim, textDecorationLine: 'line-through' },
});
