/**
 * NIRA - layar Dampak & Profil.
 *
 * Menutup lingkaran cerita produk: setiap makanan yang diselamatkan tercatat
 * dan ditampilkan sebagai dampak nyata (porsi, CO2, uang).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, Divider, Icon, IconBadge, ScreenHeader, T } from '../ui';
import { angkaDesimal, rupiah } from '../data';
import { palette, radius, spacing, type } from '../theme';
import type { IconName } from '../ui';
import { useStore } from '../store';

export default function ImpactScreen() {
  const { impact, orders, reset } = useStore();
  const insets = useSafeAreaInsets();

  const progressToNext = impact.mealsRescued % 10;
  const progressPct = (progressToNext / 10) * 100;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Dampakmu" subtitle="Setiap porsi yang diselamatkan tercatat" />

      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl + insets.bottom }}>
        <Card style={{ backgroundColor: palette.accent, borderColor: palette.accent }}>
          <T style={[type.tiny, { color: 'rgba(255,255,255,0.8)' }]}>TOTAL PORSI DISELAMATKAN</T>
          <Text style={styles.bigNum}>{impact.mealsRescued}</Text>
          <T style={[type.small, { color: 'rgba(255,255,255,0.9)' }]}>
            porsi makanan terselamatkan dari tempat sampah
          </T>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <T style={[type.tiny, { color: 'rgba(255,255,255,0.85)', marginTop: 6 }]}>
            {10 - progressToNext} porsi lagi menuju badge berikutnya
          </T>
        </Card>

        <View style={styles.grid}>
          <MetricCard
            icon="earth"
            label="CO₂ dihindari"
            value={`${angkaDesimal(impact.co2SavedKg)} kg`}
            hint={impact.co2SavedKg > 0 ? `setara perjalanan mobil ${Math.round(impact.co2SavedKg * 4)} km` : 'belum ada'}
          />
          <MetricCard
            icon="cash"
            label="Uang dihemat"
            value={rupiah(impact.moneySaved)}
            hint={impact.ordersCompleted > 0 ? `dari ${impact.ordersCompleted} pesanan selesai` : 'belum ada'}
          />
        </View>

        {/* Rincian hitungan supaya angka tidak terasa "asal muncul" */}
        <Card style={{ marginTop: spacing.lg }}>
          <T style={type.bodyStrong}>Cara kami menghitung</T>
          <Divider style={{ marginVertical: spacing.md }} />
          <BarisRumus
            label="Porsi terselamatkan"
            rumus={`${impact.mealsRescued} porsi`}
            nilai="jumlah porsi dari pesanan yang sudah kamu ambil"
          />
          <BarisRumus
            label="Uang dihemat"
            rumus={`${impact.mealsRescued} × selisih harga`}
            nilai="harga normal dikurangi harga surplus, hanya untuk pesanan selesai"
          />
          <BarisRumus
            label="CO₂ dihindari"
            rumus={`${impact.mealsRescued} × 2,5 kg`}
            nilai="rata-rata emisi satu porsi makan yang tidak jadi terbuang"
            last
          />
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <T style={type.bodyStrong}>Bagaimana NIRA bekerja</T>
          <Divider style={{ marginVertical: spacing.md }} />
          <Step n={1} icon="storefront-outline" title="Penjual unggah surplus" body="Makanan berlebih menjelang tutup dijual dengan harga murah." />
          <Step n={2} icon="cart-outline" title="Konsumen pesan" body="Cari makanan, pilih porsi, bayar, dapat kode pickup." />
          <Step n={3} icon="bag-personal" title="Ambil di lokasi" body="Datang pada jam yang tertera, tunjukkan kode ke penjual." />
          <Step n={4} icon="check-circle" title="Penjual verifikasi" body="Pengambilan dikonfirmasi, porsi tercatat terselamatkan." last />
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <T style={type.bodyStrong}>Riwayat aktivitas</T>
              <T tone="muted" style={[type.small, { marginTop: 2 }]}>
                {orders.length} transaksi tercatat di perangkat ini
              </T>
            </View>
            <Badge label={`${orders.length} total`} tone="neutral" />
          </View>
        </Card>

        <Button
          label="Reset data demo"
          variant="secondary"
          onPress={reset}
          style={{ marginTop: spacing.xl }}
        />
        <T tone="muted" style={[type.tiny, { textAlign: 'center', marginTop: spacing.sm }]}>
          Data demo tersimpan lokal di HP ini (AsyncStorage).
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ icon, label, value, hint }: { icon: IconName; label: string; value: string; hint: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <IconBadge name={icon} size={22} boxSize={44} />
      <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>{label.toUpperCase()}</T>
      <Text style={styles.metricNum}>{value}</Text>
      <T tone="muted" style={type.tiny}>{hint}</T>
    </Card>
  );
}

function BarisRumus({ label, rumus, nilai, last }: { label: string; rumus: string; nilai: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: last ? 0 : spacing.lg }}>
      <View style={{ flex: 1 }}>
        <T style={type.bodyStrong}>{label}</T>
        <T tone="muted" style={[type.tiny, { marginTop: 2 }]}>{nilai}</T>
      </View>
      <T tone="muted" style={[type.small, { color: palette.text, fontWeight: '600' }]}>{rumus}</T>
    </View>
  );
}

function Step({ n, icon, title, body, last }: { n: number; icon: IconName; title: string; body: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: last ? 0 : spacing.lg }}>
      <View style={styles.stepNum}>
        <Icon name={icon} size={17} color={palette.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={type.bodyStrong}>{n}. {title}</T>
        <T tone="muted" style={[type.small, { marginTop: 2 }]}>{body}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  bigNum: { fontSize: 46, fontWeight: '700', color: '#fff', letterSpacing: -1.4, marginVertical: 4 },
  progressTrack: { height: 6, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: spacing.lg, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: radius.full, backgroundColor: '#fff' },
  grid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metricNum: { fontSize: 20, fontWeight: '700', color: palette.text, marginVertical: 3, letterSpacing: -0.4 },
  stepNum: {
    width: 34, height: 34, borderRadius: radius.sm, backgroundColor: palette.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
