#!/usr/bin/env python3
"""
Ganti nama NIRA -> NIRA di seluruh kode, dan pasang identitas baru.

Yang diganti:
  - Nama tampilan "NIRA"      -> "NIRA"
  - slug/scheme/package nira  -> nira
  - Kunci penyimpanan nira.*  -> nira.*
  - Email demo @nira.id       -> @nira.id
  - Tagline lama "Selamatkan makanan, hemat uang" -> "Setiap rasa masih bernilai"
  - Prefiks kode pickup "FF-"     -> "NR-"
  - Warna aksen hijau lama #1B8544 -> hijau logo NIRA #1B7A3E

Tidak menyentuh: folder android/ (digenerate ulang Expo), node_modules, .git.
"""
import os, re, json, sys

AKAR = r"C:\Users\Mada\Documents\foodflow"
LEWATI = {"node_modules", ".git", "android", "ios", ".expo", "__pycache__"}
EKST = (".tsx", ".ts", ".json", ".js", ".md")

# urutan penting: yang paling spesifik dulu
GANTI = [
    # --- identitas app.json ---
    ('"name": "NIRA"',            '"name": "NIRA"'),
    ('"slug": "nira"',            '"slug": "nira"'),
    ('"scheme": "nira"',          '"scheme": "nira"'),
    ('com.mada.nira',             'com.mada.nira'),
    # --- kunci penyimpanan ---
    ("'nira.auth.v1'",            "'nira.auth.v1'"),
    ("'nira.state.v1'",           "'nira.state.v1'"),
    ('"nira.state.v1"',           '"nira.state.v1"'),
    # --- email & kode demo ---
    ("konsumen@nira.id",          "konsumen@nira.id"),
    ("penjual@nira.id",           "penjual@nira.id"),
    ("'nira::'",                  "'nira::'"),
    ("'FF-'",                         "'NR-'"),
    # --- kanal notifikasi ---
    ("'nira'",                    "'nira'"),
    ('"nira"',                    '"nira"'),
    # --- tagline ---
    ("Selamatkan makanan, hemat uang", "Setiap rasa masih bernilai"),
    ("selamatkan makanan, hemat uang", "setiap rasa masih bernilai"),
    # --- nama tampilan ---
    ("NIRA",                      "NIRA"),
    ("nira",                      "nira"),
    # --- warna aksen ke hijau logo baru ---
    ("#1B8544",                       "#1B7A3E"),
    ("#166B37",                       "#155F31"),
]

ubah = {}
for d, dirs, files in os.walk(AKAR):
    dirs[:] = [x for x in dirs if x not in LEWATI]
    for f in files:
        if not f.endswith(EKST):
            continue
        p = os.path.join(d, f)
        try:
            asli = open(p, encoding="utf-8").read()
        except Exception:
            continue
        baru = asli
        n = 0
        for a, b in GANTI:
            c = baru.count(a)
            if c:
                baru = baru.replace(a, b)
                n += c
        if baru != asli:
            open(p, "w", encoding="utf-8").write(baru)
            ubah[os.path.relpath(p, AKAR)] = n

print(f"berkas diubah: {len(ubah)}")
for k in sorted(ubah):
    print(f"  {ubah[k]:3}x  {k}")

# ---- verifikasi tidak ada sisa "nira" ----
sisa = []
for d, dirs, files in os.walk(AKAR):
    dirs[:] = [x for x in dirs if x not in LEWATI]
    for f in files:
        if not f.endswith(EKST):
            continue
        p = os.path.join(d, f)
        try:
            t = open(p, encoding="utf-8").read()
        except Exception:
            continue
        for i, b in enumerate(t.splitlines(), 1):
            if re.search(r"nira", b, re.I):
                sisa.append(f"{os.path.relpath(p, AKAR)}:{i}: {b.strip()[:90]}")

print(f"\nsisa 'nira': {len(sisa)}")
for s in sisa[:20]:
    print("  ", s)
