/**
 * NIRA - layar status verifikasi penjual.
 *
 * Tampil untuk akun penjual yang statusnya 'pending' atau 'rejected'.
 * Dashboard jualan tidak terbuka sampai verifikasi disetujui.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Divider, Icon, T } from '../ui';
import { palette, radius, spacing, type } from '../theme';
import { useAuth, type BusinessInfo } from '../auth';

const CATEGORIES = ['Masakan Rumah', 'Bakery', 'Kafe', 'Restoran', 'Healthy Food', 'Lainnya'];

export default function VerifyScreen() {
  const { user, signOut, submitVerification, approveVerification } = useAuth();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [bizName, setBizName] = useState(user?.business?.businessName ?? '');
  const [bizCat, setBizCat] = useState(user?.business?.category ?? CATEGORIES[0]);
  const [bizAddr, setBizAddr] = useState(user?.business?.address ?? '');
  const [bizPhone, setBizPhone] = useState(user?.business?.phone ?? '');

  const rejected = user?.verify === 'rejected';

  function saveEdits() {
    const info: BusinessInfo = {
      businessName: bizName.trim(),
      category: bizCat,
      address: bizAddr.trim(),
      phone: bizPhone.trim(),
    };
    submitVerification(info);
    setEditing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingBottom: spacing.xxl + insets.bottom }}>
        <View style={styles.head}>
          <View style={[styles.iconWrap, rejected && { backgroundColor: palette.dangerSoft }]}>
            <Icon
              name={rejected ? 'alert-circle-outline' : 'clock-outline'}
              size={34}
              color={rejected ? palette.danger : palette.warning}
            />
          </View>
          <Text style={type.h1}>{rejected ? 'Verifikasi ditolak' : 'Menunggu verifikasi'}</Text>
          <T tone="muted" style={[type.small, { textAlign: 'center', marginTop: 6, maxWidth: 300 }]}>
            {rejected
              ? 'Data usaha perlu diperbaiki. Perbarui datanya lalu kirim ulang untuk ditinjau kembali.'
              : 'Tim NIRA sedang meninjau data usaha kamu. Dashboard penjual akan terbuka otomatis setelah disetujui.'}
          </T>
        </View>

        <Card>
          <T tone="muted" style={type.tiny}>AKUN</T>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <T style={type.bodyStrong}>{user?.name}</T>
              <T tone="muted" style={[type.small, { marginTop: 1 }]}>{user?.email}</T>
            </View>
            <View style={styles.roleChip}>
              <Icon name="storefront-outline" size={13} color={palette.accent} />
              <T style={[type.tiny, { color: palette.accent }]}>Penjual</T>
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.md }} />

          <T tone="muted" style={type.tiny}>DATA USAHA</T>
          {editing ? (
            <View>
              <Input label="Nama usaha" value={bizName} onChange={setBizName} />
              <T tone="muted" style={[type.tiny, { marginTop: spacing.md }]}>KATEGORI</T>
              <View style={styles.catWrap}>
                {CATEGORIES.map((c) => {
                  const on = c === bizCat;
                  return (
                    <Button
                      key={c}
                      label={c}
                      variant={on ? 'primary' : 'secondary'}
                      onPress={() => setBizCat(c)}
                      style={{ height: 32, paddingHorizontal: 10, marginTop: spacing.sm }}
                    />
                  );
                })}
              </View>
              <Input label="Alamat" value={bizAddr} onChange={setBizAddr} />
              <Input label="Nomor WhatsApp" value={bizPhone} onChange={setBizPhone} />
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
                <Button label="Simpan & kirim ulang" variant="primary" onPress={saveEdits} style={{ flex: 1, height: 42 }} />
                <Button label="Batal" variant="secondary" onPress={() => setEditing(false)} style={{ height: 42 }} />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 4 }}>
              <InfoRow icon="storefront-outline" label="Nama usaha" value={user?.business?.businessName ?? '-'} />
              <InfoRow icon="tag-outline" label="Kategori" value={user?.business?.category ?? '-'} />
              <InfoRow icon="map-marker-outline" label="Alamat" value={user?.business?.address ?? '-'} />
              <InfoRow icon="whatsapp" label="WhatsApp" value={user?.business?.phone ?? '-'} />
            </View>
          )}
        </Card>

        <Card style={{ marginTop: spacing.md, backgroundColor: palette.surfaceAlt }}>
          <T style={type.bodyStrong}>Apa yang diperiksa?</T>
          <Step n={1} text="Kelengkapan & kejelasan data usaha" />
          <Step n={2} text="Kesesuaian kategori dengan jenis makanan" />
          <Step n={3} text="Validasi alamat dan kontak yang bisa dihubungi" last />
          <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>
            Biasanya selesai dalam 1×24 jam kerja.
          </T>
        </Card>

        {!editing ? (
          <Button
            label={rejected ? 'Perbarui data usaha' : 'Ubah data usaha'}
            variant="secondary"
            icon="pencil-outline"
            onPress={() => setEditing(true)}
            style={{ marginTop: spacing.lg }}
          />
        ) : null}

        {/* Demo: tombol ini menggantikan panel admin yang menyetujui. */}
        <Card style={{ marginTop: spacing.md, backgroundColor: palette.accentSoft, borderColor: 'rgba(27,133,68,0.25)' }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="information-outline" size={17} color={palette.accent} />
            <T style={[type.tiny, { color: palette.accent, flex: 1 }]}>
              Mode demo: tombol di bawah berperan sebagai admin yang menyetujui verifikasi.
            </T>
          </View>
          <Button
            label="Setujui sekarang (demo)"
            variant="green"
            testID="btn-approve"
            onPress={approveVerification}
            style={{ marginTop: spacing.md, height: 40 }}
          />
        </Card>

        <Button label="Keluar akun" variant="ghost" onPress={signOut} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <T tone="muted" style={type.tiny}>{label.toUpperCase()}</T>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={{
          height: 42, borderRadius: radius.sm, backgroundColor: palette.surface,
          borderWidth: 1, borderColor: palette.border, paddingHorizontal: spacing.md,
          fontSize: 14, color: palette.text, marginTop: 4,
        }}
      />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={16} color={palette.textMuted} />
      <View style={{ flex: 1 }}>
        <T tone="muted" style={type.tiny}>{label.toUpperCase()}</T>
        <T style={type.body}>{value}</T>
      </View>
    </View>
  );
}

function Step({ n, text, last }: { n: number; text: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: last ? 0 : 0 }}>
      <View style={styles.stepNum}>
        <Text style={[type.tiny, { color: palette.accent, fontWeight: '700' }]}>{n}</Text>
      </View>
      <T tone="muted" style={[type.small, { flex: 1, marginTop: 1 }]}>{text}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  head: { alignItems: 'center', paddingVertical: spacing.xl },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: palette.warningSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: palette.accentSoft, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  infoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', marginTop: spacing.md },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: palette.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
});
