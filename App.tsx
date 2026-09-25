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
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync().catch(() => {});

import { StoreProvider, useStore } from './src/store';
import { AuthProvider, useAuth } from './src/auth';
import { initNotifications, requestNotificationPermission } from './src/notif';
import { palette, spacing, type } from './src/theme';
import { Icon, T, TabBar } from './src/ui';
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

/*_TabBar iOS dipakai dari ui.tsx (ikon 24px + badge merah). _*/

/* ---------------------------------------------------------------- Konsumen */

function ConsumerShell() {
  const { orders } = useStore();
  const [tab, setTab] = useState<ConsumerTab>('explore');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const aktif = orders.filter((o) => o.buyerRole === 'consumer' && (o.status === 'paid' || o.status === 'pending')).length;

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
          { key: 'explore', label: 'Jelajahi', icon: 'compass-outline', iconActive: 'compass' },
          { key: 'orders', label: 'Pesanan', icon: 'bookmark-outline', iconActive: 'bookmark' },
          { key: 'impact', label: 'Dampak', icon: 'leaf-circle-outline', iconActive: 'leaf' },
          { key: 'profile', label: 'Profil', icon: 'account-circle-outline', iconActive: 'account-circle' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as ConsumerTab)}
        badges={{ orders: aktif }}
      />
    </View>
  );
}

/* ----------------------------------------------------------------- Penjual */

function MerchantShell() {
  const { orders } = useStore();
  const { user } = useAuth();
  const [tab, setTab] = useState<'dashboard' | 'profile'>('dashboard');
  const MID = user?.merchantId ?? 'm1';
  const perlu = orders.filter((o) => o.merchantId === MID && o.status === 'paid').length;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {tab === 'dashboard' ? <MerchantScreen /> : <MerchantProfileScreen />}
      </View>

      <TabBar
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', iconActive: 'view-dashboard' },
          { key: 'profile', label: 'Profil usaha', icon: 'storefront-outline', iconActive: 'storefront' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as 'dashboard' | 'profile')}
        badges={{ dashboard: perlu }}
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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
});
