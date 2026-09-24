#!/usr/bin/env python3
"""
Hapus background logo NIRA (gambar kiriman Mada) -> PNG transparan.

Pendekatan flood-fill dari tepi:
  Background gambar adalah warna terang yang hampir seragam. Kita mulai dari
  keempat sudut, lalu menyebar ke piksel yang warnanya mirip background.
  Hanya area yang TERHUBUNG ke tepi yang dihapus -> bagian putih DI DALAM
  logo (misalnya garis putih di sekitar centang) tetap utuh.

Tanpa dependensi luar selain Pillow + numpy.
"""
import os, sys
from collections import deque
from PIL import Image
import numpy as np

AKAR  = r"C:\Users\Mada\Documents\foodflow"
BRAND = os.path.join(AKAR, "assets", "brand")
SRC   = r"C:\Users\Mada\AppData\Local\hermes\cache\images\img_c4598eb7454a.jpg"
os.makedirs(BRAND, exist_ok=True)

img = Image.open(SRC).convert("RGB")
W, H = img.size
a = np.asarray(img).astype(np.int16)
print(f"sumber: {W}x{H}")

# ---------- 1. warna background dari 4 sudut ----------
sudut = np.array([a[2, 2], a[2, W-3], a[H-3, 2], a[H-3, W-3]])
bg = np.median(sudut, axis=0)
print("warna background (RGB):", bg.astype(int))

TOL = 52

# ---------- 2. flood fill dari seluruh tepi ----------
dihapus = np.zeros((H, W), dtype=bool)
q = deque()
for x in range(W):
    q.append((0, x)); q.append((H - 1, x))
for y in range(H):
    q.append((y, 0)); q.append((y, W - 1))

while q:
    y, x = q.popleft()
    if y < 0 or y >= H or x < 0 or x >= W:
        continue
    if dihapus[y, x]:
        continue
    if int(np.abs(a[y, x] - bg).sum()) >= TOL:
        continue
    dihapus[y, x] = True
    q.append((y + 1, x)); q.append((y - 1, x))
    q.append((y, x + 1)); q.append((y, x - 1))

print(f"background terhapus: {dihapus.sum() / (W * H) * 100:.1f}%")

# ---------- 3. RGBA + tepi halus ----------
alpha = np.where(dihapus, 0, 255).astype(np.uint8)

# piksel yang bertetangga dgn background tapi masih terpakai -> alpha 140
# (mengurangi gerigi di tepi logo)
sisa = ~dihapus
tetangga_bg = np.zeros_like(dihapus)
tetangga_bg[1:, :] |= dihapus[:-1, :]
tetangga_bg[:-1, :] |= dihapus[1:, :]
tetangga_bg[:, 1:] |= dihapus[:, :-1]
tetangga_bg[:, :-1] |= dihapus[:, 1:]
alpha[sisa & tetangga_bg] = 140

rgba = np.dstack([a.astype(np.uint8), alpha])
logo = Image.fromarray(rgba, "RGBA")

# ---------- 4. potong rapat ke isi ----------
bbox = logo.getbbox()
print("bidang isi:", bbox)
logo = logo.crop(bbox)

# jadikan persegi
s = max(logo.size)
persegi = Image.new("RGBA", (s, s), (0, 0, 0, 0))
persegi.paste(logo, ((s - logo.width) // 2, (s - logo.height) // 2), logo)
print("persegi:", persegi.size)

persegi.save(os.path.join(BRAND, "nira-transparan.png"))
print("  -> assets/brand/nira-transparan.png")


# ---------- 5. turunan untuk Expo ----------
def simpan(im, nama, px, latar=None, skala=1.0):
    """latar None = transparan. skala<1 = perkecil objek ke tengah."""
    if skala != 1.0:
        kecil = im.resize((int(px * skala), int(px * skala)), Image.LANCZOS)
        out = Image.new("RGBA" if latar is None else "RGB",
                        (px, px), latar or (0, 0, 0, 0))
        out.paste(kecil, ((px - kecil.width) // 2, (px - kecil.height) // 2), kecil)
    else:
        out = im.resize((px, px), Image.LANCZOS)
        if latar is not None:
            plat = Image.new("RGB", (px, px), latar)
            plat.paste(out, (0, 0), out)
            out = plat
    p = os.path.join(AKAR, "assets", nama)
    out.save(p, "PNG")
    print(f"  {nama:32} {px}x{px}  {os.path.getsize(p) // 1024} KB")


print("\nturunan:")
# padding 8% supaya aman saat iOS/Android memotong sudut (squircle)
simpan(persegi, "icon.png", 1024, latar=(255, 255, 255), skala=0.88)
simpan(persegi, "favicon.png", 96, latar=(255, 255, 255), skala=0.88)
simpan(persegi, "splash-icon.png", 512, latar=(255, 255, 255), skala=0.72)
simpan(persegi, "android-icon-foreground.png", 1024, latar=None, skala=0.62)

prv = persegi.copy()
prv.thumbnail((512, 512), Image.LANCZOS)
prv.save(os.path.join(BRAND, "pratinjau.png"))
print("\nselesai. pratinjau: assets/brand/pratinjau.png")
