#!/usr/bin/env node
/**
 * One-off: drive the real login form, then load audit-trail.html with
 * the resulting authenticated session. Not part of the reusable driver
 * (that's for unauthenticated smoke checks) — this is for verifying
 * real-data rendering with a real account.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..', '..');
const PORT = 8843;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.txt': 'text/plain',
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

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
if (!EMAIL || !PASSWORD) {
  console.error('Usage: node login-test.mjs <email> <password>');
  process.exit(1);
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const consoleMessages = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => consoleMessages.push({ type: 'pageerror', text: err.message }));
  page.on('requestfailed', (req) => consoleMessages.push({ type: 'requestfailed', text: `${req.url()} — ${req.failure()?.errorText}` }));
  page.on('response', (res) => { if (res.status() >= 400) consoleMessages.push({ type: 'http-error', text: `${res.status()} ${res.url()}` }); });

  console.log(`Navigating to login page...`);
  await page.goto(`http://localhost:${PORT}/dashboard/login.html`, { waitUntil: 'networkidle', timeout: 15000 });

  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);

  const shotDir = path.join(__dirname, 'screenshots');
  fs.mkdirSync(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, 'login-filled.png'), fullPage: true });

  console.log('Clicking Sign In...');
  await page.click('#login-btn');
  await page.waitForTimeout(2500); // let the auth call + any redirect settle

  const afterLoginUrl = page.url();
  console.log(`URL after login attempt: ${afterLoginUrl}`);
  await page.screenshot({ path: path.join(shotDir, 'after-login.png'), fullPage: true });

  const loginFailed = afterLoginUrl.includes('login.html');
  if (loginFailed) {
    console.log('\n--- Login appears to have FAILED (still on login.html) ---');
    const errorText = await page.locator('#error-alert').textContent().catch(() => null);
    if (errorText) console.log(`Error banner text: "${errorText.trim()}"`);
  } else {
    console.log('\n--- Login appears to have SUCCEEDED, now navigating to audit-trail.html ---');
    await page.goto(`http://localhost:${PORT}/dashboard/audit-trail.html`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    console.log(`Final URL: ${page.url()}`);
    await page.screenshot({ path: path.join(shotDir, 'audit-trail-authenticated.png'), fullPage: true });
  }

  console.log('\n--- Console output (full session) ---');
  if (consoleMessages.length === 0) console.log('(none)');
  for (const m of consoleMessages) console.log(`[${m.type}] ${m.text}`);

  await browser.close();
  server.close();
}

main().catch((e) => { console.error('Driver failed:', e); process.exit(1); });
