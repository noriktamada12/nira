# NIRA

**Setiap rasa masih bernilai.**

Aplikasi pengurang makanan terbuang. Penjual menjual makanan surplus dengan harga murah,
konsumen membeli dan mengambilnya, lalu jumlah makanan yang terselamatkan tercatat
sebagai **porsi terselamatkan**.

Dibuat dengan **React Native + Expo** (SDK 57).

---

## Cara jalanin di Android

### Opsi 1 — pakai APK (paling gampang)

Install `NIRA-v2.1.apk` di HP Android. Selesai, nggak butuh laptop.

### Opsi 2 — pakai Expo Go

1. **Install Expo Go** dari Google Play Store (versi SDK 57).
2. HP dan laptop harus **satu WiFi** yang sama.
3. Di laptop:

   ```bash
   npx expo start
   ```

4. **Scan QR code** yang muncul di terminal pakai aplikasi Expo Go.
5. Ketik manual kalau QR nggak kebaca: `exp://<IP-LAPTOP>:8081`

---

## Alur aplikasi

### Sisi Konsumen
| Layar | Fungsi |
|---|---|
| **Jelajahi** | Cari makanan surplus, filter kategori, lihat diskon & sisa porsi |
| **Detail** | Pilih jumlah porsi → pesan sekarang |
| **Pesanan saya** | Kode pickup besar untuk ditunjukkan ke penjual, riwayat, tombol "Sudah kuambil" |
| **Dampak** | Porsi terselamatkan, CO₂ yang tidak terbuang, uang yang dihemat, lengkap dengan cara hitungnya |
| **Profil** | Akun, ringkasan aktivitas, pengaturan |

### Sisi Penjual
| Fitur | Fungsi |
|---|---|
| **Dashboard** | Pendapatan, porsi terjual, pesanan yang perlu diverifikasi |
| **Upload surplus** | Foto/ikon, nama, deskripsi, harga normal vs diskon, jumlah porsi, jam pickup, kategori |
| **Pesanan masuk** | Lihat kode pickup konsumen → serahkan makanan → **Verifikasi ambil** |
| **Stok surplus** | Kelola makanan yang tayang — ubah porsi (−/+), sunting harga & jam, atau hapus |

### Alur lengkapnya
```
Penjual upload surplus
        ↓
Konsumen cari & pesan  →  dapat kode pickup (mis. NR-R7P5)
        ↓
Konsumen ambil di lokasi, tunjukkan kode
        ↓
Penjual verifikasi  →  pesanan selesai
        ↓
Tercatat: porsi terselamatkan + pendapatan penjual naik
```

**Demo satu HP:** tombol melayang **Konsumen / Penjual** di bawah layar untuk
pindah sisi. Pesanan yang dibuat di sisi konsumen langsung muncul di dashboard
penjual — jadi alurnya kelihatan utuh tanpa dua HP.

---

## Cara hitung dampak

Semua angka dihitung dari **pesanan yang sudah diambil** (`picked_up`). Pesanan batal
atau yang belum diambil tidak dihitung.

| Angka | Rumus |
|---|---|
| Porsi terselamatkan | jumlah `qty` dari pesanan selesai |
| Uang dihemat | Σ (`qty` × (harga normal − harga surplus)) |
| CO₂ dihindari | jumlah porsi × 2,5 kg |

Rumusnya ada di `src/data.ts` → `computeImpact()`, dan sudah diuji di
`src/__test_hitung.ts` (9 kasus, semua lulus).

```bash
npx tsx src/__test_hitung.ts
```

---

## Struktur project

```
nira/
├── App.tsx                     # akar app + navigasi + pemilih peran
├── index.ts                    # entry point Expo
├── app.json                    # config Expo (nama, ikon, splash, package)
├── assets/
│   ├── icon.png                # ikon aplikasi (logo NIRA)
│   ├── brand/nira-logo.svg     # logo vektor
│   └── food/                   # foto makanan
└── src/
    ├── theme.ts                # design token (warna, radius, tipografi, animasi)
    ├── types.ts                # tipe domain (Item, Order, ImpactStats)
    ├── data.ts                 # data awal + hitungan dampak + helper rupiah
    ├── store.tsx               # state global + simpan ke AsyncStorage
    ├── ui.tsx                  # komponen dasar (Button, Card, Chip, Sheet, dll)
    ├── __test_hitung.ts        # uji hitungan hemat & CO2
    └── screens/
        ├── AuthScreen.tsx          # masuk / daftar
        ├── ExploreScreen.tsx       # konsumen: jelajahi makanan
        ├── ItemDetailScreen.tsx    # konsumen: detail + pesan
        ├── OrdersScreen.tsx        # konsumen: kode pickup & riwayat
        ├── ImpactScreen.tsx        # konsumen: dampak
        ├── ProfileScreen.tsx       # konsumen: profil
        └── MerchantScreen.tsx      # penjual: dashboard, upload, stok, verifikasi
```

## Design

- warna aksen hijau `#1B7A3E`, oranye `#F58220` (sesuai logo)
- tipografi 14px, radius 4/10/15/24px
- hairline 1px, animasi 200ms
- hanya `opacity` + `transform` yang dianimasikan (60fps)
- tanpa gradient, tanpa shadow berat — flat & tenang
- ikon memakai vektor, bukan emoji

## Data

Semua state disimpan lokal di **AsyncStorage** — nggak butuh server.
Untuk reset data demo, pakai tombol **Reset data demo** di layar Dampak/Profil.

---

## Catatan teknis

- **SDK 57** — Expo Go di Play Store saat ini jalan di SDK 57.
- **Tanpa server** — cocok buat demo tugas; untuk produksi tinggal ganti
  `src/store.tsx` supaya ambil data dari API.
- **Web build** — `npx expo start --web` buat lihat di browser.
- **Build APK** — `cd android && ./gradlew assembleRelease`, hasilnya di
  `android/app/build/outputs/apk/release/app-release.apk`.
- Screenshot tiap layar ada di `shots/shots/`.
