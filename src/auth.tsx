/**
 * NIRA - autentikasi akun & verifikasi penjual.
 *
 * Satu akun = satu peran (konsumen ATAU penjual). Peran ditentukan saat
 * daftar dan tidak bisa ditukar sesuka hati — dashboard yang tampil mengikuti
 * peran akun, jadi alur konsumen dan penjual benar-benar terpisah.
 *
 * Penjual wajib melewati verifikasi sebelum dashboard jualannya terbuka.
 *
 * CATATAN DEMO: akun disimpan lokal (AsyncStorage) dan kata sandi di-hash
 * dengan FNV-1a sederhana — cukup untuk demo tanpa backend, bukan untuk
 * produksi. Ganti ke server auth sungguhan sebelum dipakai nyata.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Role } from './types';

const KEY = 'nira.auth.v1';

export type VerifyStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface BusinessInfo {
  businessName: string;
  category: string;
  address: string;
  phone: string;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** FNV-1a hash + salt. Demo saja. */
  pass: string;
  role: Role;
  /** Terisi setelah verifikasi penjual disetujui. */
  merchantId?: string;
  business?: BusinessInfo;
  verify: VerifyStatus;
  createdAt: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  business?: BusinessInfo;
}

type Result = { ok: true } | { ok: false; error: string };

interface AuthCtx {
  ready: boolean;
  user: User | null;
  users: User[];
  signIn: (email: string, password: string) => Result;
  signUp: (input: SignUpInput) => Result;
  signOut: () => void;
  /** Penjual melengkapi/mengirim data usaha -> status jadi 'pending'. */
  submitVerification: (info: BusinessInfo) => void;
  /** Ubah data usaha tanpa mengubah status verifikasi. */
  updateBusiness: (info: BusinessInfo) => void;
  /** Demo: tombol "setujui" pengganti panel admin. */
  approveVerification: () => void;
  rejectVerification: () => void;
  /** Menyambungkan akun penjual ke entitas merchant di store. */
  linkMerchant: (merchantId: string) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

/* ------------------------------------------------------------------ helpers */

/** FNV-1a 32-bit + salt. Demo-only, bukan kriptografi sungguhan. */
function hashPassword(pw: string): string {
  const s = 'nira::' + pw;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'h' + h.toString(16).padStart(8, '0');
}

const uid = (p: string) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const DEMO_CONSUMER = { email: 'konsumen@nira.id', password: 'demo123' };
export const DEMO_MERCHANT = { email: 'penjual@nira.id', password: 'demo123' };

function seedUsers(): User[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'u_demo_konsumen',
      name: 'Mada',
      email: DEMO_CONSUMER.email,
      pass: hashPassword(DEMO_CONSUMER.password),
      role: 'consumer',
      verify: 'verified',
      createdAt: now,
    },
    {
      id: 'u_demo_penjual',
      name: 'Bu Sari',
      email: DEMO_MERCHANT.email,
      pass: hashPassword(DEMO_MERCHANT.password),
      role: 'merchant',
      merchantId: 'm1',
      business: {
        businessName: 'Warung Bu Sari',
        category: 'Masakan Rumah',
        address: 'Jl. Diponegoro 42, Salatiga',
        phone: '0812-0000-0000',
      },
      verify: 'verified',
      createdAt: now,
    },
  ];
}

interface Persisted {
  users: User[];
  sessionUserId: string | null;
}

async function load(): Promise<Persisted> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { users: seedUsers(), sessionUserId: null };
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed.users?.length) return { users: seedUsers(), sessionUserId: null };
    return parsed;
  } catch {
    return { users: seedUsers(), sessionUserId: null };
  }
}

async function save(p: Persisted): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* demo */
  }
}

/* ------------------------------------------------------------------ provider */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    load().then((p) => {
      if (!alive) return;
      setUsers(p.users);
      setSessionId(p.sessionUserId);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void save({ users, sessionUserId: sessionId });
  }, [users, sessionId, ready]);

  const user = useMemo(() => users.find((u) => u.id === sessionId) ?? null, [users, sessionId]);

  const signIn = useCallback<AuthCtx['signIn']>(
    (email, password) => {
      const mail = email.trim().toLowerCase();
      if (!mail || !password) return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
      const found = users.find((u) => u.email.toLowerCase() === mail);
      if (!found) return { ok: false, error: 'Email belum terdaftar.' };
      if (found.pass !== hashPassword(password)) return { ok: false, error: 'Kata sandi salah.' };
      setSessionId(found.id);
      return { ok: true };
    },
    [users],
  );

  const signUp = useCallback<AuthCtx['signUp']>(
    (input) => {
      const name = input.name.trim();
      const mail = input.email.trim().toLowerCase();
      if (name.length < 2) return { ok: false, error: 'Nama minimal 2 huruf.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { ok: false, error: 'Format email belum benar.' };
      if (input.password.length < 6) return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
      if (users.some((u) => u.email.toLowerCase() === mail)) {
        return { ok: false, error: 'Email ini sudah terdaftar. Coba masuk saja.' };
      }
      if (input.role === 'merchant') {
        const b = input.business;
        if (!b || b.businessName.trim().length < 2) return { ok: false, error: 'Nama usaha wajib diisi.' };
        if (!b.address.trim()) return { ok: false, error: 'Alamat usaha wajib diisi.' };
        if (!b.phone.trim()) return { ok: false, error: 'Nomor WhatsApp usaha wajib diisi.' };
      }
      const u: User = {
        id: uid('u'),
        name,
        email: mail,
        pass: hashPassword(input.password),
        role: input.role,
        business: input.business,
        verify: input.role === 'merchant' ? 'pending' : 'verified',
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, u]);
      setSessionId(u.id);
      return { ok: true };
    },
    [users],
  );

  const signOut = useCallback(() => setSessionId(null), []);

  const patchUser = useCallback((fn: (u: User) => User) => {
    setUsers((prev) => prev.map((u) => (u.id === sessionId ? fn(u) : u)));
  }, [sessionId]);

  const submitVerification = useCallback<AuthCtx['submitVerification']>((info) => {
    patchUser((u) => ({ ...u, business: info, verify: 'pending' }));
  }, [patchUser]);

  /**
   * Ubah data usaha TANPA mengubah status verifikasi.
   *
   * Sebelumnya layar profil penjual memakai submitVerification untuk menyimpan
   * suntingan. Efek sampingnya: penjual yang SUDAH terverifikasi mendadak
   * kembali berstatus "menunggu verifikasi" dan dashboard-nya terkunci hanya
   * karena mengganti nomor telepon. Sekarang statusnya tidak ikut berubah.
   */
  const updateBusiness = useCallback<AuthCtx['updateBusiness']>((info) => {
    patchUser((u) => ({ ...u, business: info }));
  }, [patchUser]);

  const approveVerification = useCallback(() => {
    patchUser((u) => ({ ...u, verify: 'verified' }));
  }, [patchUser]);

  const rejectVerification = useCallback(() => {
    patchUser((u) => ({ ...u, verify: 'rejected' }));
  }, [patchUser]);

  const linkMerchant = useCallback((merchantId: string) => {
    patchUser((u) => ({ ...u, merchantId }));
  }, [patchUser]);

  const value: AuthCtx = {
    ready,
    user,
    users,
    signIn,
    signUp,
    signOut,
    submitVerification,
    updateBusiness,
    approveVerification,
    rejectVerification,
    linkMerchant,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
