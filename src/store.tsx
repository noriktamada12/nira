/**
 * NIRA - state global.
 *
 * Satu store dipakai bersama konsumen & penjual supaya alurnya nyambung:
 * pesanan yang dibuat konsumen langsung muncul di dashboard penjual.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MERCHANTS,
  computeImpact,
  initialState,
  loadState,
  merchantStats,
  pickupCode,
  saveState,
  type AppState,
} from './data';
import { notify } from './notif';
import type { ImpactStats, Merchant, Order, SurplusItem } from './types';

interface Ctx extends AppState {
  ready: boolean;
  merchants: Merchant[];
  impact: ImpactStats;
  getItem: (id: string) => SurplusItem | undefined;
  merchantOfId: (id: string) => Merchant;
  /** Konsumen memesan porsi. Mengurangi stok porsi secara atomik. */
  placeOrder: (itemId: string, qty: number) => Order | null;
  /** Penjual memverifikasi bahwa konsumen sudah mengambil makanan. */
  confirmPickup: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  /** Konsumen memberi rating bintang + komentar setelah ambil. */
  rateOrder: (orderId: string, stars: number, reviewNote?: string) => void;
  /** Penjual mengunggah makanan surplus baru. */
  addSurplus: (draft: Omit<SurplusItem, 'id' | 'isActive' | 'expiresAt'> & { hoursValid?: number }) => void;
  /**
   * Penjual menyunting surplus yang sudah tayang: porsi, harga, judul,
   * catatan, jam ambil, masa berlaku. Tanpa ini stok yang sudah masuk
   * daftar surplus tidak bisa diubah.
   */
  editItem: (id: string, ubah: Partial<SurplusItem> & { hoursValid?: number }) => void;
  /** Penjual menghapus surplus dari daftar tayang. */
  removeItem: (id: string) => void;
  statsFor: (merchantId: string) => ReturnType<typeof merchantStats>;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadState().then((s) => {
      if (!alive) return;
      setState(s);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [state, ready]);

  const getItem = useCallback((id: string) => state.items.find((i) => i.id === id), [state.items]);

  const merchantOfId = useCallback(
    (id: string) => MERCHANTS.find((m) => m.id === id) ?? MERCHANTS[0],
    [],
  );

  const placeOrder = useCallback<Ctx['placeOrder']>(
    (itemId, qty) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item || item.portions < qty || qty < 1) return null;
      const m = MERCHANTS.find((x) => x.id === item.merchantId) ?? MERCHANTS[0];
      const order: Order = {
        id: 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        code: pickupCode(),
        itemId: item.id,
        itemTitle: item.title,
        merchantId: item.merchantId,
        merchantName: m.name,
        icon: item.icon,
        photo: item.photo,
        buyerRole: 'consumer',
        qty,
        unitPrice: item.price,
        originalPrice: item.originalPrice,
        totalPrice: item.price * qty,
        status: 'paid', // demo: pembayaran dianggap langsung berhasil
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        items: prev.items.map((i) =>
          i.id === itemId
            ? { ...i, portions: Math.max(0, i.portions - qty), isActive: i.portions - qty > 0 }
            : i,
        ),
        orders: [order, ...prev.orders],
      }));

      // Notifikasi: konsumen dapat kode pickup, penjual dapat pesanan masuk.
      void notify(
        'Pesanan dikonfirmasi',
        `${order.itemTitle} · kode pickup ${order.code}. Tunjukkan ke kasir saat mengambil.`,
      );
      void notify(
        'Pesanan masuk',
        `${order.qty} porsi ${order.itemTitle} · kode ${order.code}`,
        2,
      );

      return order;
    },
    [state.items],
  );

  const confirmPickup = useCallback((orderId: string) => {
    const target = state.orders.find((o) => o.id === orderId);
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'picked_up', pickedUpAt: new Date().toISOString() } : o,
      ),
    }));
    if (target && target.status !== 'picked_up') {
      void notify(
        'Makanan terselamatkan',
        `${target.qty} porsi ${target.itemTitle} berhasil diambil. Terima kasih!`,
      );
    }
  }, [state.orders]);

  const cancelOrder = useCallback((orderId: string) => {
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order || order.status === 'picked_up') return prev;
      return {
        items: prev.items.map((i) =>
          i.id === order.itemId ? { ...i, portions: i.portions + order.qty, isActive: true } : i,
        ),
        orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)),
      };
    });
  }, []);

  const addSurplus = useCallback<Ctx['addSurplus']>((draft) => {
    const hours = draft.hoursValid ?? 6;
    const item: SurplusItem = {
      ...draft,
      id: 'i' + Date.now().toString(36),
      isActive: true,
      expiresAt: new Date(Date.now() + hours * 3600_000).toISOString(),
    };
    setState((prev) => ({ ...prev, items: [item, ...prev.items] }));
    void notify('Surplus dipublikasikan', `${item.title} · ${item.portions} porsi siap dipesan`);
  }, []);

  /**
   * Sunting surplus yang SUDAH tayang.
   *
   * Sebelumnya tidak ada fungsi ini, jadi stok yang sudah masuk daftar
   * surplus tidak bisa diubah sama sekali. Sekarang jumlah porsi, harga,
   * judul, catatan, jam ambil, dan masa berlaku semuanya bisa diedit.
   *
   * Aturan penting:
   *   - Porsi tidak boleh lebih kecil dari yang SUDAH dipesan orang.
   *   - Kalau porsi diisi 0, item otomatis dinonaktifkan (tidak tayang).
   *   - Kalau porsi dinaikkan dari 0, item otomatis tayang kembali.
   *   - Masa berlaku dihitung ulang dari jamValidasi sekarang.
   */
  const editItem = useCallback<Ctx['editItem']>((id, ubah) => {
    let gagal = '';
    setState((prev) => {
      const lama = prev.items.find((i) => i.id === id);
      if (!lama) return prev;

      const terjual = prev.orders
        .filter((o) => o.itemId === id && o.status !== 'cancelled')
        .reduce((n, o) => n + o.qty, 0);

      const berikut = { ...lama, ...ubah } as SurplusItem;

      // jaga: porsi tidak boleh di bawah yang sudah dipesan
      if (berikut.portions < terjual) {
        berikut.portions = terjual;
        gagal = `Porsi minimal ${terjual} karena sudah dipesan.`;
      }

      // masa berlaku dihitung ulang kalau jamValidasi diubah
      if (ubah.hoursValid != null) {
        berikut.expiresAt = new Date(Date.now() + ubah.hoursValid * 3600_000).toISOString();
      }

      // tayang otomatis mengikuti ketersediaan
      if (berikut.portions <= 0) berikut.isActive = false;
      else if (!lama.isActive && ubah.portions != null) berikut.isActive = true;

      return { ...prev, items: prev.items.map((i) => (i.id === id ? berikut : i)) };
    });
    if (gagal) void notify('Porsi disesuaikan', gagal);
  }, []);

  /** Hapus surplus dari daftar tayang. */
  const removeItem = useCallback((id: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
  }, []);

  const rateOrder = useCallback((orderId: string, stars: number, reviewNote?: string) => {
    const target = state.orders.find((x) => x.id === orderId);
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((x) =>
        x.id === orderId
          ? { ...x, rated: true, stars, reviewNote, ratedAt: new Date().toISOString() }
          : x,
      ),
    }));
    if (target && !target.rated) {
      void notify('Terima kasih atas ulasannya', `Kamu memberi ${stars} bintang untuk ${target.merchantName}.`);
    }
  }, [state.orders]);

  const reset = useCallback(() => {
    setState(initialState);
    AsyncStorage.removeItem('nira.state.v1').catch(() => {});
  }, []);

  const impact = useMemo(() => computeImpact(state.orders), [state.orders]);
  const statsFor = useCallback((id: string) => merchantStats(state.orders, id), [state.orders]);

  const value: Ctx = {
    ...state,
    ready,
    merchants: MERCHANTS,
    impact,
    getItem,
    merchantOfId,
    placeOrder,
    confirmPickup,
    cancelOrder,
    rateOrder,
    addSurplus,
    editItem,
    removeItem,
    statsFor,
    reset,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
