/**
 * Uji hitungan hemat & CO2 NIRA.
 *
 * Catatan: src/data.ts mengimpor berkas foto (require('*.jpg')) sehingga tidak
 * bisa dijalankan langsung di Node. Karena itu bagian hitungannya disalin persis
 * di sini untuk diuji, LALU dibandingkan nilainya dengan rumus asli.
 *
 * Jalankan: npx tsx src/__test_hitung.ts
 */
import { CO2_PER_MEAL_KG } from './types';
import type { Order } from './types';

// --- salinan PERSIS rumus dari src/data.ts computeImpact() ---
function computeImpact(orders: Order[]) {
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

let lulus = 0, gagal = 0;
function cek(nama: string, dapat: unknown, harap: unknown) {
  const a = JSON.stringify(dapat), b = JSON.stringify(harap);
  if (a === b) { lulus++; console.log(`  OK    ${nama}`); }
  else { gagal++; console.log(`  GAGAL ${nama}\n         dapat: ${a}\n         harap: ${b}`); }
}

function order(p: Partial<Order>): Order {
  return {
    id: 'o1', merchantId: 'm1', merchantName: 'Warung', itemId: 'i1', title: 'Nasi',
    qty: 1, unitPrice: 10000, originalPrice: 20000, totalPrice: 10000,
    status: 'picked_up', code: 'NR-AAA', createdAt: new Date().toISOString(),
    rated: false,
    ...p,
  } as Order;
}

console.log(`Uji hitungan dampak NIRA  (faktor CO2 = ${CO2_PER_MEAL_KG} kg/porsi)\n`);

cek('hemat 1 pesanan (3 porsi x 10.000)', computeImpact([order({ qty: 3 })]).moneySaved, 30000);
cek('porsi terselamatkan',                computeImpact([order({ qty: 3 })]).mealsRescued, 3);
cek(`CO2 (3 porsi x ${CO2_PER_MEAL_KG} kg)`, computeImpact([order({ qty: 3 })]).co2SavedKg, Math.round(3 * CO2_PER_MEAL_KG * 10) / 10);
cek('pesanan belum diambil diabaikan',    computeImpact([order({ qty: 3, status: 'paid' })]).moneySaved, 0);
cek('pesanan batal diabaikan',            computeImpact([order({ qty: 3, status: 'cancelled' })]).mealsRescued, 0);

cek('campuran status (2+1 selesai, 1 batal)', computeImpact([
  order({ id: 'a', qty: 2 }),
  order({ id: 'b', qty: 1 }),
  order({ id: 'c', qty: 5, status: 'cancelled' }),
]).mealsRescued, 3);

cek('selisih harga beda per item', computeImpact([
  order({ id: 'a', qty: 2, unitPrice: 15000, originalPrice: 25000 }), // 2 x 10.000 = 20.000
  order({ id: 'b', qty: 1, unitPrice: 5000,  originalPrice: 12000 }), // 1 x  7.000 =  7.000
]).moneySaved, 27000);

const kosong = computeImpact([]);
cek('tanpa pesanan: semua nol', [kosong.moneySaved, kosong.co2SavedKg, kosong.mealsRescued], [0, 0, 0]);

cek('pembulatan CO2 satu desimal', computeImpact([order({ qty: 1 })]).co2SavedKg, Math.round(CO2_PER_MEAL_KG * 10) / 10);

console.log(`\nhasil: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
