"""Numeric overlap check: does the floating role switcher cover any button?

Vision has mis-read this repeatedly, so measure the actual DOM rectangles:
scroll to the very bottom, then compare the role switcher's rect against every
'Verifikasi ambil' button. Any intersection area > 0 is a real bug.
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
PROFILE = os.path.join(os.environ["TEMP"], "ff-overlap-profile")
HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 412, 915


def start_chrome():
    # never taskkill the user's Chrome - spawn a private headless instance only
    proc = subprocess.Popen(
        [CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
         f"--remote-debugging-port={PORT}", "--remote-allow-origins=*",
         f"--user-data-dir={PROFILE}", f"--window-size={W},{H}",
         "--hide-scrollbars", "--force-device-scale-factor=2", URL],
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
            m = json.loads(self.ws.recv())
            if m.get("id") == self.i:
                if "error" in m:
                    raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})

    def js(self, e):
        r = self.send("Runtime.evaluate", expression=e, returnByValue=True, awaitPromise=True)
        res = r.get("result", {})
        if res.get("subtype") == "error":
            raise RuntimeError(res.get("description"))
        return res.get("value")

    def tap(self, x, y):
        for t in ("mousePressed", "mouseReleased"):
            self.send("Input.dispatchMouseEvent", type=t, x=x, y=y, button="left",
                      clickCount=1, pointerType="mouse")
        time.sleep(0.4)

    def tap_testid(self, tid):
        b = self.js(
            "(() => { const el=document.querySelector('[data-testid=%s]');"
            " if(!el) return null; const r=el.getBoundingClientRect();"
            " return {x:r.left+r.width/2,y:r.top+r.height/2}; })()" % json.dumps(tid)
        )
        if not b:
            return False
        self.tap(b["x"], b["y"])
        return True

    def shot(self, name):
        r = self.send("Page.captureScreenshot", format="png")
        p = os.path.join(HERE, "shots", name)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "wb").write(base64.b64decode(r["data"]))
        return p


def main():
    ws, proc = start_chrome()
    cdp = CDP(ws)
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")
    cdp.send("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=2, mobile=True)

    for _ in range(70):
        try:
            if cdp.js("document.querySelectorAll('[data-testid^=\"item-\"]').length"):
                break
        except Exception:
            pass
        time.sleep(1)
    time.sleep(3)

    # make a few orders so the merchant list is long
    for _ in range(4):
        if cdp.tap_testid("item-i1"):
            time.sleep(1.6)
            cdp.tap_testid("btn-order")
            time.sleep(1.6)

    # go to merchant
    cdp.tap_testid("role-merchant")
    time.sleep(2.5)

    # scroll the merchant ScrollView to the very bottom
    cdp.js(
        "(() => {"
        "  const sc = [...document.querySelectorAll('div')].filter(e => e.scrollHeight > e.clientHeight + 40);"
        "  sc.forEach(e => e.scrollTop = e.scrollHeight);"
        "  return sc.length;"
        "})()"
    )
    time.sleep(1.5)

    report = cdp.js(
        "(() => {"
        "  const sw = document.querySelector('[data-testid=\"role-merchant\"]');"
        "  if (!sw) return {error:'no switcher'};"
        "  const wrap = sw.closest('div').parentElement || sw.parentElement;"
        "  const wr = wrap.getBoundingClientRect();"
        "  const btns = [...document.querySelectorAll('[data-testid^=\"verify-\"]')];"
        "  const res = btns.map(b => {"
        "     const r = b.getBoundingClientRect();"
        "     const ox = Math.max(0, Math.min(r.right, wr.right) - Math.max(r.left, wr.left));"
        "     const oy = Math.max(0, Math.min(r.bottom, wr.bottom) - Math.max(r.top, wr.top));"
        "     return {id: b.getAttribute('data-testid'), overlapPx2: Math.round(ox*oy),"
        "             btnBottom: Math.round(r.bottom), swTop: Math.round(wr.top)};"
        "  });"
        "  return {viewportH: window.innerHeight, switcher: {top: Math.round(wr.top), bottom: Math.round(wr.bottom)},"
        "          buttons: res, worst: Math.max(0, ...res.map(x=>x.overlapPx2))};"
        "})()"
    )
    print(json.dumps(report, indent=2))
    cdp.shot("10-merchant-bottom.png")

    verdict = "PASS" if report.get("worst", 1) == 0 else "FAIL"
    print(f"\noverlap check: {verdict} (worst overlap = {report.get('worst')} px^2)")
    proc.terminate()


if __name__ == "__main__":
    sys.exit(main())
