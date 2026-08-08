#!/usr/bin/env node
/**
 * One-off: log in as a real account, load rejection-detail.html for a given
 * candidate, and report whether the override-access gate (Admin/Compliance
 * Officer only) is enforcing correctly — draft-only banner presence and
 * finalize-button state. Not part of the reusable driver (that's for
 * unauthenticated smoke checks).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..', '..');
const PORT = 8844;

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
const CANDIDATE_ID = process.argv[4];
if (!EMAIL || !PASSWORD || !CANDIDATE_ID) {
  console.error('Usage: node override-gate-test.mjs <email> <password> <candidateId>');
  process.exit(1);
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const consoleMessages = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => consoleMessages.push({ type: 'pageerror', text: err.message }));

  console.log('Navigating to login page...');
  await page.goto(`http://localhost:${PORT}/dashboard/login.html`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('#login-btn');
  await page.waitForTimeout(2500);

  if (page.url().includes('login.html')) {
    console.log('Login FAILED — still on login.html.');
    await browser.close();
    server.close();
    return;
  }

  console.log(`Login OK, loading rejection-detail.html?id=${CANDIDATE_ID} ...`);
  await page.goto(`http://localhost:${PORT}/dashboard/rejection-detail.html?id=${CANDIDATE_ID}`, {
    waitUntil: 'networkidle', timeout: 15000,
  });
  await page.waitForTimeout(1500);

  const draftBannerVisible = await page.locator('#draftOnlyBanner').isVisible().catch(() => false);
  const submitBtnDisabled = await page.locator('#submitBtn').isDisabled().catch(() => null);
  const submitHint = await page.locator('#submitHint').textContent().catch(() => null);

  console.log('\n--- Override gate result ---');
  console.log(`Draft-only banner visible: ${draftBannerVisible}`);
  console.log(`Finalize button disabled:  ${submitBtnDisabled}`);
  console.log(`Submit hint text:          "${submitHint?.trim()}"`);

  const shotDir = path.join(__dirname, 'screenshots');
  fs.mkdirSync(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, 'override-gate-result.png'), fullPage: true });

  console.log('\n--- Console output ---');
  if (consoleMessages.length === 0) console.log('(none)');
  for (const m of consoleMessages) console.log(`[${m.type}] ${m.text}`);

  await browser.close();
  server.close();
}

main().catch((e) => { console.error('Driver failed:', e); process.exit(1); });
