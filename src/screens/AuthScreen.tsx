/**
 * NIRA - layar Masuk / Daftar.
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

import { Button, Card, Divider, Icon, T } from '../ui';
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
          {/* Kepala */}
          <View style={styles.brand}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoBox}
              resizeMode="cover"
              accessibilityLabel="Logo NIRA"
            />
            <Text style={styles.brandName}>NIRA</Text>
            <T tone="muted" style={[type.small, { textAlign: 'center', marginTop: 2 }]}>
              Setiap rasa masih bernilai
            </T>
          </View>

          {/* Pilih peran */}
          <View style={styles.roleRow}>
            {([
              { key: 'consumer' as Role, label: 'Konsumen', icon: 'account-outline' as const },
              { key: 'merchant' as Role, label: 'Penjual', icon: 'storefront-outline' as const },
            ]).map((it) => {
              const on = role === it.key;
              return (
                <Pressable
                  key={it.key}
                  testID={`pick-${it.key}`}
                  onPress={() => { setRole(it.key); setErr(null); }}
                  style={[styles.roleCard, on && styles.roleCardOn]}
                >
                  <Icon name={it.icon} size={22} color={on ? '#fff' : palette.textMuted} />
                  <Text style={[type.bodyStrong, { color: on ? '#fff' : palette.text, marginTop: 4 }]}>
                    {it.label}
                  </Text>
                  <Text
                    style={[
                      type.tiny,
                      { color: on ? 'rgba(255,255,255,0.85)' : palette.textDim, marginTop: 1, textAlign: 'center' },
                    ]}
                  >
                    {it.key === 'consumer' ? 'Cari & pesan makanan' : 'Jual surplus usaha'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Card style={{ marginTop: spacing.lg }}>
            {/* Tab masuk/daftar */}
            <View style={styles.tabs}>
              {(['signin', 'signup'] as Mode[]).map((m) => {
                const on = mode === m;
                return (
                  <Pressable key={m} testID={`tab-${m}`} onPress={() => { setMode(m); setErr(null); }} style={styles.tab}>
                    <Text style={[type.bodyStrong, { color: on ? palette.accent : palette.textMuted }]}>
                      {m === 'signin' ? 'Masuk' : 'Daftar'}
                    </Text>
                    {on ? <View style={styles.tabLine} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <Divider style={{ marginTop: spacing.sm }} />

            {mode === 'signup' ? (
              <Field label="Nama lengkap" value={name} onChange={setName} placeholder="cth. Mada" testID="in-name" />
            ) : null}

            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="nama@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              testID="in-email"
            />

            <View style={{ marginTop: spacing.md }}>
              <T tone="muted" style={type.tiny}>KATA SANDI</T>
              <View style={styles.pwWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={mode === 'signup' ? 'minimal 6 karakter' : 'kata sandi kamu'}
                  placeholderTextColor={palette.textDim}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  testID="in-password"
                  style={styles.pwInput}
                />
                <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8} style={styles.pwEye}>
                  <Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color={palette.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Data usaha khusus penjual */}
            {mode === 'signup' && role === 'merchant' ? (
              <View style={{ marginTop: spacing.lg }}>
                <View style={styles.merchantNote}>
                  <Icon name="shield-check-outline" size={17} color={palette.accent} />
                  <T style={[type.tiny, { color: palette.accent, flex: 1 }]}>
                    Data usaha dipakai untuk verifikasi. Dashboard penjual terbuka setelah disetujui.
                  </T>
                </View>

                <Field label="Nama usaha" value={bizName} onChange={setBizName} placeholder="cth. Warung Bu Sari" testID="in-biz" />

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

                <Field label="Alamat usaha" value={bizAddr} onChange={setBizAddr} placeholder="Jl. ... No. ..., Kota" testID="in-addr" />
                <Field
                  label="Nomor WhatsApp usaha"
                  value={bizPhone}
                  onChange={setBizPhone}
                  placeholder="08xx-xxxx-xxxx"
                  keyboardType="phone-pad"
                  testID="in-phone"
                />
              </View>
            ) : null}

            {err ? (
              <View style={styles.errBox}>
                <Icon name="alert-circle-outline" size={16} color={palette.danger} />
                <T style={[type.small, { color: palette.danger, flex: 1 }]}>{err}</T>
              </View>
            ) : null}

            <Button
              label={mode === 'signin' ? 'Masuk' : role === 'merchant' ? 'Daftar & ajukan verifikasi' : 'Daftar & mulai'}
              variant="primary"
              testID="btn-submit"
              onPress={submit}
              style={{ marginTop: spacing.lg }}
            />
          </Card>

          {/* Akun demo */}
          {mode === 'signin' ? (
            <Card style={{ marginTop: spacing.md, backgroundColor: palette.surfaceAlt }}>
              <T tone="muted" style={[type.tiny, { marginBottom: spacing.sm }]}>COBA CEPAT (AKUN DEMO)</T>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button
                  label="Konsumen"
                  icon="account-outline"
                  variant="secondary"
                  testID="demo-consumer"
                  onPress={() => fillDemo('consumer')}
                  style={{ flex: 1, height: 40 }}
                />
                <Button
                  label="Penjual"
                  icon="storefront-outline"
                  variant="secondary"
                  testID="demo-merchant"
                  onPress={() => fillDemo('merchant')}
                  style={{ flex: 1, height: 40 }}
                />
              </View>
            </Card>
          ) : null}

          <T tone="muted" style={[type.tiny, { textAlign: 'center', marginTop: spacing.lg }]}>
            Data akun disimpan lokal di HP ini untuk keperluan demo.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  autoCapitalize,
  testID,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  testID?: string;
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
        autoCapitalize={autoCapitalize ?? 'sentences'}
        testID={testID}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { padding: spacing.gutter, paddingBottom: spacing.xxl },
  brand: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  logoBox: {
    width: 64, height: 64, borderRadius: 18,
  },
  brandName: { fontSize: 26, fontWeight: '700', color: palette.text, marginTop: spacing.sm, letterSpacing: -0.5 },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border,
    backgroundColor: palette.surface, paddingVertical: spacing.md, alignItems: 'center',
  },
  roleCardOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  tabs: { flexDirection: 'row', gap: spacing.lg },
  tab: { paddingBottom: spacing.sm },
  tabLine: { height: 2, backgroundColor: palette.accent, borderRadius: 2, marginTop: 6 },
  input: {
    height: 44, borderRadius: radius.sm, backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border, paddingHorizontal: spacing.md,
    fontSize: 14, color: palette.text, marginTop: 4,
  },
  pwWrap: {
    height: 44, borderRadius: radius.sm, backgroundColor: palette.surface, marginTop: 4,
    borderWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center',
    paddingLeft: spacing.md, paddingRight: 6,
  },
  pwInput: { flex: 1, fontSize: 14, color: palette.text, height: '100%' },
  pwEye: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  merchantNote: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'center',
    backgroundColor: palette.accentSoft, borderRadius: radius.sm, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(27,133,68,0.25)',
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
    borderWidth: 1, borderColor: 'rgba(223,63,64,0.25)',
  },
});
