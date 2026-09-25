/**
 * NIRA - layar Detail makanan (konsumen).
 *
 * Di sini konsumen memilih jumlah porsi lalu memesan. Setelah dipesan,
 * muncul kode pickup yang ditunjukkan ke penjual saat mengambil.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, Divider, Icon, T } from '../ui';
import { angkaDesimal, resolvePhoto, rupiah } from '../data';
import { palette, radius, spacing, type } from '../theme';
import { useStore } from '../store';
import type { Order } from '../types';

function discountPct(o: number, p: number) {
  if (!Number.isFinite(o) || !Number.isFinite(p) || o <= 0) return 0;
  return Math.round(((o - p) / o) * 100);
}

/** Lokasi penjual: kotak statis yang membuka Google Maps saat diketuk.
 *
 * Sebelumnya di sini ada MapView native (react-native-maps). Itu tersangka
 * utama crash: tanpa API key Google di AndroidManifest, peta native belum
 * sempat dilepas saat layar ditutup -> force close. Sekarang tidak ada
 * komponen peta sama sekali, jadi tidak ada lagi yang bisa bocor. */
function LocationMap({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const openExternal = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    void Linking.openURL(url);
  };

  return (
    <Pressable onPress={openExternal} style={styles.mapFallbackPress}>
      <View style={[styles.mapFallback, { alignItems: 'center', justifyContent: 'center' }]}>
        <Icon name="map-marker-outline" size={34} color={palette.accent} />
        <T style={[type.bodyStrong, { marginTop: 6 }]}>Lihat lokasi di peta</T>
        <T tone="muted" style={[type.tiny, { marginTop: 2, textAlign: 'center' }]}>
          {address} · buka Google Maps
        </T>
      </View>
    </Pressable>
  );
}

export default function ItemDetailScreen({
  itemId,
  onBack,
  onOrdered,
}: {
  itemId: string;
  onBack: () => void;
  onOrdered: (order: Order) => void;
}) {
  const { getItem, merchantOfId, placeOrder } = useStore();
  const insets = useSafeAreaInsets();
  const item = getItem(itemId);
  const [qty, setQty] = useState(1);
  const [memproses, setMemproses] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: spacing.gutter }}>
          <Button label="Kembali" variant="secondary" onPress={onBack} />
          <T tone="muted" style={{ marginTop: spacing.lg }}>Makanan ini sudah tidak tersedia.</T>
        </View>
      </SafeAreaView>
    );
  }

  const m = merchantOfId(item.merchantId);
  const maxQty = Math.max(1, item.portions);
  const total = item.price * qty;
  const hemat = (item.originalPrice - item.price) * qty;
  const habis = item.portions <= 0;

  /**
   * Pesan porsi.
   *
   * Perbaikan anti-crash (lapis 2):
   *   - Timer disimpan di ref dan dibersihkan saat layar dilepas, supaya
   *     callback tidak jalan di layar yang sudah tidak ada.
   *   - Kalau stok ternyata habis duluan, kasih tahu user (bukan diam saja
   *     yang tombolnya nyangkut di "Memproses…").
   *   - Alert pengganti navigasi pop-up, karena layar tujuan tampil via
   *     onOrdered (setTab('orders')) bukan via Alert berlapis.
   */
  const pesan = () => {
    if (habis || memproses) return;
    setMemproses(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      try {
        const order = placeOrder(item.id, qty);
        if (order) {
          onOrdered(order);
        } else {
          setMemproses(false);
          Alert.alert('Stok berubah', 'Porsi sudah habis atau tidak cukup. Coba jumlah lebih kecil.');
        }
      } catch {
        setMemproses(false);
        Alert.alert('Gagal memesan', 'Coba lagi sebentar lagi.');
      }
    }, 60);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Button label="‹ Kembali" variant="ghost" onPress={onBack} style={{ height: 34, paddingHorizontal: 4 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingBottom: 140 }}>
        {/* Foto makanan besar */}
        <View style={styles.heroPhoto}>
          {resolvePhoto(item.photo) ? (
            <Image source={resolvePhoto(item.photo)!} style={styles.heroPhotoImg} resizeMode="cover" />
          ) : (
            <Icon name={item.icon} size={64} color={palette.textDim} />
          )}
        </View>

        <Card>
          <T style={type.h2}>{item.title}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Icon name="storefront-outline" size={14} color={palette.textMuted} />
            <T tone="muted" style={type.small}>{m.name}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={13} color="#f5a623" />
              <T style={[type.tiny, { color: palette.textMuted }]}>{m.rating} ({m.ratingCount})</T>
            </View>
            <Badge label={`${m.distanceKm} km`} tone="neutral" />
            <Badge label={m.category} tone="neutral" />
          </View>

          <Divider style={{ marginVertical: spacing.lg }} />

          <T tone="muted" style={type.tiny}>DESKRIPSI</T>
          <T style={{ marginTop: 4 }}>{item.description}</T>

          <Divider style={{ marginVertical: spacing.lg }} />

          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              <T tone="muted" style={type.tiny}>JAM AMBIL</T>
              <T style={type.bodyStrong}>{item.pickupStart}–{item.pickupEnd}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T tone="muted" style={type.tiny}>SISA PORSI</T>
              <T style={type.bodyStrong}>{item.portions}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T tone="muted" style={type.tiny}>DISKON</T>
              <T style={[type.bodyStrong, { color: palette.green }]}>
                -{discountPct(item.originalPrice, item.price)}%
              </T>
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.qtyRow}>
            <View>
              <T style={type.bodyStrong}>Jumlah porsi</T>
              <T tone="muted" style={type.tiny}>Maksimal {maxQty} porsi</T>
            </View>
            <View style={styles.stepper}>
              <Button
                label="−"
                variant="secondary"
                onPress={() => setQty((n) => Math.max(1, n - 1))}
                style={styles.stepBtn}
              />
              <Text style={styles.qtyNum}>{qty}</Text>
              <Button
                label="+"
                variant="secondary"
                onPress={() => setQty((n) => Math.min(maxQty, n + 1))}
                style={styles.stepBtn}
              />
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.lg }} />

          <View style={styles.sumRow}>
            <T tone="muted">Harga normal</T>
            <Text style={styles.strike}>{rupiah(item.originalPrice * qty)}</Text>
          </View>
          <View style={styles.sumRow}>
            <T tone="muted">Hemat</T>
            <T style={{ color: palette.green, fontWeight: '600' }}>−{rupiah(hemat)}</T>
          </View>
          <View style={[styles.sumRow, { marginTop: spacing.sm }]}>
            <T style={type.bodyStrong}>Total bayar</T>
            <Text style={styles.total}>{rupiah(total)}</Text>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.lg, backgroundColor: palette.accentSoft, borderColor: 'rgba(51,144,236,0.25)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="leaf" size={15} color={palette.accent} />
            <T style={[type.bodyStrong, { color: palette.accent }]}>Dampak pesanan ini</T>
          </View>
          <T style={[type.small, { color: palette.textMuted, marginTop: 4 }]}>
            {qty} porsi terselamatkan · setara {angkaDesimal(Math.round(qty * 2.5 * 10) / 10)} kg CO₂ tidak terbuang.
          </T>
        </Card>

        {/* Lokasi pengambilan: kotak statis -> buka Google Maps. */}
        <Card style={{ marginTop: spacing.lg }}>
          <T style={type.bodyStrong}>Lokasi pengambilan</T>
          <T tone="muted" style={[type.small, { marginTop: 2 }]}>{m.address}</T>
          <View style={{ marginTop: spacing.md }}>
            <LocationMap lat={m.lat} lng={m.lng} address={m.address} />
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(spacing.md, insets.bottom + 4) }]}>
        <View style={{ flex: 1 }}>
          <T tone="muted" style={type.tiny}>TOTAL</T>
          <Text style={styles.total}>{rupiah(total)}</Text>
        </View>
        <Button
          label={habis ? 'Stok habis' : memproses ? 'Memproses…' : 'Pesan sekarang'}
          variant="primary"
          testID="btn-order"
          disabled={habis || memproses}
          onPress={pesan}
          style={{ minWidth: 150, flexShrink: 0 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  topbar: { paddingHorizontal: spacing.gutter, paddingTop: spacing.sm },
  heroPhoto: {
    width: '100%', height: 200, borderRadius: radius.md, backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border,
    overflow: 'hidden', marginBottom: spacing.lg,
  },
  heroPhotoImg: { width: '100%', height: '100%' },
  mapFallback: {
    width: '100%', height: 170, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surfaceAlt,
  },
  mapFallbackPress: { width: '100%' },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.xs, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surfaceAlt,
  },
  heroRow: { flexDirection: 'row', gap: spacing.lg },
  hero: {
    width: 92, height: 92, borderRadius: radius.md, backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border,
  },
  metaRow: { flexDirection: 'row' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: { width: 44, height: 38, paddingHorizontal: 0 },
  qtyNum: { fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center', color: palette.text },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  strike: { fontSize: 13, color: palette.textDim, textDecorationLine: 'line-through' },
  total: { fontSize: 20, fontWeight: '700', color: palette.text, letterSpacing: -0.4 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.gutter, paddingVertical: spacing.md,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border,
  },
});
