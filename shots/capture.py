"""Screenshot every Food Flow screen by driving headless Chrome over CDP.

Taps target React Native `testID`s (which RN-web renders as data-testid),
so nothing depends on guessing element text. Input goes through CDP
Input.dispatchMouseEvent - real browser-level events that RN-web's Pressable
actually responds to.

Usage: python capture.py
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
PORT = 9333
URL = "http://localhost:8088"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "shots")
PROFILE = os.path.join(os.environ["TEMP"], "ff-shot-profile")

W, H = 412, 915
os.makedirs(OUT, exist_ok=True)


def start_chrome():
    # IMPORTANT: never `taskkill /IM chrome.exe` here - that would kill the
    # user's own Chrome session (WhatsApp, Trello, ...). Launch a private
    # headless instance on its own profile and track its PID so we can stop
    # only that process later.
    proc = subprocess.Popen(
        [
            CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
            f"--remote-debugging-port={PORT}", "--remote-allow-origins=*",
            f"--user-data-dir={PROFILE}", f"--window-size={W},{H}",
            "--hide-scrollbars", "--force-device-scale-factor=2", URL,
        ],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(50):
        time.sleep(0.5)
        try:
            for t in requests.get(f"http://127.0.0.1:{PORT}/json/list", timeout=2).json():
                if t.get("type") == "page" and "localhost" in t.get("url", ""):
                    return t["webSocketDebuggerUrl"], proc
        except Exception:
            pass
    raise RuntimeError("chrome/CDP did not come up")


class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30)
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

    def tap_xy(self, x, y):
        for t in ("mousePressed", "mouseReleased"):
            self.send("Input.dispatchMouseEvent", type=t, x=x, y=y,
                      button="left", clickCount=1, pointerType="mouse")
        time.sleep(0.4)

    def tap_testid(self, testid):
        box = self.js(
            "(() => {"
            f"  const el = document.querySelector('[data-testid={json.dumps(testid)}]');"
            "  if (!el) return null;"
            "  const r = el.getBoundingClientRect();"
            "  if (r.width === 0 || r.height === 0) return null;"
            "  return {x: r.left + r.width/2, y: r.top + r.height/2, w: r.width, h: r.height};"
            "})()"
        )
        if not box:
            print(f"    (no element for testID '{testid}')")
            return False
        print(f"    tap [{testid}] @ {box['x']:.0f},{box['y']:.0f}")
        self.tap_xy(box["x"], box["y"])
        return True

    def count_testid(self, prefix):
        return self.js(
            f"document.querySelectorAll('[data-testid^={json.dumps(prefix)}]').length"
        )


def main():
    ws, proc = start_chrome()
    cdp = CDP(ws)
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=2, mobile=True)

    print("waiting for bundle…")
    for _ in range(70):
        try:
            n = cdp.count_testid("item-")
        except Exception:
            n = 0
        if n:
            break
        time.sleep(1)
    time.sleep(3)

    # Deterministic run: wipe persisted app state (AsyncStorage -> localStorage)
    # and reload, otherwise leftovers from an earlier run change the first screen.
    cdp.js("(() => { try { localStorage.clear(); } catch(e){} return 1; })()")
    cdp.send("Page.reload")
    time.sleep(2)
    for _ in range(70):
        try:
            n = cdp.count_testid("item-")
        except Exception:
            n = 0
        if n:
            break
        time.sleep(1)
    time.sleep(2.5)
    print(f"  items on screen: {cdp.count_testid('item-')}")

    print("\n[1] Jelajahi (konsumen)")
    cdp.shot("01-explore.png")

    print("[2] Detail makanan")
    if cdp.tap_testid("item-i1"):
        time.sleep(2.2)
        cdp.shot("02-detail.png")

    print("[3] Pesan sekarang")
    if cdp.tap_testid("btn-order"):
        time.sleep(2.5)
        cdp.shot("03-orders.png")

    print("[4] Tab Dampak")
    if cdp.tap_testid("tab-impact"):
        time.sleep(2)
        cdp.shot("04-impact.png")

    print("[5] Ganti ke sisi Penjual")
    if cdp.tap_testid("role-merchant"):
        time.sleep(2.5)
        cdp.shot("05-merchant.png")

    print("[6] Verifikasi pengambilan")
    ok = cdp.js(
        "(() => { const el = document.querySelector('[data-testid^=\"verify-\"]');"
        " if (!el) return null; const r = el.getBoundingClientRect();"
        " return {x: r.left+r.width/2, y: r.top+r.height/2}; })()"
    )
    if ok:
        cdp.tap_xy(ok["x"], ok["y"])
        time.sleep(2.2)
        cdp.shot("06-merchant-verified.png")
    else:
        print("    (no pending order to verify)")

    print("[7] Sheet upload surplus")
    if cdp.tap_testid("btn-upload"):
        time.sleep(2)
        cdp.shot("07-upload-sheet.png")

    # Tutup sheet upload, lalu buka layar Pesanan untuk menguji rating bintang.
    print("[8] Rating penjual (konsumen)")
    cdp.js("(() => { const els = [...document.querySelectorAll('div')];"
           " const b = els.find(e => e.textContent.trim() === 'Tutup');"
           " if (b) { b.click(); return 1; } return 0; })()")
    time.sleep(1.5)
    if cdp.tap_testid("role-consumer"):
        time.sleep(2)
    if cdp.tap_testid("tab-orders"):
        time.sleep(2)
        cdp.shot("08-orders-rating.png")
        # buka form rating (tombol "Beri rating" belum punya testID -> klik by teks)
        opened = cdp.js(
            "(() => { const els = [...document.querySelectorAll('div,span')];"
            " const b = els.filter(e => (e.textContent||'').includes('Beri rating'));"
            " const t = b[b.length-1]; if (!t) return 0;"
            " const r = t.getBoundingClientRect();"
            " return {x: r.left+r.width/2, y: r.top+r.height/2}; })()"
        )
        if opened and isinstance(opened, dict):
            cdp.tap_xy(opened["x"], opened["y"])
            time.sleep(1.5)
            cdp.shot("09-rating-form.png")
        else:
            print("    (tombol Beri rating tidak ditemukan)")

    print("\n---- merchant screen text ----")
    print((cdp.js("document.body.innerText") or "")[:1500])
    print("\nshots ->", OUT)

    # stop only the headless instance we started, never the user's Chrome
    proc.terminate()


if __name__ == "__main__":
    sys.exit(main())
