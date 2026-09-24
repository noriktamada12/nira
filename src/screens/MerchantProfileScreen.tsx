/**
 * NIRA - layar Profil penjual.
 *
 * Sebelumnya sisi penjual tidak punya halaman profil sama sekali - begitu masuk
 * hanya ada dashboard, jadi penjual tidak bisa melihat atau mengubah data
 * usahanya. Layar ini melengkapi itu:
 *
 *   - identitas usaha (nama, jenis, alamat, telepon, catatan) - bisa disunting
 *   - status verifikasi (belum diajukan / menunggu / terverifikasi / ditolak)
 *   - ringkasan kinerja: pendapatan, porsi terjual, rating, jumlah ulasan
 *   - ulasan terbaru dari konsumen
 *   - tombol keluar akun
 *
 * Catatan desain: ikon memakai vektor MaterialCommunityIcons (bukan emoji),
 * tanpa gradien, tanpa bayangan berat - konsisten dengan layar lain.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, Divider, Icon, IconBadge, ScreenHeader, T } from '../ui';
import { rupiah } from '../data';
import { palette, radius, spacing, type } from '../theme';
import { useStore } from '../store';
import { useAuth, type BusinessInfo, type VerifyStatus } from '../auth';

const VERIFY_META: Record<VerifyStatus, { label: string; tone: 'neutral' | 'accent' | 'green' | 'danger'; pesan: string }> = {
  unverified: { label: 'Belum diajukan', tone: 'neutral', pesan: 'Lengkapi data usaha lalu ajukan verifikasi supaya tokomu tampil di halaman jelajah.' },
  pending: { label: 'Menunggu verifikasi', tone: 'accent', pesan: 'Data usahamu sedang kami tinjau. Biasanya selesai dalam 1x24 jam.' },
  verified: { label: 'Terverifikasi', tone: 'green', pesan: 'Toko kamu sudah terverifikasi dan bisa menerima pesanan.' },
  rejected: { label: 'Ditolak', tone: 'danger', pesan: 'Pengajuan belum bisa kami setujui. Periksa kembali data usaha lalu ajukan ulang.' },
};

const KATEGORI = ['Masakan Rumah', 'Bakery', 'Kafe', 'Restoran', 'Healthy Food', 'Lainnya'];

export default function MerchantProfileScreen() {
  const { orders, items } = useStore();
  const { user, signOut, updateBusiness } = useAuth();
  const insets = useSafeAreaInsets();

  const [sunting, setSunting] = useState(false);
  const [nama, setNama] = useState(user?.business?.businessName ?? '');
  const [kategori, setKategori] = useState(user?.business?.category ?? KATEGORI[0]);
  const [alamat, setAlamat] = useState(user?.business?.address ?? '');
  const [telepon, setTelepon] = useState(user?.business?.phone ?? '');
  const [catatan, setCatatan] = useState(user?.business?.note ?? '');

  const MID = user?.merchantId ?? 'm1';

  const kinerja = useMemo(() => {
    const milikku = orders.filter((o) => o.merchantId === MID);
    const selesai = milikku.filter((o) => o.status === 'picked_up');
    const berulas = selesai.filter((o) => o.rated && o.stars);
    return {
      pendapatan: selesai.reduce((n, o) => n + o.totalPrice, 0),
      porsi: selesai.reduce((n, o) => n + o.qty, 0),
      transaksi: selesai.length,
      rating: berulas.length ? Math.round((berulas.reduce((n, o) => n + (o.stars ?? 0), 0) / berulas.length) * 10) / 10 : 0,
      jumlahUlasan: berulas.length,
      tayang: items.filter((i) => i.merchantId === MID && i.isActive).length,
      perluAksi: milikku.filter((o) => o.status === 'paid').length,
    };
  }, [orders, items, MID]);

  const ulasan = useMemo(
    () =>
      orders
        .filter((o) => o.merchantId === MID && o.rated && (o.reviewNote || o.stars))
        .sort((a, b) => (b.ratedAt ?? '').localeCompare(a.ratedAt ?? ''))
        .slice(0, 5),
    [orders, MID],
  );

  const verify = user?.verify ?? 'unverified';
  const meta = VERIFY_META[verify];

  const simpan = () => {
    const info: BusinessInfo = {
      businessName: nama.trim() || user?.business?.businessName || 'Usaha saya',
      category: kategori,
      address: alamat.trim(),
      phone: telepon.trim(),
      note: catatan.trim() || undefined,
    };
    updateBusiness(info);
    setSunting(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Profil usaha"
        subtitle="Data toko & ringkasan kinerja"
        right={
          <Button
            label={sunting ? 'Tutup' : 'Sunting'}
            variant={sunting ? 'secondary' : 'primary'}
            onPress={() => setSunting((v) => !v)}
            style={{ height: 38 }}
          />
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl + insets.bottom }}>
        {/* ---------- identitas usaha ---------- */}
        <Card>
          <View style={styles.identitas}>
            <View style={styles.avatar}>
              <Icon name="storefront-outline" size={30} color={palette.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={type.h3}>{user?.business?.businessName ?? 'Usaha kamu'}</T>
              <T tone="muted" style={[type.small, { marginTop: 2 }]}>{user?.business?.category ?? 'Jenis usaha belum diisi'}</T>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                <Badge label={meta.label} tone={meta.tone} />
                <Badge label="Akun penjual" tone="neutral" />
              </View>
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.lg }} />

          <BarisInfo icon="account-outline" label="Nama pemilik" nilai={user?.name ?? '-'} />
          <BarisInfo icon="email-outline" label="Email" nilai={user?.email ?? '-'} />
          <BarisInfo icon="map-marker-outline" label="Alamat" nilai={user?.business?.address || 'belum diisi'} />
          <BarisInfo icon="phone-outline" label="Telepon" nilai={user?.business?.phone || 'belum diisi'} last />

          <View style={[styles.catatanKotak, { borderLeftColor: meta.tone === 'green' ? palette.green : palette.accent }]}>
            <T style={[type.small, { lineHeight: 19 }]}>{meta.pesan}</T>
          </View>
        </Card>

        {/* ---------- form sunting ---------- */}
        {sunting ? (
          <Card style={{ marginTop: spacing.lg }}>
            <T style={type.bodyStrong}>Ubah data usaha</T>
            <Divider style={{ marginVertical: spacing.md }} />

            <Kolom label="Nama usaha" value={nama} onChange={setNama} placeholder="mis. Warung Bu Sari" />
            <Kolom label="Alamat" value={alamat} onChange={setAlamat} placeholder="Jl. Diponegoro 42, Salatiga" />
            <Kolom label="Nomor telepon" value={telepon} onChange={setTelepon} placeholder="0812xxxxxxx" keyboardType="number-pad" />

            <View style={{ marginTop: spacing.md }}>
              <T tone="muted" style={type.tiny}>JENIS USAHA</T>
              <View style={styles.chips}>
                {KATEGORI.map((k) => (
                  <Button
                    key={k}
                    label={k}
                    variant={kategori === k ? 'primary' : 'secondary'}
                    onPress={() => setKategori(k)}
                    style={{ height: 34 }}
                  />
                ))}
              </View>
            </View>

            <Kolom label="Catatan tambahan" value={catatan} onChange={setCatatan} placeholder="Jam buka, nomor lantai, dll." multiline />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Button label="Batal" variant="secondary" onPress={() => setSunting(false)} style={{ flex: 1 }} />
              <Button label="Simpan" variant="primary" onPress={simpan} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : null}

        {/* ---------- ringkasan kinerja ---------- */}
        <T tone="muted" style={[type.tiny, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>RINGKASAN KINERJA</T>
        <View style={styles.grid}>
          <KotakAngka icon="cash" label="Pendapatan" nilai={rupiah(kinerja.pendapatan)} />
          <KotakAngka icon="food" label="Porsi terjual" nilai={String(kinerja.porsi)} />
        </View>
        <View style={[styles.grid, { marginTop: spacing.md }]}>
          <KotakAngka icon="star" label="Rating" nilai={kinerja.jumlahUlasan ? `${kinerja.rating} (${kinerja.jumlahUlasan})` : 'belum ada'} />
          <KotakAngka icon="package-variant-closed" label="Sedang tayang" nilai={`${kinerja.tayang} menu`} />
        </View>

        {kinerja.perluAksi > 0 ? (
          <Card style={{ marginTop: spacing.lg, backgroundColor: palette.accentSoft, borderColor: palette.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="bell-ring-outline" size={18} color={palette.accent} />
              <T style={[type.bodyStrong, { color: palette.accent, flex: 1 }]}>
                {kinerja.perluAksi} pesanan menunggu diverifikasi
              </T>
            </View>
          </Card>
        ) : null}

        {/* ---------- ulasan konsumen ---------- */}
        <T tone="muted" style={[type.tiny, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>ULASAN KONSUMEN</T>
        {ulasan.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <IconBadge name="comment-quote-outline" size={22} boxSize={46} />
              <T tone="muted" style={[type.small, { marginTop: spacing.sm, textAlign: 'center' }]}>
                Belum ada ulasan. Ulasan muncul setelah konsumen mengambil pesanan dan memberi rating.
              </T>
            </View>
          </Card>
        ) : (
          ulasan.map((o) => (
            <Card key={o.id} style={{ marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flexDirection: 'row' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name={i < (o.stars ?? 0) ? 'star' : 'star-outline'}
                      size={14}
                      color={i < (o.stars ?? 0) ? '#f5a623' : palette.textDim}
                    />
                  ))}
                </View>
                <T tone="muted" style={[type.tiny, { flex: 1 }]} numberOfLines={1}>{o.itemTitle}</T>
              </View>
              {o.reviewNote ? (
                <T style={[type.small, { marginTop: spacing.sm, lineHeight: 19 }]}>{o.reviewNote}</T>
              ) : (
                <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>Tanpa catatan</T>
              )}
            </Card>
          ))
        )}

        <Button label="Keluar akun" variant="secondary" onPress={signOut} style={{ marginTop: spacing.xl }} />
        <T tone="muted" style={[type.tiny, { textAlign: 'center', marginTop: spacing.sm }]}>
          Data usaha tersimpan lokal di HP ini untuk keperluan demo.
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------- potongan kecil */

function BarisInfo({ icon, label, nilai, last }: { icon: string; label: string; nilai: string; last?: boolean }) {
  return (
    <View style={[styles.baris, last ? { marginBottom: 0 } : null]}>
      <Icon name={icon as never} size={17} color={palette.textMuted} />
      <T tone="muted" style={[type.small, { flex: 1 }]}>{label}</T>
      <T style={[type.small, { fontWeight: '600', flexShrink: 1, textAlign: 'right' }]} numberOfLines={2}>{nilai}</T>
    </View>
  );
}

function KotakAngka({ icon, label, nilai }: { icon: string; label: string; nilai: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <IconBadge name={icon as never} size={20} boxSize={42} />
      <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>{label.toUpperCase()}</T>
      <Text style={styles.angka} numberOfLines={1} adjustsFontSizeToFit>{nilai}</Text>
    </Card>
  );
}

function Kolom({
  label, value, onChange, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChange: (s: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'number-pad'; multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <T tone="muted" style={type.tiny}>{label.toUpperCase()}</T>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.textDim}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        style={[styles.input, multiline ? { height: 72, textAlignVertical: 'top', paddingTop: 10 } : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  identitas: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 62, height: 62, borderRadius: radius.md, backgroundColor: palette.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  baris: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  catatanKotak: {
    marginTop: spacing.md, paddingLeft: spacing.md, paddingVertical: spacing.xs,
    borderLeftWidth: 3,
  },
  grid: { flexDirection: 'row', gap: spacing.md },
  angka: { fontSize: 19, fontWeight: '700', color: palette.text, marginTop: 3, letterSpacing: -0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  input: {
    marginTop: 6, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm,
    paddingHorizontal: 12, height: 44, color: palette.text, backgroundColor: palette.surface,
  },
});
