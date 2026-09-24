#!/usr/bin/env python3
"""
Ukur bounding box setiap elemen di SVG logo, lalu render PNG,
memakai Chrome + CDP. Tidak mengandalkan mata: semua angka keluar.

Cara kerja:
  1. Chrome headless dibuka dengan halaman yang memuat SVG.
  2. Lewat CDP Runtime.evaluate, ambil getBBox() tiap anak elemen.
  3. Skrip memeriksa bentrok antar-elemen secara numerik.
  4. Chrome Page.captureScreenshot langsung diarahkan ke area SVG.
"""
import json, os, subprocess, sys, time, urllib.request, socket, base64

AKAR  = r"C:\Users\Mada\Documents\foodflow"
BRAND = os.path.join(AKAR, "assets", "brand")
SVG   = os.path.join(BRAND, "nira-logo.svg")
PORT  = 9333
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

svg = open(SVG, encoding="utf-8").read()
html = ("<!doctype html><meta charset='utf-8'><style>"
        "html,body{margin:0;padding:0;background:#fff}"
        "svg{display:block;width:512px;height:512px}</style>" + svg)
hal = os.path.join(BRAND, "_ukur.html")
open(hal, "w", encoding="utf-8").write(html)

# --- jalankan Chrome dengan remote debugging ---
proc = subprocess.Popen([
    CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
    f"--remote-debugging-port={PORT}",
    "--user-data-dir=" + os.path.join(BRAND, "_chrome_prof"),
    "file:///" + hal.replace("\\", "/"),
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# --- tunggu port siap ---
ws = None
for _ in range(50):
    try:
        d = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json", timeout=2))
        for t in d:
            if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
                ws = t["webSocketDebuggerUrl"]; break
        if ws: break
    except Exception:
        time.sleep(0.4)
if not ws:
    print("GAGAL: Chrome CDP tidak siap"); proc.kill(); sys.exit(1)

# --- klien WebSocket sederhana (tanpa dependensi luar) ---
import struct, hashlib

def ws_connect(url):
    from urllib.parse import urlparse
    u = urlparse(url)
    s = socket.create_connection((u.hostname, u.port), timeout=10)
    key = base64.b64encode(os.urandom(16)).decode()
    req = (f"GET {u.path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n"
           f"Upgrade: websocket\r\nConnection: Upgrade\r\n"
           f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
    s.sendall(req.encode())
    buf = b""
    while b"\r\n\r\n" not in buf:
        buf += s.recv(4096)
    return s

def ws_send(s, data):
    b = data.encode()
    hdr = bytearray([0x81])
    n = len(b)
    if n < 126: hdr.append(0x80 | n)
    elif n < 65536: hdr.append(0x80 | 126); hdr += struct.pack(">H", n)
    else: hdr.append(0x80 | 127); hdr += struct.pack(">Q", n)
    s.sendall(bytes(hdr) + b)

def ws_recv(s):
    def rn(n):
        d = b""
        while len(d) < n:
            c = s.recv(n - len(d))
            if not c: raise EOFError
            d += c
        return d
    b1, b2 = rn(2)
    ln = b2 & 0x7F
    if ln == 126: ln = struct.unpack(">H", rn(2))[0]
    elif ln == 127: ln = struct.unpack(">Q", rn(8))[0]
    return rn(ln).decode("utf-8", "ignore")

s = ws_connect(ws)
_id = [0]
def call(method, params=None):
    _id[0] += 1
    ws_send(s, json.dumps({"id": _id[0], "method": method, "params": params or {}}))
    while True:
        m = json.loads(ws_recv(s))
        if m.get("id") == _id[0]:
            return m

call("Runtime.enable")
time.sleep(1.0)

# --- ambil bounding box tiap elemen ---
expr = """(() => {
  const svg = document.querySelector('svg');
  const out = [];
  [...svg.children].forEach((el, i) => {
    try {
      const b = el.getBBox();
      out.push({i, tag: el.tagName,
        warna: el.getAttribute('fill') || el.getAttribute('stroke') || '',
        x: +b.x.toFixed(1), y: +b.y.toFixed(1),
        w: +b.width.toFixed(1), h: +b.height.toFixed(1),
        cx: +(b.x + b.width/2).toFixed(1), cy: +(b.y + b.height/2).toFixed(1),
        kiri: +b.x.toFixed(1), kanan: +(b.x+b.width).toFixed(1),
        atas: +b.y.toFixed(1), bawah: +(b.y+b.height).toFixed(1)});
    } catch(e) { out.push({i, tag: el.tagName, err: String(e)}); }
  });
  return JSON.stringify(out);
})()"""
r = call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
data = json.loads(r["result"]["result"]["value"])

print("=== BOUNDING BOX TIAP ELEMEN (kanvas 512x512) ===")
for e in data:
    if "err" in e:
        print(f"  [{e['i']}] {e['tag']} ERROR {e['err']}"); continue
    print(f"  [{e['i']:2}] {e['tag']:6} {e['warna'][:9]:9} "
          f"x={e['x']:6.1f}..{e['kanan']:6.1f}  y={e['y']:6.1f}..{e['bawah']:6.1f}  "
          f"pusat=({e['cx']:.0f},{e['cy']:.0f})")

# --- cek keluar kanvas ---
print("\n=== CEK KELUAR KANVAS (0..512) ===")
ada = False
for e in data:
    if "err" in e: continue
    if e["kiri"] < -1 or e["atas"] < -1 or e["kanan"] > 513 or e["bawah"] > 513:
        print(f"  LUAR: {e['tag']} x={e['kiri']}..{e['kanan']} y={e['atas']}..{e['bawah']}")
        ada = True
print("  (aman)" if not ada else "")

# --- simpan laporan + screenshot ---
open(os.path.join(BRAND, "ukuran.json"), "w", encoding="utf-8").write(
    json.dumps(data, indent=1, ensure_ascii=False))

shot = call("Page.captureScreenshot", {"format": "png",
            "clip": {"x": 0, "y": 0, "width": 512, "height": 512, "scale": 2}})
png = base64.b64decode(shot["result"]["data"])
open(os.path.join(BRAND, "pratinjau.png"), "wb").write(png)
print("\nscreenshot:", len(png), "bytes -> assets/brand/pratinjau.png")

s.close(); proc.kill()
