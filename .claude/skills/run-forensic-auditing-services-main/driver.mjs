#!/usr/bin/env node
/**
 * Driver for the F.A.S. static site (forensic-auditing-services-main).
 * No chromium-cli binary on this machine, so this drives Playwright's
 * chromium engine directly (same underlying engine chromium-cli wraps).
 *
 * Usage:
 *   node driver.mjs <path-relative-to-site-root> [--screenshot name.png]
 *
 * Example:
 *   node driver.mjs /dashboard/audit-trail.html --screenshot audit-trail.png
 *
 * Serves the project root (two levels up from this driver, i.e. the
 * forensic-auditing-services-main directory) over plain HTTP — required
 * because dashboard pages use `<script type="module">` imports, which
 * browsers refuse to load under file://.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..', '..'); // .claude/skills/run-.../ -> site root
const PORT = 8842;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.txt': 'text/plain',
  '.xml': 'application/xml',
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(SITE_ROOT, urlPath);
    if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function main() {
  const args = process.argv.slice(2);
  const routePath = args[0] || '/';
  const screenshotIdx = args.indexOf('--screenshot');
  const screenshotName = screenshotIdx !== -1 ? args[screenshotIdx + 1] : null;

  const server = await startServer();
  const url = `http://localhost:${PORT}${routePath}`;

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const consoleMessages = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => consoleMessages.push({ type: 'pageerror', text: err.message }));
  page.on('requestfailed', (req) => consoleMessages.push({ type: 'requestfailed', text: `${req.url()} — ${req.failure()?.errorText}` }));
  page.on('response', (res) => {
    if (res.status() >= 400) consoleMessages.push({ type: 'http-error', text: `${res.status()} ${res.url()}` });
  });

  console.log(`Navigating to ${url} ...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch((e) => {
    consoleMessages.push({ type: 'navigation-error', text: e.message });
  });

  await page.waitForTimeout(1000); // let async init (auth/session checks) settle

  const finalUrl = page.url();
  console.log(`Final URL after any redirects: ${finalUrl}`);

  if (screenshotName) {
    const shotDir = path.join(__dirname, 'screenshots');
    fs.mkdirSync(shotDir, { recursive: true });
    const shotPath = path.join(shotDir, screenshotName);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Screenshot saved: ${shotPath}`);
  }

  console.log('\n--- Console output ---');
  if (consoleMessages.length === 0) {
    console.log('(no console output)');
  } else {
    for (const m of consoleMessages) {
      console.log(`[${m.type}] ${m.text}`);
    }
  }

  await browser.close();
  server.close();
}

main().catch((e) => {
  console.error('Driver failed:', e);
  process.exit(1);
});
