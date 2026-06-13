import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const EVIDENCE_DIR = path.join(projectRoot, '.sisyphus', 'evidence');
const RECT_JSON_PATH = path.join(EVIDENCE_DIR, 'task-5-storybook-rects.json');
const SCREENSHOT_PATH = path.join(EVIDENCE_DIR, 'task-5-window-snap-overlap.png');

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 768;
const STORYBOOK_PORT = 6087;

function serveStorybookStatic(root) {
  const server = http.createServer((req, res) => {
    let filePath = path.join(root, req.url.split('?')[0]);
    if (filePath.endsWith('/')) {
      filePath += 'index.html';
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType =
        {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.mjs': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
        }[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(STORYBOOK_PORT, () => {
      console.log(`Serving storybook-static at http://localhost:${STORYBOOK_PORT}`);
      resolve(server);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWindowRect(page, title) {
  return page.evaluate((windowTitle) => {
    const windows = Array.from(document.querySelectorAll('.window'));
    const el = windows.find((w) => w.textContent.includes(windowTitle));
    if (!el) return null;
    return el.getBoundingClientRect().toJSON();
  }, title);
}

function intersectionArea(a, b) {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

async function waitForStableRect(page, title, timeout = 5000) {
  const start = Date.now();
  let lastRect = null;

  while (Date.now() - start < timeout) {
    const rect = await getWindowRect(page, title);
    if (
      lastRect &&
      rect &&
      lastRect.left === rect.left &&
      lastRect.top === rect.top &&
      lastRect.width === rect.width &&
      lastRect.height === rect.height
    ) {
      return rect;
    }
    lastRect = rect;
    await sleep(100);
  }

  return lastRect;
}

async function dragTitleBarTo(page, title, targetX, targetY) {
  const titleBar = page.locator('.title-bar', { hasText: title });
  await titleBar.waitFor({ state: 'visible' });
  const box = await titleBar.boundingBox();
  if (!box) throw new Error(`Title bar not found for ${title}`);

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 10 });
  await sleep(200);
  await page.mouse.up();
}

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const staticRoot = path.join(projectRoot, 'storybook-static');
  if (!fs.existsSync(staticRoot)) {
    throw new Error(`Built Storybook not found at ${staticRoot}. Run: mise exec -- bun run build-storybook`);
  }

  const server = await serveStorybookStatic(staticRoot);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const storyUrl = `http://localhost:${STORYBOOK_PORT}/iframe.html?id=window-window--snap-overlap-shrink`;
  console.log('Opening story:', storyUrl);
  await page.goto(storyUrl);

  // Wait for the story iframe to load and render windows
  await page.waitForSelector('.window', { timeout: 10000 });
  await sleep(1000);

  // Snap Background A to the top edge
  console.log('Snapping Background A to top...');
  await dragTitleBarTo(page, 'Background A', VIEWPORT_WIDTH / 2, 10);
  await waitForStableRect(page, 'Background A');
  await sleep(500);

  // Snap Foreground B to the right edge
  console.log('Snapping Foreground B to right...');
  await dragTitleBarTo(page, 'Foreground B', VIEWPORT_WIDTH - 10, VIEWPORT_HEIGHT / 2);
  await waitForStableRect(page, 'Foreground B');
  await sleep(500);

  // Measure final DOM rects
  const rectA = await getWindowRect(page, 'Background A');
  const rectB = await getWindowRect(page, 'Foreground B');

  if (!rectA || !rectB) {
    throw new Error('Could not measure one or both window rects');
  }

  const overlap = intersectionArea(rectA, rectB);
  const passed = overlap === 0;

  const evidence = {
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    rects: { backgroundA: rectA, foregroundB: rectB },
    intersectionArea: overlap,
    passed,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(RECT_JSON_PATH, JSON.stringify(evidence, null, 2));
  console.log('Rects saved to:', RECT_JSON_PATH);
  console.log('Intersection area:', overlap);

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
  console.log('Screenshot saved to:', SCREENSHOT_PATH);

  await browser.close();
  server.close();

  if (!passed) {
    console.error('FAIL: windows still overlap after snap/shrink');
    process.exit(1);
  }

  console.log('PASS: zero intersection area confirmed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
