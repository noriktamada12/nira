/**
 * NIRA - akar aplikasi.
 *
 * Arsitektur baru: peran mengikuti AKUN, bukan sakelar manual.
 *   - Belum masuk             -> layar Masuk / Daftar
 *   - Akun penjual (pending)  -> layar status verifikasi (dashboard terkunci)
 *   - Akun penjual (verified) -> Dashboard penjual
 *   - Akun konsumen           -> Jelajahi / Pesanan / Dampak / Profil
 *
 * Alur konsumen dan penjual benar-benar terpisah: tidak ada lagi tombol
 * ganti peran di dalam aplikasi.
 */
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from './src/store';
import { AuthProvider, useAuth } from './src/auth';
import { initNotifications, requestNotificationPermission } from './src/notif';
import { palette, spacing, type } from './src/theme';
import { Icon, T } from './src/ui';
import type { IconName } from './src/ui';

import ExploreScreen from './src/screens/ExploreScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MerchantScreen from './src/screens/MerchantScreen';
import MerchantProfileScreen from './src/screens/MerchantProfileScreen';
import ImpactScreen from './src/screens/ImpactScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import VerifyScreen from './src/screens/VerifyScreen';

type ConsumerTab = 'explore' | 'orders' | 'impact' | 'profile';

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon: IconName }[];
  active: string;
  onChange: (k: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(6, insets.bottom) }]}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} testID={`tab-${t.key}`} onPress={() => onChange(t.key)} style={styles.tabItem}>
            <Icon name={t.icon} size={21} color={on ? palette.accent : palette.textMuted} />
            <Text
              style={[
                type.tiny,
                { color: on ? palette.accent : palette.textMuted, marginTop: 2, fontWeight: on ? '600' : '500' },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------------- Konsumen */

function ConsumerShell() {
  const [tab, setTab] = useState<ConsumerTab>('explore');
  const [openItem, setOpenItem] = useState<string | null>(null);

  if (openItem !== null) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <ItemDetailScreen
          itemId={openItem}
          onBack={() => setOpenItem(null)}
          onOrdered={(o) => {
            setOpenItem(null);
            setTab('orders');
            Alert.alert(
              'Pesanan berhasil',
              `Kode pickup kamu: ${o.code}\n\nTunjukkan kode ini ke penjual saat mengambil makanan.`,
            );
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {tab === 'explore' ? (
          <ExploreScreen onOpenItem={setOpenItem} />
        ) : tab === 'orders' ? (
          <OrdersScreen />
        ) : tab === 'impact' ? (
          <ImpactScreen />
        ) : (
          <ProfileScreen />
        )}
      </View>

      <TabBar
        tabs={[
          { key: 'explore', label: 'Jelajahi', icon: 'food-variant' },
          { key: 'orders', label: 'Pesanan', icon: 'receipt-text-outline' },
          { key: 'impact', label: 'Dampak', icon: 'leaf' },
          { key: 'profile', label: 'Profil', icon: 'account-circle-outline' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as ConsumerTab)}
      />
    </View>
  );
}

/* ----------------------------------------------------------------- Penjual */

function MerchantShell() {
  const [tab, setTab] = useState<'dashboard' | 'profile'>('dashboard');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {tab === 'dashboard' ? <MerchantScreen /> : <MerchantProfileScreen />}
      </View>

      <TabBar
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
          { key: 'profile', label: 'Profil usaha', icon: 'storefront-outline' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as 'dashboard' | 'profile')}
      />
    </View>
  );
}

/* ------------------------------------------------------------------- Shell */

function Shell() {
  const { ready: storeReady } = useStore();
  const { ready: authReady, user } = useAuth();

  // Inisialisasi notifikasi lokal sekali saat app dibuka.
  useEffect(() => {
    initNotifications();
    void requestNotificationPermission();
  }, []);

  if (!authReady || !storeReady) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Icon name="food-variant" size={38} color={palette.accent} />
        <T tone="muted" style={[type.small, { marginTop: spacing.sm }]}>Memuat NIRA…</T>
      </View>
    );
  }

  // Belum masuk -> layar autentikasi.
  if (!user) return <AuthScreen />;

  // Penjual: wajib lolos verifikasi sebelum dashboard terbuka.
  if (user.role === 'merchant') {
    if (user.verify !== 'verified') return <VerifyScreen />;
    return <MerchantShell />;
  }

  // Konsumen.
  return <ConsumerShell />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  tabbar: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    paddingBottom: 6,
    paddingTop: 7,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
