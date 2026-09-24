/**
 * NIRA - layar Profil (konsumen).
 *
 * Menampilkan akun yang sedang masuk, ringkasan dampak, dan tombol keluar.
 * Ini juga tempat konsumen melihat bahwa peran akunnya memang konsumen —
 * dashboard penjual ada di akun terpisah.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Divider, Icon, IconBadge, ScreenHeader, T } from '../ui';
import { rupiah } from '../data';
import { palette, spacing, type } from '../theme';
import { useStore } from '../store';
import { useAuth } from '../auth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { impact, orders, reset } = useStore();
  const insets = useSafeAreaInsets();

  const initials = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const done = orders.filter((o) => o.status === 'picked_up').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Profil" subtitle="Akun dan ringkasan aktivitasmu" />

      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl + insets.bottom }}>
        <Card>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <T style={type.h3}>{user?.name}</T>
              <T tone="muted" style={[type.small, { marginTop: 2 }]}>{user?.email}</T>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <Badge label="Akun konsumen" tone="accent" />
                <Badge label="Terverifikasi" tone="green" />
              </View>
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.lg }} />

          <T tone="muted" style={[type.small, { lineHeight: 20 }]}>
            Kamu sedang memakai akun konsumen. Setiap pesanan yang kamu ambil ikut menyelamatkan
            makanan yang seharusnya terbuang.
          </T>
          <T tone="muted" style={[type.small, { lineHeight: 20, marginTop: spacing.sm }]}>
            Mau ikut menjual makanan surplus? Daftar akun penjual — usaha kamu akan kami verifikasi
            dulu sebelum dashboard jualan terbuka.
          </T>
        </Card>

        <View style={styles.grid}>
          <Card style={{ flex: 1 }}>
            <IconBadge name="leaf" size={20} boxSize={42} />
            <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>PORSI DISELAMATKAN</T>
            <Text style={styles.num}>{impact.mealsRescued}</Text>
            <T tone="muted" style={type.tiny}>dari {done} pesanan selesai</T>
          </Card>
          <Card style={{ flex: 1 }}>
            <IconBadge name="cash" size={20} boxSize={42} />
            <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>TOTAL HEMAT</T>
            <Text style={styles.num} numberOfLines={1} adjustsFontSizeToFit>{rupiah(impact.moneySaved)}</Text>
            <T tone="muted" style={type.tiny}>dibanding harga normal</T>
          </Card>
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <Row icon="receipt-text-outline" title="Riwayat pesanan" value={`${orders.length} transaksi`} />
          <Divider style={{ marginVertical: spacing.md }} />
          <Row icon="earth" title="CO₂ dihindari" value={`${impact.co2SavedKg} kg`} />
          <Divider style={{ marginVertical: spacing.md }} />
          <Row icon="bell-outline" title="Notifikasi" value="Aktif" />
        </Card>

        <Button
          label="Keluar akun"
          variant="secondary"
          icon="logout"
          testID="btn-signout"
          onPress={signOut}
          style={{ marginTop: spacing.lg }}
        />

        <Button
          label="Reset data demo"
          variant="ghost"
          onPress={reset}
          style={{ marginTop: spacing.sm }}
        />
        <T tone="muted" style={[type.tiny, { textAlign: 'center', marginTop: spacing.sm }]}>
          Data demo tersimpan lokal di HP ini (AsyncStorage).
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, title, value }: { icon: React.ComponentProps<typeof Icon>['name']; title: string; value: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={palette.textMuted} />
      <T style={[type.body, { flex: 1 }]}>{title}</T>
      <T tone="muted" style={type.small}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  identity: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: palette.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(27,133,68,0.25)',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: palette.accent },
  grid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  num: { fontSize: 24, fontWeight: '700', color: palette.text, marginVertical: 2, letterSpacing: -0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
