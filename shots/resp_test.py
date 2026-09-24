"""Tes responsif NIRA di beberapa lebar layar.

Buka app web di viewport 320 / 360 / 412 / 768 px, ambil screenshot layar
login + jelajahi + detail + profil, lalu simpan montage per lebar.
"""
import base64
import json
import os
import shutil
import subprocess
import sys
import time

import requests
import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9337
URL = "http://localhost:8088"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "shots_resp")
PROFILE = os.path.join(os.environ["TEMP"], "sb-resp-profile")

WIDTHS = [320, 360, 412, 768]
HEIGHT = 800

os.makedirs(OUT, exist_ok=True)


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
        return path

    def tap(self, testid):
        ok = self.js(
            "(() => { const el = document.querySelector('[data-testid=\"%s\"]');"
            " if (!el) return false; el.scrollIntoView({block:'center'}); return true; })()" % testid
        )
        if not ok:
            raise RuntimeError(f"testID tidak ditemukan: {testid}")
        time.sleep(0.4)
        box = self.js(
            "(() => { const el = document.querySelector('[data-testid=\"%s\"]');"
            " if (!el) return null; const r = el.getBoundingClientRect();"
            " return {x: r.left + r.width/2, y: r.top + r.height/2}; })()" % testid
        )
        for t in ("mousePressed", "mouseReleased"):
            self.send("Input.dispatchMouseEvent", type=t, x=box["x"], y=box["y"],
                      button="left", clickCount=1)
            time.sleep(0.05)
        time.sleep(0.3)


def start_chrome(width):
    shutil.rmtree(PROFILE, ignore_errors=True)
    proc = subprocess.Popen(
        [CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
         f"--remote-debugging-port={PORT}", "--remote-allow-origins=*",
         f"--user-data-dir={PROFILE}", f"--window-size={width},{HEIGHT}",
         "--hide-scrollbars", "--force-device-scale-factor=1", URL],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws_url = None
    for _ in range(60):
        time.sleep(0.5)
        try:
            for t in requests.get(f"http://127.0.0.1:{PORT}/json/list", timeout=2).json():
                if t.get("type") == "page" and "localhost" in t.get("url", ""):
                    ws_url = t["webSocketDebuggerUrl"]
                    break
        except Exception:
            pass
        if ws_url:
            break
    return ws_url, proc


def check_overflow(cdp):
    """Deteksi elemen yang lebih lebar dari viewport (overflow horizontal)."""
    return cdp.js("""(() => {
      const vw = window.innerWidth;
      const bad = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > vw + 1 && r.height > 8 && r.width < 5000) {
          bad.push({tag: el.tagName, w: Math.round(r.width), txt: (el.textContent||'').slice(0,40)});
        }
      });
      return {vw, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 10)};
    })()""")


def run_width(width):
    print(f"\n=== lebar {width}px ===")
    ws_url, proc = start_chrome(width)
    cdp = CDP(ws_url)
    try:
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        # Chrome headless membatasi lebar window (~500px) -> paksa viewport
        # lewat emulasi device supaya 320/360/412px benar-benar diuji.
        cdp.send("Emulation.setDeviceMetricsOverride",
                 width=width, height=HEIGHT, deviceScaleFactor=1, mobile=True)
        time.sleep(0.5)
        for _ in range(60):
            time.sleep(1)
            try:
                if cdp.js("document.querySelectorAll('[data-testid]').length") > 3:
                    break
            except Exception:
                pass

        # login -> konsumen
        cdp.tap("demo-consumer")
        time.sleep(0.3)
        cdp.tap("btn-submit")
        time.sleep(1.5)
        cdp.shot(f"w{width}-01-jelajahi.png")
        ov1 = check_overflow(cdp)

        cdp.tap("item-i1")
        time.sleep(1.0)
        cdp.shot(f"w{width}-02-detail.png")
        ov2 = check_overflow(cdp)

        # keluar dari detail (Alert no-op di web) -> balik ke tab Pesanan
        cdp.tap("btn-order")
        time.sleep(1.2)

        cdp.tap("tab-profile")
        time.sleep(0.8)
        cdp.shot(f"w{width}-03-profil.png")
        ov3 = check_overflow(cdp)

        cdp.tap("tab-orders")
        time.sleep(0.8)
        cdp.shot(f"w{width}-04-pesanan.png")

        cdp.tap("tab-impact")
        time.sleep(0.8)
        cdp.shot(f"w{width}-05-dampak.png")

        print(f"  overflow jelajahi: vw={ov1['vw']} scrollW={ov1['scrollW']} bad={len(ov1['bad'])}")
        for b in ov1["bad"][:4]:
            print(f"    {b}")
        print(f"  overflow detail:   scrollW={ov2['scrollW']} bad={len(ov2['bad'])}")
        for b in ov2["bad"][:4]:
            print(f"    {b}")
        print(f"  overflow profil:   scrollW={ov3['scrollW']} bad={len(ov3['bad'])}")
        for b in ov3["bad"][:4]:
            print(f"    {b}")
    finally:
        try:
            cdp.ws.close()
        except Exception:
            pass
        proc.terminate()
        time.sleep(1)


def main():
    for w in WIDTHS:
        try:
            run_width(w)
        except Exception as e:
            print(f"  ERROR di {w}: {e}")
    print("\nselesai. screenshot di", OUT)


if __name__ == "__main__":
    main()
