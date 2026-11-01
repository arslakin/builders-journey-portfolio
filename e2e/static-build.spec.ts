import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures.ts';

test('serves the built static page from dist', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  // Built output references bundled assets; the dev server would serve /src/main.tsx.
  await expect(page.locator('script[type="module"][src^="/assets/"]')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    "The Builder's Journey — From Teaching to Technology",
  );
});

test('initial page has no automated accessibility violations', { tag: '@a11y' }, async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
