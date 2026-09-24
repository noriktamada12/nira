"""Server HTTP sederhana untuk share APK Food Flow ke HP di WiFi yang sama."""
import http.server
import socketserver
import socket
import os

PORT = 8090
os.chdir(r"C:\Users\Mada\Documents\foodflow")

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Content-Disposition", "attachment")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # senyap


s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
finally:
    s.close()

print(f"APK siap di: http://{ip}:{PORT}/FoodFlow-v1.0.apk", flush=True)

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    httpd.serve_forever()
