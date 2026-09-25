/**
 * NIRA - layar status verifikasi penjual (gaya iOS).
 *
 * Tampil untuk akun penjual yang statusnya 'pending' atau 'rejected'.
 * Dashboard jualan tidak terbuka sampai verifikasi disetujui.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Cell, Group, Icon, LargeTitle, SectionLabel, T } from '../ui';
import { palette, radius, spacing, type, TABBAR_SPACE } from '../theme';
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
      <LargeTitle
        title={rejected ? 'Verifikasi Ditolak' : 'Verifikasi Usaha'}
        subtitle={
          rejected
            ? 'Perbaiki data usaha lalu kirim ulang'
            : 'Dashboard penjual terbuka setelah disetujui'
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingTop: 0, paddingBottom: spacing.xxl + insets.bottom + TABBAR_SPACE }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={[styles.iconBox, rejected && { backgroundColor: palette.dangerSoft }]}>
              <Icon
                name={rejected ? 'alert-circle-outline' : 'clock-outline'}
                size={26}
                color={rejected ? palette.danger : palette.star}
              />
            </View>
            <View style={{ flex: 1 }}>
              <T style={type.bodyStrong}>{rejected ? 'Perlu perbaikan data' : 'Sedang ditinjau'}</T>
              <T tone="muted" style={[type.small, { marginTop: 2, lineHeight: 19 }]}>
                {rejected
                  ? 'Data usaha perlu diperbaiki. Perbarui datanya lalu kirim ulang untuk ditinjau kembali.'
                  : 'Tim NIRA sedang meninjau data usaha kamu. Biasanya selesai dalam 1x24 jam kerja.'}
              </T>
            </View>
          </View>
        </Card>

        <SectionLabel text="Akun" />
        <Group>
          <Cell label={user?.name ?? '-'} value={user?.email ?? ''} />
          <Cell label="Peran" value="Penjual" />
        </Group>

        <SectionLabel text="Data Usaha" />
        {editing ? (
          <Card>
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
              <Button label="Simpan dan kirim ulang" variant="primary" onPress={saveEdits} style={{ flex: 1, height: 44 }} />
              <Button label="Batal" variant="secondary" onPress={() => setEditing(false)} style={{ height: 44 }} />
            </View>
          </Card>
        ) : (
          <Group>
            <Cell label="Nama usaha" value={user?.business?.businessName ?? '-'} />
            <Cell label="Kategori" value={user?.business?.category ?? '-'} />
            <Cell label="Alamat" value={user?.business?.address ?? '-'} />
            <Cell label="WhatsApp" value={user?.business?.phone ?? '-'} />
            <Cell
              label={rejected ? 'Perbarui data usaha' : 'Ubah data usaha'}
              onPress={() => setEditing(true)}
              testID="btn-edit-verify"
            />
          </Group>
        )}

        <SectionLabel text="Yang Diperiksa" />
        <Group>
          <Cell label="Kelengkapan data usaha" value="Langkah 1" />
          <Cell label="Kesesuaian kategori makanan" value="Langkah 2" />
          <Cell label="Alamat dan kontak valid" value="Langkah 3" />
        </Group>

        {/* Demo: tombol ini menggantikan panel admin yang menyetujui. */}
        <Card style={{ marginTop: spacing.lg, backgroundColor: palette.greenSoft }}>
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
            style={{ marginTop: spacing.md, height: 44 }}
          />
        </Card>

        <SectionLabel text="Akun" />
        <Group>
          <Cell label="Keluar akun" onPress={signOut} testID="btn-verify-signout" />
        </Group>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  iconBox: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: palette.warningSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
