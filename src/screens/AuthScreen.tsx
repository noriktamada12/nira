/**
 * NIRA - layar Masuk / Daftar (gaya iOS).
 *
 * Alur: pilih peran (Konsumen / Penjual) -> isi data -> masuk ke app.
 * Penjual mengisi data usaha saat daftar dan wajib menunggu verifikasi.
 */
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chevron, Group, Icon, T } from '../ui';
import { palette, radius, spacing, type } from '../theme';
import { DEMO_CONSUMER, DEMO_MERCHANT, useAuth, type BusinessInfo } from '../auth';
import type { Role } from '../types';

type Mode = 'signin' | 'signup';

const CATEGORIES = ['Masakan Rumah', 'Bakery', 'Kafe', 'Restoran', 'Healthy Food', 'Lainnya'];

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [role, setRole] = useState<Role>('consumer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizCat, setBizCat] = useState(CATEGORIES[0]);
  const [bizAddr, setBizAddr] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    setErr(null);
    if (mode === 'signin') {
      const r = signIn(email, password);
      if (!r.ok) setErr(r.error);
      return;
    }
    const business: BusinessInfo | undefined =
      role === 'merchant'
        ? { businessName: bizName.trim(), category: bizCat, address: bizAddr.trim(), phone: bizPhone.trim() }
        : undefined;
    const r = signUp({ name, email, password, role, business });
    if (!r.ok) setErr(r.error);
  }

  function fillDemo(which: 'consumer' | 'merchant') {
    const d = which === 'consumer' ? DEMO_CONSUMER : DEMO_MERCHANT;
    setMode('signin');
    setEmail(d.email);
    setPassword(d.password);
    setErr(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImg}
                resizeMode="cover"
                accessibilityLabel="Logo NIRA"
              />
            </View>
            <Text style={styles.brandName}>NIRA</Text>
            <T tone="muted" style={[type.small, { textAlign: 'center', marginTop: 2 }]}>
              Setiap rasa masih bernilai
            </T>
          </View>

          {/* Pilih peran */}
          <View style={styles.roleRow}>
            {([
              { key: 'consumer' as Role, label: 'Konsumen', desc: 'Cari dan pesan makanan', icon: 'account' as const },
              { key: 'merchant' as Role, label: 'Penjual', desc: 'Jual surplus usaha', icon: 'storefront' as const },
            ]).map((it) => {
              const on = role === it.key;
              return (
                <Pressable
                  key={it.key}
                  testID={`pick-${it.key}`}
                  onPress={() => { setRole(it.key); setErr(null); }}
                  style={[styles.roleCard, on && styles.roleCardOn]}
                >
                  <View style={[styles.roleIcon, on && styles.roleIconOn]}>
                    <Icon name={it.icon} size={24} color={on ? '#fff' : palette.accent} />
                  </View>
                  <Text style={[type.bodyStrong, { color: palette.text, marginTop: 8 }]}>
                    {it.label}
                  </Text>
                  <Text style={[type.tiny, { color: palette.textDim, marginTop: 1, textAlign: 'center' }]}>
                    {it.desc}
                  </Text>
                  {on ? (
                    <View style={styles.roleCheck}>
                      <Icon name="check-circle" size={18} color={palette.accent} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Tab masuk/daftar */}
          <View style={styles.segment}>
            {(['signin', 'signup'] as Mode[]).map((m) => {
              const on = mode === m;
              return (
                <Pressable
                  key={m}
                  testID={`tab-${m}`}
                  onPress={() => { setMode(m); setErr(null); }}
                  style={[styles.segmentOpt, on && styles.segmentOptOn]}
                >
                  <Text style={[type.bodyStrong, { color: on ? palette.text : palette.textMuted }]}>
                    {m === 'signin' ? 'Masuk' : 'Daftar'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Form dalam sel grup */}
          <Group style={{ marginTop: spacing.md }}>
            {mode === 'signup' ? (
              <View style={styles.cellInput}>
                <Text style={styles.cellLabel}>Nama</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="cth. Mada"
                  placeholderTextColor={palette.textDim}
                  testID="in-name"
                  style={styles.cellField}
                />
              </View>
            ) : null}
            <View style={styles.cellInput}>
              <Text style={styles.cellLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="nama@email.com"
                placeholderTextColor={palette.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="in-email"
                style={styles.cellField}
              />
            </View>
            <View style={[styles.cellInput, styles.cellLast]}>
              <Text style={styles.cellLabel}>Sandi</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'minimal 6 karakter' : 'kata sandi kamu'}
                placeholderTextColor={palette.textDim}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                testID="in-password"
                style={[styles.cellField, { flex: 1 }]}
              />
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8} style={styles.pwEye}>
                <Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color={palette.textMuted} />
              </Pressable>
            </View>
          </Group>

          {/* Data usaha khusus penjual */}
          {mode === 'signup' && role === 'merchant' ? (
            <View style={{ marginTop: spacing.lg }}>
              <View style={styles.merchantNote}>
                <Icon name="shield-check-outline" size={17} color={palette.accent} />
                <T style={[type.tiny, { color: palette.accent, flex: 1 }]}>
                  Data usaha dipakai untuk verifikasi. Dashboard penjual terbuka setelah disetujui.
                </T>
              </View>

              <Group style={{ marginTop: spacing.md }}>
                <View style={styles.cellInput}>
                  <Text style={styles.cellLabel}>Usaha</Text>
                  <TextInput
                    value={bizName}
                    onChangeText={setBizName}
                    placeholder="cth. Warung Bu Sari"
                    placeholderTextColor={palette.textDim}
                    testID="in-biz"
                    style={styles.cellField}
                  />
                </View>
                <View style={styles.cellInput}>
                  <Text style={styles.cellLabel}>Alamat</Text>
                  <TextInput
                    value={bizAddr}
                    onChangeText={setBizAddr}
                    placeholder="Jl. ... No. ..., Kota"
                    placeholderTextColor={palette.textDim}
                    testID="in-addr"
                    style={styles.cellField}
                  />
                </View>
                <View style={[styles.cellInput, styles.cellLast]}>
                  <Text style={styles.cellLabel}>WA</Text>
                  <TextInput
                    value={bizPhone}
                    onChangeText={setBizPhone}
                    placeholder="08xx-xxxx-xxxx"
                    placeholderTextColor={palette.textDim}
                    keyboardType="phone-pad"
                    testID="in-phone"
                    style={styles.cellField}
                  />
                </View>
              </Group>

              <T tone="muted" style={[type.tiny, { marginTop: spacing.md }]}>KATEGORI USAHA</T>
              <View style={styles.catWrap}>
                {CATEGORIES.map((c) => {
                  const on = c === bizCat;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setBizCat(c)}
                      style={[styles.cat, on && styles.catOn]}
                    >
                      <Text style={[type.tiny, { color: on ? '#fff' : palette.text }]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {err ? (
            <View style={styles.errBox}>
              <Icon name="alert-circle-outline" size={16} color={palette.danger} />
              <T style={[type.small, { color: palette.danger, flex: 1 }]}>{err}</T>
            </View>
          ) : null}

          <Button
            label={mode === 'signin' ? 'Masuk' : role === 'merchant' ? 'Daftar dan ajukan verifikasi' : 'Daftar dan mulai'}
            variant="blue"
            testID="btn-submit"
            onPress={submit}
            style={{ marginTop: spacing.lg }}
          />

          {/* Akun demo */}
          {mode === 'signin' ? (
            <View style={{ marginTop: spacing.lg }}>
              <T tone="muted" style={[type.tiny, { marginBottom: spacing.sm }]}>COBA CEPAT (AKUN DEMO)</T>
              <Group>
                <Pressable testID="demo-consumer" onPress={() => fillDemo('consumer')} style={styles.demoRow}>
                  <View style={styles.demoIcon}>
                    <Icon name="account-outline" size={21} color={palette.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={type.body}>Masuk sebagai Konsumen</Text>
                    <Text style={[type.tiny, { color: palette.textDim }]}>konsumen@nira.id</Text>
                  </View>
                  <Chevron />
                </Pressable>
                <Pressable testID="demo-merchant" onPress={() => fillDemo('merchant')} style={styles.demoRow}>
                  <View style={styles.demoIcon}>
                    <Icon name="storefront-outline" size={21} color={palette.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={type.body}>Masuk sebagai Penjual</Text>
                    <Text style={[type.tiny, { color: palette.textDim }]}>penjual@nira.id</Text>
                  </View>
                  <Chevron />
                </Pressable>
              </Group>
            </View>
          ) : null}

          <T tone="muted" style={[type.tiny, { textAlign: 'center', marginTop: spacing.lg }]}>
            Data akun disimpan lokal di HP ini untuk keperluan demo.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { padding: spacing.gutter, paddingBottom: spacing.xxl },
  brand: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  logoBox: {
    width: 76, height: 76, borderRadius: 20, backgroundColor: palette.accent,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logoImg: { width: 76, height: 76, borderRadius: 20 },
  brandName: { fontSize: 34, fontWeight: '700', color: palette.text, marginTop: spacing.sm, letterSpacing: -0.7 },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface, paddingVertical: spacing.lg, alignItems: 'center',
    position: 'relative',
  },
  roleCardOn: { borderColor: palette.accent, borderWidth: 1.5 },
  roleIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: palette.greenSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIconOn: { backgroundColor: palette.accent },
  roleCheck: { position: 'absolute', top: 8, right: 8 },
  segment: {
    flexDirection: 'row', backgroundColor: palette.grouped, borderRadius: 10,
    padding: 2, marginTop: spacing.lg,
  },
  segmentOpt: { flex: 1, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  segmentOptOn: { backgroundColor: palette.surface },
  cellInput: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: 4, paddingHorizontal: spacing.lg, minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border,
  },
  cellLast: { borderBottomWidth: 0 },
  cellLabel: { width: 52, fontSize: 15, color: palette.textMuted },
  cellField: { flex: 1, fontSize: 15, color: palette.text, paddingVertical: 10, paddingHorizontal: 0 },
  pwEye: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  merchantNote: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'center',
    backgroundColor: palette.greenSoft, borderRadius: radius.sm, padding: spacing.md,
  },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  cat: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
    borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface,
  },
  catOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  errBox: {
    flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: spacing.md,
    backgroundColor: palette.dangerSoft, borderRadius: radius.sm, padding: spacing.md,
  },
  demoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: 11, paddingHorizontal: spacing.lg,
  },
  demoIcon: {
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
});
