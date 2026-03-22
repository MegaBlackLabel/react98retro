import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 768 });
await page.goto('http://localhost:5174/');
await page.waitForTimeout(1000);

// Check background color of sunken-panel
const bgColor = await page.evaluate(() => {
  const panel = document.querySelector('.sunken-panel');
  return panel ? getComputedStyle(panel).backgroundColor : 'NOT FOUND';
});
console.log('sunken-panel background:', bgColor);

// Count rows
const rowCount = await page.evaluate(() => {
  return document.querySelectorAll('tbody tr').length;
});
console.log('Rows:', rowCount);

await page.screenshot({ path: 'image/screenshot-initial.png', fullPage: false });

// Double click on C: drive row
const cDriveRow = page.locator('tbody tr').first();
await cDriveRow.dblclick();
await page.waitForTimeout(500);

await page.screenshot({ path: 'image/screenshot-c-drive.png', fullPage: false });

const rowCountAfter = await page.evaluate(() => {
  return document.querySelectorAll('tbody tr').length;
});
console.log('Rows after navigate to C:', rowCountAfter);

// Navigate to WINDOWS folder
const windowsRow = page.locator('tbody tr', { hasText: 'WINDOWS' });
if (await windowsRow.count() > 0) {
  await windowsRow.dblclick();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'image/screenshot-windows-folder.png', fullPage: false });
  console.log('Navigated to WINDOWS folder');
}

await browser.close();
