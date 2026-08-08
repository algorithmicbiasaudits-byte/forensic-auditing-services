---
name: run-forensic-auditing-services-main
description: Run, serve, and drive the F.A.S. static site (forensic-auditing-services-main) in a real browser. Use when asked to start this app, screenshot a dashboard page, check console errors after an edit, or verify a page renders/loads correctly.
---

Static HTML/CSS/JS site, no build step, no framework. Several dashboard
pages use `<script type="module">` imports, so they must be served over
HTTP — opening via `file://` fails (browsers block ES module imports
under that protocol). Drive it via
`.claude/skills/run-forensic-auditing-services-main/driver.mjs`, which
serves the site root and drives headless Chromium via Playwright
directly (this machine has no `chromium-cli` binary, so the driver talks
to the same underlying engine directly instead).

All paths below are relative to `forensic-auditing-services-main/`
(this skill's grandparent directory).

## Prerequisites

This machine is Windows, not Linux — no `apt-get`, no `xvfb` needed
(headless Chromium runs natively on Windows). What actually had to be
installed, and the exact workaround needed for both:

This environment fails standard TLS certificate verification on
outbound HTTPS (`UNABLE_TO_VERIFY_LEAF_SIGNATURE` from both `npm` and
Playwright's own downloader — same root cause as the `CRYPT_E_NO_REVOCATION_CHECK`
curl issue seen elsewhere in this project). Both installs below need a
scoped, one-off bypass — not a persistent config change.

```bash
cd forensic-auditing-services-main
npm install --strict-ssl=false --no-save playwright
NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright install chromium
```

`playwright` lands in `node_modules/` at the site root (gitignored —
this project's `.gitignore` already covers `node_modules/`). Chromium
itself installs to `~/AppData/Local/ms-playwright/`, outside the repo.
Both are one-time; skip this section if `node_modules/playwright`
already exists.

## Run (agent path)

```bash
cd forensic-auditing-services-main
MSYS_NO_PATHCONV=1 node ".claude/skills/run-forensic-auditing-services-main/driver.mjs" "/dashboard/audit-trail.html" --screenshot audit-trail.png
```

`MSYS_NO_PATHCONV=1` is required on this machine's Git Bash — without
it, MSYS auto-converts the leading `/` in the route argument into a
Windows path (`/dashboard/...` → `C:/Program Files/Git/dashboard/...`),
and navigation fails with "Cannot navigate to invalid URL."

The driver: starts a minimal static file server on port 8842 (built-in
Node `http`, no extra dependency), launches headless Chromium, navigates
to the given route, waits for network idle + 1s settle time (covers
async auth/session checks), optionally screenshots, and prints every
console message, page error, failed request, and HTTP 4xx/5xx response
it saw. It exits after one page load — it's a single-shot smoke check,
not a persistent server.

Screenshots land in
`.claude/skills/run-forensic-auditing-services-main/screenshots/<name>.png`.

| argument | what it does |
|---|---|
| `<route>` (positional, required) | path to load, e.g. `/dashboard/audit-trail.html` or `/index.html` |
| `--screenshot <name>.png` (optional) | saves a full-page screenshot under `screenshots/` |

To check a different page, swap the route argument. To check server
routing/asset paths without a screenshot, omit `--screenshot` — the
console/network output alone is often enough to catch a broken
relative import or wrong redirect target.

## Run (human path)

Just open the file in a browser via a real local server (any static
server works — this doesn't have to be the driver's built-in one):

```bash
cd forensic-auditing-services-main
npx --yes http-server -p 8842
# then open http://localhost:8842/dashboard/audit-trail.html
```

Useless for pages using `<script type="module">` if opened via
`file://` instead — the import will silently fail with no page-level
error visible except in devtools console.

## Gotchas

- **Relative import paths in `dashboard/*.html` resolve relative to
  `dashboard/`, not the site root.** `math/impactAnalysis.js` lives at
  the site root, a sibling of `dashboard/`, not inside it. A dashboard
  page importing `from './math/impactAnalysis.js'` will 404 — needs
  `../math/impactAnalysis.js`. This exact bug shipped once and was only
  caught by actually running the driver — a **failed ES module import
  silently kills the entire `<script type="module">` block**, including
  any `DOMContentLoaded` listener inside it, so the page just sits on
  its static placeholder HTML forever with no visible error and no
  crash. Always check the driver's console output for 404s on `.js`
  imports, not just for `pageerror` entries.
- **Redirect targets inside `dashboard/*.html` must be relative
  (`'login.html'`), not absolute (`'/login.html'`).** `login.html`
  lives inside `dashboard/`, not at the site root — an absolute-path
  redirect resolves to a nonexistent site-root `login.html` and 404s.
- **The Tailwind CDN dev-mode console warning
  (`cdn.tailwindcss.com should not be used in production...`) is
  expected on every page using the Tailwind CDN script tag** — it's not
  a real error, don't chase it.
- **MSYS path mangling** (see Run section above) — always run the
  driver with `MSYS_NO_PATHCONV=1` when the route argument starts with
  `/`.

## Troubleshooting

- **`npm error UNABLE_TO_VERIFY_LEAF_SIGNATURE`** installing Playwright:
  this machine's TLS chain fails standard verification for some
  registries/CDNs. Fix: `npm install --strict-ssl=false --no-save
  playwright`.
- **Chromium download fails with the same
  `UNABLE_TO_VERIFY_LEAF_SIGNATURE` error** even after the npm install
  succeeds: `npx playwright install chromium` does its own HTTPS
  download outside npm's client, so the npm flag doesn't cover it.
  Fix: prefix with `NODE_TLS_REJECT_UNAUTHORIZED=0` for that one
  command only — don't set it globally or leave it in the environment
  afterward.
- **`page.goto: Protocol error... Cannot navigate to invalid URL`**
  with a mangled path like `http://localhost:8842C:/Program
  Files/Git/dashboard/...`: MSYS path conversion, see Gotchas. Rerun
  with `MSYS_NO_PATHCONV=1`.
- **Page loads but every panel is stuck on its placeholder text**
  ("Initializing...", "Awaiting...") and nothing in the console says
  `pageerror`: check the driver's `http-error`/`requestfailed` lines
  for a 404 on a `.js` import — a failed module import fails silently
  at the page level, see Gotchas.
