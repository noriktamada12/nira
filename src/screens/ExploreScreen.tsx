/**
 * NIRA - layar Jelajahi (konsumen).
 *
 * Alur: cari makanan -> lihat kartu surplus -> buka detail -> pesan.
 */
import React, { useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Card, EmptyState, Icon, PressCard, Reveal, ScreenHeader, T } from '../ui';
import { angkaDesimal, resolvePhoto, rupiah } from '../data';
import { palette, radius, spacing, type } from '../theme';
import { useStore } from '../store';
import type { SurplusItem } from '../types';

function discountPct(original: number, price: number): number {
  return Math.round(((original - price) / original) * 100);
}

/** Bintang rating untuk satu penjual = rating dasar + ulasan konsumen. */
function StarsRow({ rating, count }: { rating: number; count: number }) {
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
      <View style={{ flexDirection: 'row', gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon
            key={i}
            name={i <= full ? 'star' : 'star-outline'}
            size={12}
            color={i <= full ? '#f5a623' : palette.border}
          />
        ))}
      </View>
      <T tone="muted" style={type.tiny}>{rating.toFixed(1)} ({count})</T>
    </View>
  );
}

function ItemCard({ item, onPress, index }: { item: SurplusItem; onPress: () => void; index: number }) {
  const { merchantOfId, orders } = useStore();
  const m = merchantOfId(item.merchantId);
  const left = item.portions;
  const photo = resolvePhoto(item.photo);

  // rating efektif: gabung rating dasar penjual + ulasan dari pesanan selesai
  const reviews = orders.filter((o) => o.merchantId === m.id && o.rated && o.stars);
  const effRating = reviews.length
    ? (m.rating * m.ratingCount + reviews.reduce((n, o) => n + (o.stars ?? 0), 0)) / (m.ratingCount + reviews.length)
    : m.rating;
  const effCount = m.ratingCount + reviews.length;

  return (
    <Reveal delay={Math.min(index * 45, 260)}>
      <PressCard testID={`item-${item.id}`} onPress={onPress} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.thumb}>
            {photo ? (
              <Image source={photo} style={styles.thumbImg} resizeMode="cover" />
            ) : (
              <Icon name={item.icon} size={30} color={palette.textMuted} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <T style={type.bodyStrong} numberOfLines={2}>{item.title}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Icon name="storefront-outline" size={13} color={palette.textMuted} />
              <T tone="muted" style={[type.small, { flex: 1 }]} numberOfLines={1}>
                {m.name} · {m.distanceKm} km
              </T>
            </View>
            <StarsRow rating={Math.round(effRating * 10) / 10} count={effCount} />
            <View style={styles.priceRow}>
              <T style={[type.bodyStrong, { color: palette.accent }]}>{rupiah(item.price)}</T>
              <Text style={styles.strike}>{rupiah(item.originalPrice)}</Text>
              <Badge label={`-${discountPct(item.originalPrice, item.price)}%`} tone="green" />
            </View>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="clock-outline" size={13} color={palette.textMuted} />
            <T tone="muted" style={type.tiny}>Ambil {item.pickupStart}–{item.pickupEnd}</T>
          </View>
          <T tone={left <= 2 ? 'accent' : 'muted'} style={type.tiny}>
            {left <= 2 ? `Sisa ${left} porsi!` : `${left} porsi`}
          </T>
        </View>
      </PressCard>
    </Reveal>
  );
}

export default function ExploreScreen({ onOpenItem }: { onOpenItem: (id: string) => void }) {
  const { items, merchants, impact } = useStore();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('Semua');

  const categories = useMemo(() => ['Semua', ...new Set(merchants.map((m) => m.category))], [merchants]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((i) => i.isActive && i.portions > 0)
      .filter((i) => (cat === 'Semua' ? true : i.category === cat))
      .filter((i) => {
        if (!needle) return true;
        const m = merchants.find((x) => x.id === i.merchantId);
        return (
          i.title.toLowerCase().includes(needle) ||
          i.category.toLowerCase().includes(needle) ||
          (m?.name.toLowerCase().includes(needle) ?? false)
        );
      });
  }, [items, merchants, q, cat]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="NIRA" subtitle="Setiap rasa masih bernilai" />

      {/* Kartu dampak - pengingat misi aplikasi */}
      <View style={{ paddingHorizontal: spacing.gutter }}>
        <Card style={styles.impactCard}>
          <View style={styles.impactRow}>
            <View style={{ flex: 1 }}>
              <T tone="muted" style={type.tiny}>PORSI DISELAMATKAN</T>
              <Text style={styles.impactNum}>{impact.mealsRescued}</Text>
              <T tone="muted" style={type.tiny}>
                {angkaDesimal(impact.co2SavedKg)} kg CO₂ tidak terbuang
              </T>
            </View>
            <View style={styles.impactDivider} />
            <View style={{ flex: 1 }}>
              <T tone="muted" style={type.tiny}>UANG DIHEMAT</T>
              <Text style={styles.impactNum}>{rupiah(impact.moneySaved)}</Text>
              <T tone="muted" style={type.tiny}>
                dari {impact.ordersCompleted} pesanan selesai
              </T>
            </View>
          </View>
        </Card>
      </View>

      {/* Pencarian */}
      <View style={{ paddingHorizontal: spacing.gutter, marginTop: spacing.lg }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Cari makanan atau tempat makan"
          placeholderTextColor={palette.textDim}
          style={styles.search}
        />
      </View>

      {/* Filter kategori - ScrollView horizontal WAJIB punya tinggi eksplisit,
          kalau tidak tingginya collapse di Android/iOS dan chip-nya kepotong. */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {categories.map((c) => {
            const on = c === cat;
            return (
              <PressCard key={c} onPress={() => setCat(c)}>
                <View style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[type.small, { color: on ? '#fff' : palette.text, fontWeight: on ? '600' : '400' }]}>
                    {c}
                  </Text>
                </View>
              </PressCard>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl + insets.bottom }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item, index }) => (
          <ItemCard item={item} index={index} onPress={() => onOpenItem(item.id)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="magnify"
            title="Belum ada makanan cocok"
            body="Coba kata kunci lain atau ganti kategori. Makanan surplus baru muncul menjelang jam tutup."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  card: { backgroundColor: palette.surface, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, padding: spacing.md },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  thumb: {
    width: 62, height: 62, borderRadius: radius.sm, backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  stars: { fontSize: 14, color: '#f5a623', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  strike: { fontSize: 12, color: palette.textDim, textDecorationLine: 'line-through' },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border,
  },
  impactCard: { backgroundColor: palette.surface, paddingVertical: spacing.md },
  impactRow: { flexDirection: 'row', alignItems: 'center' },
  impactDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: palette.border, marginHorizontal: spacing.md },
  impactNum: { fontSize: 22, fontWeight: '700', color: palette.text, marginVertical: 1, letterSpacing: -0.4 },
  search: {
    height: 42, borderRadius: radius.sm, backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border, paddingHorizontal: spacing.md,
    fontSize: 14, color: palette.text,
  },
  chips: { paddingHorizontal: spacing.gutter, gap: spacing.sm, paddingVertical: 2, alignItems: 'center' },
  /** Tinggi eksplisit: ScrollView horizontal tanpa ini collapse di native. */
  chipsWrap: { height: 40, marginTop: spacing.md },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
    backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
  },
  chipOn: { backgroundColor: palette.accent, borderColor: palette.accent },
});
