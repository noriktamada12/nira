"""Tangkap alur NIRA di web: login, konsumen, penjual, verifikasi.

Menekan tombol lewat testID (RN-web merender jadi data-testid), pakai CDP
Input.dispatchMouseEvent supaya Pressable benar-benar merespons.
"""
import base64
import json
import os
import subprocess
import sys
import time

import requests
import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9334
URL = "http://localhost:8088"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "shots2")
PROFILE = os.path.join(os.environ["TEMP"], "sb-shot-profile")

W, H = 412, 915
os.makedirs(OUT, exist_ok=True)


def start_chrome():
    # Profil dibersihkan tiap run supaya state AsyncStorage tidak nyangkut
    # dari sesi sebelumnya (kita selalu mulai dari layar login).
    import shutil
    shutil.rmtree(PROFILE, ignore_errors=True)
    proc = subprocess.Popen(
        [
            CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
            f"--remote-debugging-port={PORT}", "--remote-allow-origins=*",
            f"--user-data-dir={PROFILE}", f"--window-size={W},{H}",
            "--hide-scrollbars", "--force-device-scale-factor=2", URL,
        ],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(60):
        time.sleep(0.5)
        try:
            for t in requests.get(f"http://127.0.0.1:{PORT}/json/list", timeout=2).json():
                if t.get("type") == "page" and "localhost" in t.get("url", ""):
                    return t["webSocketDebuggerUrl"], proc
        except Exception:
            pass
    raise RuntimeError("chrome/CDP tidak muncul")


class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=40)
        self.i = 0

    def send(self, method, **params):
        self.i += 1
        self.ws.send(json.dumps({"id": self.i, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.i:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def js(self, expr):
        r = self.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        res = r.get("result", {})
        if res.get("subtype") == "error":
            raise RuntimeError(res.get("description", "js error"))
        return res.get("value")

    def shot(self, name):
        r = self.send("Page.captureScreenshot", format="png")
        path = os.path.join(OUT, name)
        with open(path, "wb") as fh:
            fh.write(base64.b64decode(r["data"]))
        print("  shot ->", name)
        return path

    def tap(self, testid):
        """Klik elemen ber-testID: scroll ke tengah layar dulu, lalu klik."""
        ok = self.js(
            "(() => { const el = document.querySelector('[data-testid=\"%s\"]');"
            " if (!el) return false; el.scrollIntoView({block:'center'}); return true; })()" % testid
        )
        if not ok:
            raise RuntimeError(f"testID tidak ditemukan: {testid}")
        time.sleep(0.45)
        box = self.js(
            "(() => { const el = document.querySelector('[data-testid=\"%s\"]');"
            " if (!el) return null; const r = el.getBoundingClientRect();"
            " return {x: r.left + r.width/2, y: r.top + r.height/2, w: r.width, h: r.height}; })()" % testid
        )
        if not box:
            raise RuntimeError(f"testID hilang setelah scroll: {testid}")
        for t in ("mousePressed", "mouseReleased"):
            self.send("Input.dispatchMouseEvent", type=t, x=box["x"], y=box["y"],
                      button="left", clickCount=1)
            time.sleep(0.05)
        time.sleep(0.35)

    def type_into(self, testid, text):
        """Isi input ber-testID dengan fokus + insertText (huruf demi huruf)."""
        ok = self.js(
            "(() => { const el = document.querySelector('[data-testid=\"%s\"]');"
            " if (!el) return false; el.focus(); return true; })()" % testid
        )
        if not ok:
            raise RuntimeError(f"input tidak ditemukan: {testid}")
        for ch in text:
            self.send("Input.dispatchKeyEvent", type="keyDown", text=ch)
            self.send("Input.dispatchKeyEvent", type="keyUp", text=ch)
            time.sleep(0.01)
        time.sleep(0.2)

    def scroll(self, dy=400):
        self.js(f"window.scrollTo(0, (window.scrollY||0) + {dy})")
        time.sleep(0.3)


def main():
    ws_url, proc = start_chrome()
    cdp = CDP(ws_url)
    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        # tunggu bundel RN selesai render
        for _ in range(60):
            time.sleep(1)
            try:
                n = cdp.js("document.querySelectorAll('[data-testid]').length")
                if n and n > 3:
                    break
            except Exception:
                pass
        print("testID terdeteksi:", cdp.js("document.querySelectorAll('[data-testid]').length"))

        # ---------- 1. layar login
        time.sleep(1.5)
        cdp.shot("01-login.png")

        # ---------- 2. daftar sebagai penjual (biar lihat form lengkap)
        cdp.tap("tab-signup")
        time.sleep(0.4)
        cdp.tap("pick-merchant")
        time.sleep(0.4)
        cdp.type_into("in-name", "Mada Penjual")
        cdp.type_into("in-email", "jualan@nira.id")
        cdp.type_into("in-password", "rahasia123")
        cdp.type_into("in-biz", "Warung Mada")
        cdp.type_into("in-addr", "Jl. Merdeka 10, Salatiga")
        cdp.type_into("in-phone", "0812-3456-7890")
        time.sleep(0.4)
        cdp.shot("02-daftar-penjual.png")
        cdp.scroll(500)
        cdp.shot("02b-daftar-penjual-bawah.png")
        cdp.tap("btn-submit")
        time.sleep(1.2)
        cdp.shot("03-verifikasi-pending.png")

        # ---------- 3. setujui (demo) -> dashboard penjual
        cdp.scroll(600)
        time.sleep(0.3)
        cdp.tap("btn-approve")
        time.sleep(1.2)
        cdp.shot("04-dashboard-penjual.png")

        # ---------- 4. keluar -> login konsumen
        cdp.tap("btn-merchant-signout")
        time.sleep(1.0)
        cdp.tap("demo-consumer")
        time.sleep(0.3)
        cdp.tap("btn-submit")
        time.sleep(1.5)
        cdp.shot("05-konsumen-jelajahi.png")

        # ---------- 5. pesan satu item
        cdp.tap("item-i1")
        time.sleep(1.0)
        cdp.shot("06-detail-makanan.png")
        cdp.scroll(700)
        cdp.shot("06b-detail-bawah.png")
        cdp.scroll(700)
        time.sleep(0.3)
        cdp.shot("06c-detail-aksi.png")
        # Pesan (RN-web Alert adalah no-op, jadi layar langsung balik ke tab Pesanan)
        cdp.tap("btn-order")
        time.sleep(1.2)
        cdp.shot("07-pesanan-setelah-order.png")

        # ---------- 6. tab profil
        cdp.tap("tab-profile")
        time.sleep(1.0)
        cdp.shot("07-profil-konsumen.png")

        # ---------- 7. tab pesanan
        cdp.tap("tab-orders")
        time.sleep(0.8)
        cdp.shot("08-pesanan.png")

        # ---------- 8. tab dampak
        cdp.tap("tab-impact")
        time.sleep(0.8)
        cdp.shot("09-dampak.png")

        print("\nselesai. semua screenshot di", OUT)
    finally:
        try:
            cdp.ws.close()
        except Exception:
            pass
        proc.terminate()


if __name__ == "__main__":
    main()
