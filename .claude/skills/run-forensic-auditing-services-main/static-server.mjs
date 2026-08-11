#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..', '..');
const PORT = 8844;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(SITE_ROOT, urlPath);
  if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  // Reject any request that resolves outside SITE_ROOT (e.g. /../../etc/passwd)
  // -- this is a local-only test helper, but don't let it serve arbitrary
  // filesystem paths just because it's not internet-facing.
  const resolved = path.resolve(filePath);
  if (resolved !== SITE_ROOT && !resolved.startsWith(SITE_ROOT + path.sep)) {
    res.writeHead(403); res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});
server.listen(PORT, () => console.log(`Static server on http://localhost:${PORT}`));
