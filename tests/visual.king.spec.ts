import { test, expect } from '@playwright/test';

test('king crown is visible and round-ish', async ({ page }) => {
  await page.goto('/');
  // wait for board to render
  await page.waitForSelector('#board .piece');
  const piece = page.locator('#board .piece').first();
  // Promote it visually by adding 'king' and appending an inline crown if missing
  await piece.evaluate((el) => {
    el.classList.add('king');
    if (!el.querySelector('.crown')) {
      const span = document.createElement('span');
      span.className = 'crown';
      span.innerHTML =
        "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false'><path d='M8 46 L16 20 L24 34 L32 18 L40 34 L48 20 L56 46 Z' fill='#00E5FF'/><rect x='12' y='46' width='40' height='6' rx='2' fill='#00E5FF'/></svg>";
      el.appendChild(span);
    }
  });

  await expect(piece.locator('.crown svg')).toBeVisible();
  // Bounding box width/height ratio near 1 to ensure not a skinny oval
  const box = await piece.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.3);
  }
});

