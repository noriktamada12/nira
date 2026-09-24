// Server share APK lewat Node (node.exe sudah diizinkan firewall karena Metro jalan di 8081)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8090;
const DIR = 'C:\\Users\\Mada\\Documents\\foodflow';
const FILE = 'NIRA-v2.1.apk';

function lanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' ) {
    const files = fs.readdirSync(DIR).filter(f => f.endsWith('.apk'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<html><body style="font-family:sans-serif;padding:24px">
      <h2>NIRA — APK</h2>
      <ul>${files.map(f => `<li><a href="/${encodeURIComponent(f)}">${f}</a></li>`).join('')}</ul>
    </body></html>`);
    return;
  }
  const filePath = path.join(DIR, path.basename(urlPath));
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('not found'); return;
  }
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
  });
  fs.createReadStream(filePath).pipe(res);
  console.log(`[${new Date().toLocaleTimeString()}] dikirim: ${path.basename(filePath)} (${(stat.size/1048576).toFixed(1)} MB)`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`APK server jalan: http://${lanIP()}:${PORT}/${FILE}`);
});
