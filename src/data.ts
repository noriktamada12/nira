/**
 * NIRA - seed data + persistence.
 *
 * Semua state disimpan di AsyncStorage supaya demo terasa nyata: pesanan
 * yang dibuat konsumen langsung muncul di dashboard penjual.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CO2_PER_MEAL_KG, type ImpactStats, type Merchant, type Order, type SurplusItem } from './types';
import type { ImageSourcePropType } from 'react-native';

// v2: ada foto, koordinat, dan rating ulasan
const KEY = 'nira.state.v1';

/** Foto makanan (require literal - wajib literal di React Native). */
const PHOTOS: Record<string, ImageSourcePropType> = {
  geprek: require('../assets/food/geprek.jpg'),
  nasgor: require('../assets/food/nasgor.jpg'),
  croissant: require('../assets/food/croissant.jpg'),
  roti: require('../assets/food/roti.jpg'),
  salad: require('../assets/food/salad.jpg'),
  lauk: require('../assets/food/lauk.jpg'),
};

/**
 * Foto seed disimpan sebagai key string ({ uri: 'geprek' }) supaya bisa
 * di-serialisasi ke AsyncStorage; resolvePhoto() menukarnya ke require()
 * saat render. Foto hasil kamera/galeri (file:// atau data:) lolos apa adanya.
 */
export function resolvePhoto(src: unknown): ImageSourcePropType | undefined {
  if (!src) return undefined;
  if (typeof src === 'string') return PHOTOS[src];
  if (typeof src === 'object' && 'uri' in src) {
    const uri = (src as { uri: unknown }).uri;
    if (typeof uri === 'string' && PHOTOS[uri]) return PHOTOS[uri];
    return src as ImageSourcePropType;
  }
  return src as ImageSourcePropType;
}

// Koordinat di sekitar Salatiga (-7.33, 110.49)
export const MERCHANTS: Merchant[] = [
  {
    id: 'm1',
    name: 'Warung Bu Sari',
    category: 'Masakan Rumah',
    icon: 'rice',
    address: 'Jl. Diponegoro 42, Salatiga',
    distanceKm: 0.4,
    rating: 4.8,
    ratingCount: 124,
    lat: -7.331,
    lng: 110.492,
  },
  {
    id: 'm2',
    name: 'Bakery Roti Pagi',
    category: 'Bakery',
    icon: 'food-croissant',
    address: 'Jl. Sudirman 11, Salatiga',
    distanceKm: 0.9,
    rating: 4.7,
    ratingCount: 89,
    lat: -7.328,
    lng: 110.497,
  },
  {
    id: 'm3',
    name: 'Kopi Senja',
    category: 'Kafe',
    icon: 'coffee',
    address: 'Jl. Kartini 5, Salatiga',
    distanceKm: 1.3,
    rating: 4.9,
    ratingCount: 201,
    lat: -7.336,
    lng: 110.49,
  },
  {
    id: 'm4',
    name: 'Nasi Goreng Pak Kumis',
    category: 'Restoran',
    icon: 'rice',
    address: 'Jl. Ahmad Yani 88, Salatiga',
    distanceKm: 1.8,
    rating: 4.6,
    ratingCount: 156,
    lat: -7.34,
    lng: 110.495,
  },
  {
    id: 'm5',
    name: 'Salad & Bowl',
    category: 'Healthy Food',
    icon: 'bowl-mix',
    address: 'Jl. Pattimura 3, Salatiga',
    distanceKm: 2.1,
    rating: 4.5,
    ratingCount: 67,
    lat: -7.338,
    lng: 110.488,
  },
];

function iso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3600_000).toISOString();
}

export const SEED_ITEMS: SurplusItem[] = [
  {
    id: 'i1',
    merchantId: 'm1',
    title: 'Nasi Ayam Geprek + Lalapan',
    photo: { uri: 'geprek' },
    icon: 'food-drumstick',
    description: 'Porsi sisa closing, masih hangat. Diambil sebelum tutup.',
    originalPrice: 22000,
    price: 9000,
    portions: 4,
    portionsTotal: 6,
    pickupStart: '18:00',
    pickupEnd: '21:00',
    expiresAt: iso(6),
    category: 'Masakan Rumah',
    isActive: true,
  },
  {
    id: 'i2',
    merchantId: 'm2',
    title: 'Paket 3 Roti Manis',
    photo: { uri: 'roti' },
    icon: 'food-croissant',
    description: 'Roti sisa display hari ini. Tekstur masih lembut.',
    originalPrice: 30000,
    price: 12000,
    portions: 3,
    portionsTotal: 5,
    pickupStart: '19:00',
    pickupEnd: '21:30',
    expiresAt: iso(7),
    category: 'Bakery',
    isActive: true,
  },
  {
    id: 'i3',
    merchantId: 'm3',
    title: 'Croissant + Kopi Susu',
    photo: { uri: 'croissant' },
    icon: 'food-croissant',
    description: 'Paket sore, croissant dipanggang pagi ini.',
    originalPrice: 35000,
    price: 15000,
    portions: 2,
    portionsTotal: 4,
    pickupStart: '17:30',
    pickupEnd: '20:00',
    expiresAt: iso(5),
    category: 'Kafe',
    isActive: true,
  },
  {
    id: 'i4',
    merchantId: 'm4',
    title: 'Nasi Goreng Spesial Porsi Jumbo',
    photo: { uri: 'nasgor' },
    icon: 'rice',
    description: 'Sisa prep malam, belum pernah disajikan.',
    originalPrice: 25000,
    price: 10000,
    portions: 5,
    portionsTotal: 8,
    pickupStart: '20:00',
    pickupEnd: '22:00',
    expiresAt: iso(8),
    category: 'Restoran',
    isActive: true,
  },
  {
    id: 'i5',
    merchantId: 'm5',
    title: 'Salad Bowl Ayam Panggang',
    photo: { uri: 'salad' },
    icon: 'bowl-mix',
    description: 'Sayur segar sisa prep siang, dressing terpisah.',
    originalPrice: 40000,
    price: 18000,
    portions: 3,
    portionsTotal: 4,
    pickupStart: '16:00',
    pickupEnd: '19:00',
    expiresAt: iso(4),
    category: 'Healthy Food',
    isActive: true,
  },
  {
    id: 'i6',
    merchantId: 'm1',
    title: 'Lauk Campur (5 macam)',
    photo: { uri: 'lauk' },
    icon: 'food-variant',
    description: 'Paket lauk pilihan, cocok untuk makan malam keluarga.',
    originalPrice: 35000,
    price: 14000,
    portions: 2,
    portionsTotal: 4,
    pickupStart: '18:30',
    pickupEnd: '21:00',
    expiresAt: iso(6),
    category: 'Masakan Rumah',
    isActive: true,
  },
];

export interface AppState {
  items: SurplusItem[];
  orders: Order[];
}

export const initialState: AppState = { items: SEED_ITEMS, orders: [] };

const ORDER_STATUS = new Set(['pending', 'paid', 'picked_up', 'cancelled']);

/**
 * Validasi satu item simpanan.
 *
 * Data lama di AsyncStorage bisa rusak / dari skema lama (mis. porsi jadi
 * string, harga NaN). Tanpa validasi, satu baris rusak ikut ke-render dan
 * aplikasi force close di layar Jelajahi/Detail. Baris rusak dibuang,
 * yang sehat tetap dipakai.
 */
function validItem(x: unknown): x is SurplusItem {
  const i = x as SurplusItem;
  return (
    !!i &&
    typeof i.id === 'string' &&
    typeof i.merchantId === 'string' &&
    typeof i.title === 'string' &&
    Number.isFinite(i.price) &&
    Number.isFinite(i.originalPrice) &&
    Number.isFinite(i.portions) &&
    typeof i.icon === 'string'
  );
}

function validOrder(x: unknown): x is Order {
  const o = x as Order;
  return (
    !!o &&
    typeof o.id === 'string' &&
    typeof o.itemId === 'string' &&
    typeof o.code === 'string' &&
    Number.isFinite(o.qty) &&
    Number.isFinite(o.totalPrice) &&
    ORDER_STATUS.has(o.status)
  );
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.items)) return initialState;
    const items = parsed.items.filter(validItem);
    if (!items.length) return initialState;
    const orders = Array.isArray(parsed.orders) ? parsed.orders.filter(validOrder) : [];
    return { items, orders };
  } catch {
    return initialState;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* demo app */
  }
}

export function merchantOf(merchants: Merchant[], id: string): Merchant {
  return merchants.find((m) => m.id === id) ?? merchants[0];
}

export function rupiah(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}

/**
 * Angka desimal dengan koma (gaya Indonesia), mis. 2.5 -> "2,5".
 *
 * Dipakai untuk berat CO2. Tanpa ini angka tampil "2.5" memakai titik,
 * padahal seluruh aplikasi memakai koma sebagai pemisah desimal.
 */
export function angkaDesimal(n: number, desimal = 1): string {
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: desimal,
  });
}

/** Kode pickup pendek. */
export function pickupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'NR-' + s;
}

/** Rating efektif = rating awal digabung ulasan konsumen. */
export function effectiveRating(
  baseRating: number,
  baseCount: number,
  reviews: { stars: number }[],
): { rating: number; count: number } {
  if (!reviews.length) return { rating: baseRating, count: baseCount };
  const sum = baseRating * baseCount + reviews.reduce((n, r) => n + r.stars, 0);
  const count = baseCount + reviews.length;
  return { rating: Math.round((sum / count) * 10) / 10, count };
}

export function computeImpact(orders: Order[]): ImpactStats {
  const done = orders.filter((o) => o.status === 'picked_up');
  const meals = done.reduce((n, o) => n + o.qty, 0);
  const saved = done.reduce((n, o) => n + o.qty * (o.originalPrice - o.unitPrice), 0);
  return {
    mealsRescued: meals,
    co2SavedKg: Math.round(meals * CO2_PER_MEAL_KG * 10) / 10,
    moneySaved: saved,
    ordersCompleted: done.length,
  };
}

/** Statistik penjual. */
export function merchantStats(orders: Order[], merchantId: string) {
  const mine = orders.filter((o) => o.merchantId === merchantId);
  const done = mine.filter((o) => o.status === 'picked_up');
  return {
    pending: mine.filter((o) => o.status === 'pending' || o.status === 'paid').length,
    awaitingPickup: mine.filter((o) => o.status === 'paid').length,
    portionsRescued: done.reduce((n, o) => n + o.qty, 0),
    revenue: done.reduce((n, o) => n + o.totalPrice, 0),
  };
}
