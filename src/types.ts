/**
 * NIRA - domain types.
 *
 * Alur bisnis inti:
 *   penjual upload makanan surplus -> konsumen pesan -> konsumen ambil di
 *   lokasi -> penjual verifikasi -> porsi "terselamatkan" tercatat.
 */
import type { ImageSourcePropType } from 'react-native';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/** Nama ikon vektor (MaterialCommunityIcons) - pengganti emoji di seluruh app. */
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type Role = 'consumer' | 'merchant';

export type OrderStatus =
  | 'pending'      // konsumen sudah pesan, belum bayar/konfirmasi
  | 'paid'         // sudah dibayar, menunggu diambil
  | 'picked_up'    // penjual sudah verifikasi pengambilan
  | 'cancelled';

export interface Merchant {
  id: string;
  name: string;
  category: string;      // Restoran, Bakery, Kafe, ...
  address: string;
  distanceKm: number;
  rating: number;        // rating awal
  ratingCount: number;   // jumlah ulasan yang membentuk rating
  icon: IconName;        // ikon kategori penjual
  lat: number;           // koordinat untuk peta
  lng: number;
}

export interface SurplusItem {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  /** Foto makanan (bundel lokal atau hasil kamera/galeri). */
  photo?: ImageSourcePropType;
  icon: IconName;        // ikon cadangan kalau foto belum ada
  originalPrice: number; // harga normal
  price: number;         // harga diskon
  portions: number;      // sisa porsi
  portionsTotal: number;
  pickupStart: string;   // "18:00"
  pickupEnd: string;     // "21:00"
  expiresAt: string;     // ISO
  category: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  code: string;            // kode pickup, mis. "NR-4A2B"
  itemId: string;
  itemTitle: string;       // disalin supaya riwayat tetap terbaca
  merchantId: string;
  merchantName: string;
  photo?: ImageSourcePropType;
  icon: IconName;
  buyerRole: Role;
  qty: number;
  unitPrice: number;
  originalPrice: number;   // harga normal, untuk hitung penghematan
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  pickedUpAt?: string;
  /** Ulasan konsumen setelah makanan diambil. */
  rated?: boolean;
  stars?: number;
  reviewNote?: string;
  ratedAt?: string;
}

export interface ImpactStats {
  mealsRescued: number;
  co2SavedKg: number;
  moneySaved: number;
  ordersCompleted: number;
}

export const CO2_PER_MEAL_KG = 2.5;
