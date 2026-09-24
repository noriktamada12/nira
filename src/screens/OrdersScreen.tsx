/**
 * NIRA - layar Pesanan saya (konsumen).
 *
 * Menampilkan kode pickup besar (untuk ditunjukkan ke penjual), status
 * pesanan, dan tombol konfirmasi setelah makanan benar-benar diambil.
 */
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, Divider, EmptyState, Icon, Reveal, ScreenHeader, T } from '../ui';
import { angkaDesimal, resolvePhoto, rupiah } from '../data';
import { palette, radius, spacing, type } from '../theme';
import { useStore } from '../store';
import type { Order, OrderStatus } from '../types';

const STATUS_META: Record<OrderStatus, { label: string; tone: 'neutral' | 'accent' | 'green' | 'warning' | 'danger'; hint: string }> = {
  pending: { label: 'Menunggu bayar', tone: 'warning', hint: 'Selesaikan pembayaran untuk mengunci porsi.' },
  paid: { label: 'Siap diambil', tone: 'accent', hint: 'Tunjukkan kode ini ke penjual saat mengambil.' },
  picked_up: { label: 'Sudah diambil', tone: 'green', hint: 'Terima kasih! Porsi ini resmi terselamatkan.' },
  cancelled: { label: 'Dibatalkan', tone: 'danger', hint: 'Pesanan dibatalkan, porsi dikembalikan ke penjual.' },
};

function OrderCard({ order, index }: { order: Order; index: number }) {
  const { confirmPickup, cancelOrder, rateOrder, getItem } = useStore();
  const [showRate, setShowRate] = useState(false);
  const [pickedStars, setPickedStars] = useState(0);
  const meta = STATUS_META[order.status];
  const canConfirm = order.status === 'paid';
  const canCancel = order.status === 'pending' || order.status === 'paid';
  const canRate = order.status === 'picked_up' && !order.rated;

  const item = getItem(order.itemId);
  const photo = resolvePhoto(item?.photo);

  function submitRating() {
    if (pickedStars > 0) {
      rateOrder(order.id, pickedStars);
      setShowRate(false);
    }
  }

  return (
    <Reveal delay={Math.min(index * 45, 240)}>
      <Card>
        <View style={styles.head}>
          <View style={styles.thumb}>
            {photo ? (
              <Image source={photo} style={styles.thumbImg} resizeMode="cover" />
            ) : (
              <Icon name={order.icon} size={26} color={palette.textMuted} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <T style={type.bodyStrong} numberOfLines={2}>{order.itemTitle}</T>
            <T tone="muted" style={[type.small, { marginTop: 2 }]} numberOfLines={1}>
              {order.merchantName} · {order.qty} porsi
            </T>
            {order.rated && order.stars ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Icon key={i} name={i <= (order.stars ?? 0) ? 'star' : 'star-outline'} size={12} color="#f5a623" />
                ))}
                {order.reviewNote ? <T tone="muted" style={[type.tiny, { marginLeft: 3 }]}>{'\u201c'}{order.reviewNote}{'\u201d'}</T> : null}
              </View>
            ) : null}
          </View>
          <Badge label={meta.label} tone={meta.tone} />
        </View>

        {order.status === 'paid' || order.status === 'pending' ? (
          <>
            <Divider style={{ marginVertical: spacing.md }} />
            <View style={styles.codeBox}>
              <T tone="muted" style={type.tiny}>KODE PICKUP</T>
              <Text style={styles.code}>{order.code}</Text>
              <T tone="muted" style={[type.tiny, { marginTop: 2 }]}>{meta.hint}</T>
            </View>
          </>
        ) : null}

        {showRate ? (
          <>
            <Divider style={{ marginVertical: spacing.md }} />
            <View style={styles.rateBox}>
              <T style={type.bodyStrong}>Beri rating untuk {order.merchantName}</T>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable key={s} onPress={() => setPickedStars(s)} hitSlop={6} testID={`star-${s}`}>
                    <Icon name={s <= pickedStars ? 'star' : 'star-outline'} size={34} color={s <= pickedStars ? '#f5a623' : palette.border} />
                  </Pressable>
                ))}
              </View>
              <Button label="Kirim rating" variant="primary" onPress={submitRating} disabled={!pickedStars} style={{ height: 40, marginTop: spacing.sm }} />
            </View>
          </>
        ) : null}

        <Divider style={{ marginVertical: spacing.md }} />

        <View style={styles.foot}>
          <View>
            <T tone="muted" style={type.tiny}>TOTAL</T>
            <T style={type.bodyStrong}>{rupiah(order.totalPrice)}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {canCancel ? (
              <Button label="Batalkan" variant="secondary" onPress={() => cancelOrder(order.id)} style={{ height: 38 }} />
            ) : null}
            {canConfirm ? (
              <Button label="Sudah kuambil" variant="green" onPress={() => confirmPickup(order.id)} style={{ height: 38 }} />
            ) : null}
            {canRate && !showRate ? (
              <Button label="Beri rating" icon="star-outline" variant="secondary" onPress={() => setShowRate(true)} style={{ height: 38 }} />
            ) : null}
          </View>
        </View>
      </Card>
    </Reveal>
  );
}

export default function OrdersScreen() {
  const { orders, impact } = useStore();
  const insets = useSafeAreaInsets();
  const mine = useMemo(() => orders.filter((o) => o.buyerRole === 'consumer'), [orders]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Pesanan saya" subtitle="Kode pickup & riwayat" />

      {mine.length === 0 ? (
        <EmptyState
          icon="receipt-text-outline"
          title="Belum ada pesanan"
          body="Pesan makanan surplus dari tab Jelajahi. Setelah dipesan, kode pickup akan muncul di sini."
        />
      ) : (
        <FlatList
          data={mine}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl + insets.bottom }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item, index }) => <OrderCard order={item} index={index} />}
          ListFooterComponent={
            <Card style={{ marginTop: spacing.lg, backgroundColor: palette.greenSoft, borderColor: 'rgba(92,168,83,0.3)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="leaf" size={15} color="#3f7a38" />
                <T style={[type.bodyStrong, { color: '#3f7a38' }]}>Total dampakmu</T>
              </View>
              <T style={[type.small, { color: palette.textMuted, marginTop: 4 }]}>
                {impact.mealsRescued} porsi terselamatkan · {angkaDesimal(impact.co2SavedKg)} kg CO₂ · hemat {rupiah(impact.moneySaved)}
              </T>
            </Card>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  head: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  thumb: {
    width: 52, height: 52, borderRadius: radius.sm, backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  ratingDone: { fontSize: 12, color: '#f5a623', marginTop: 2 },
  rateBox: { backgroundColor: palette.surfaceAlt, borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, borderColor: palette.border },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  star: { fontSize: 32 },
  codeBox: {
    backgroundColor: palette.surfaceAlt, borderRadius: radius.sm, padding: spacing.md,
    borderWidth: 1, borderColor: palette.border, alignItems: 'center',
  },
  code: { fontSize: 26, fontWeight: '700', letterSpacing: 3, color: palette.accent, marginVertical: 3 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
