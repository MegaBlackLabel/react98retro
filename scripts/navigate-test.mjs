import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 768 });
await page.goto('http://localhost:5174/');
await page.waitForSelector('tbody tr', { timeout: 5000 });
await page.waitForTimeout(500);

// Double-click the first row (C: drive)
await page.locator('tbody tr').first().dblclick();
await page.waitForTimeout(800);
await page.screenshot({ path: 'image/screenshot-c-drive.png' });
console.log('C: drive screenshot taken');

// Check row count
const count = await page.locator('tbody tr').count();
console.log('Rows in C:', count);

// Try to navigate to WINDOWS
const winRow = page.locator('tbody tr', { hasText: 'WINDOWS' });
if (await winRow.count() > 0) {
  await winRow.dblclick();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'image/screenshot-windows.png' });
  console.log('WINDOWS folder screenshot taken');
}

await browser.close();
