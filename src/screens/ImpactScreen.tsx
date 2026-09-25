/**
 * NIRA - layar Dampak (gaya iOS).
 *
 * Setiap makanan yang diselamatkan tercatat dan ditampilkan
 * sebagai dampak nyata (porsi, CO2, uang).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Cell, EmptyState, Group, IconBadge, LargeTitle, SectionLabel, T } from '../ui';
import { angkaDesimal, rupiah } from '../data';
import { palette, radius, spacing, type, TABBAR_SPACE } from '../theme';
import type { IconName } from '../ui';
import { useStore } from '../store';

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'storefront-outline', title: 'Penjual unggah surplus', body: 'Makanan berlebih menjelang tutup dijual dengan harga murah.' },
  { icon: 'cart-outline', title: 'Konsumen pesan', body: 'Cari makanan, pilih porsi, bayar, dapat kode pickup.' },
  { icon: 'bag-personal', title: 'Ambil di lokasi', body: 'Datang pada jam yang tertera, tunjukkan kode ke penjual.' },
  { icon: 'check-circle', title: 'Penjual verifikasi', body: 'Pengambilan dikonfirmasi, porsi tercatat terselamatkan.' },
];

export default function ImpactScreen() {
  const { impact, orders, reset } = useStore();
  const insets = useSafeAreaInsets();

  const progressToNext = impact.mealsRescued % 10;
  const progressPct = (progressToNext / 10) * 100;
  const remaining = 10 - progressToNext;
  const recent = orders.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom + TABBAR_SPACE }}>
        <LargeTitle title="Dampak" subtitle="Setiap porsi yang diselamatkan tercatat" />

        {/* Kartu hijau besar */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <T style={[type.tiny, { color: 'rgba(255,255,255,0.8)' }]}>TOTAL PORSI DISELAMATKAN</T>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{remaining} lagi ke badge</Text>
            </View>
          </View>
          <Text style={styles.bigNum}>{impact.mealsRescued}</Text>
          <T style={[type.small, { color: 'rgba(255,255,255,0.9)' }]}>
            porsi makanan terselamatkan dari tempat sampah
          </T>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <T style={[type.tiny, { color: 'rgba(255,255,255,0.85)', marginTop: 6 }]}>
            {remaining} porsi lagi menuju badge berikutnya
          </T>
        </View>

        {/* 2 kartu metrik */}
        <View style={styles.grid}>
          <Card style={{ flex: 1 }}>
            <IconBadge name="earth" size={22} boxSize={44} />
            <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>CO2 DIHINDARI</T>
            <Text style={styles.metricNum}>{`${angkaDesimal(impact.co2SavedKg)} kg`}</Text>
            <T tone="muted" style={type.tiny}>
              {impact.co2SavedKg > 0 ? `setara perjalanan mobil ${Math.round(impact.co2SavedKg * 4)} km` : 'belum ada'}
            </T>
          </Card>
          <Card style={{ flex: 1 }}>
            <IconBadge name="cash" size={22} boxSize={44} />
            <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>UANG DIHEMAT</T>
            <Text style={styles.metricNum}>{rupiah(impact.moneySaved)}</Text>
            <T tone="muted" style={type.tiny}>
              {impact.ordersCompleted > 0 ? `dari ${impact.ordersCompleted} pesanan selesai` : 'belum ada'}
            </T>
          </Card>
        </View>

        <SectionLabel text="Cara kami menghitung" />
        <View style={styles.groupWrap}>
          <Group>
            <Cell label="Porsi terselamatkan" value={`${impact.mealsRescued} porsi`} />
            <Cell label="Uang dihemat" value={`${impact.mealsRescued} × selisih harga`} />
            <Cell label="CO2 dihindari" value={`${impact.mealsRescued} × 2,5 kg`} />
          </Group>
          <T tone="muted" style={[type.caption, styles.footer]}>
            Uang dihemat = harga normal dikurangi harga surplus, hanya untuk pesanan selesai. CO2 = rata-rata
            emisi satu porsi makan yang tidak jadi terbuang.
          </T>
        </View>

        <SectionLabel text="Bagaimana NIRA bekerja" />
        <View style={styles.groupWrap}>
          <Group>
            {STEPS.map((s, i) => (
              <View key={s.title} style={styles.stepRow}>
                <IconBadge name={s.icon} size={17} boxSize={34} radiusValue={radius.sm} />
                <View style={{ flex: 1 }}>
                  <T style={type.bodyStrong}>{i + 1}. {s.title}</T>
                  <T tone="muted" style={[type.small, { marginTop: 2 }]}>{s.body}</T>
                </View>
              </View>
            ))}
          </Group>
        </View>

        <SectionLabel text="Riwayat aktivitas" />
        <View style={styles.groupWrap}>
          {recent.length > 0 ? (
            <Group>
              {recent.map((o) => (
                <View key={o.id} style={styles.stepRow}>
                  <IconBadge name={o.icon} size={18} boxSize={38} />
                  <View style={{ flex: 1 }}>
                    <T style={type.bodyStrong} numberOfLines={1}>{o.itemTitle}</T>
                    <T tone="muted" style={[type.small, { marginTop: 2 }]}>{o.merchantName} · {o.qty} porsi</T>
                  </View>
                  <T tone="muted" style={type.small}>
                    {o.status === 'picked_up' ? 'Selesai' : o.status === 'cancelled' ? 'Batal' : 'Aktif'}
                  </T>
                </View>
              ))}
            </Group>
          ) : (
            <Card>
              <EmptyState
                icon="receipt-text-outline"
                title="Belum ada aktivitas"
                body="Pesanan yang kamu buat akan tercatat di sini."
              />
            </Card>
          )}
          <T tone="muted" style={[type.caption, styles.footer]}>
            {orders.length} transaksi tercatat di perangkat ini
          </T>
        </View>

        <View style={styles.btnWrap}>
          <Button label="Reset data demo" variant="secondary" onPress={reset} />
          <T tone="muted" style={[type.tiny, { textAlign: 'center', marginTop: spacing.sm }]}>
            Data demo tersimpan lokal di HP ini (AsyncStorage).
          </T>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  hero: {
    backgroundColor: palette.accent,
    borderRadius: radius.lg,
    marginHorizontal: spacing.gutter,
    padding: spacing.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: 11.5, fontWeight: '600', color: '#fff' },
  bigNum: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1.4, marginVertical: 4 },
  progressTrack: {
    height: 6, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: spacing.lg, overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: radius.full, backgroundColor: '#fff' },
  grid: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.gutter, marginTop: spacing.md },
  metricNum: { fontSize: 20, fontWeight: '700', color: palette.text, marginVertical: 3, letterSpacing: -0.4 },
  groupWrap: { marginHorizontal: spacing.gutter },
  stepRow: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: spacing.lg,
  },
  footer: { marginTop: spacing.sm, marginHorizontal: spacing.sm, lineHeight: 17 },
  btnWrap: { marginHorizontal: spacing.gutter, marginTop: spacing.xl },
});
