import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { expect, test } from './fixtures.ts';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

test('desktop navigation reaches and focuses every portfolio heading', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const desktop = page.locator('.desktop-navigation');
  await expect(desktop).toBeVisible();
  await expect(page.locator('.mobile-navigation')).toBeHidden();
  await expect(desktop.getByRole('link')).toHaveCount(3);

  for (const item of [
    { label: 'About', id: 'about' },
    { label: 'Skills / Tech Superpowers', id: 'skills' },
    { label: 'Projects / Achievements', id: 'projects' },
  ]) {
    await desktop.getByRole('link', { name: item.label }).click();
    const heading = page.locator('#' + item.id);
    await expect(heading).toBeFocused();
    await expect(page).toHaveURL(new RegExp('#' + item.id + '$'));
  }

  await expectNoHorizontalOverflow(page);
});

test('mobile navigation opens, closes on Escape, and closes on selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  await expect(page.locator('.desktop-navigation')).toBeHidden();
  await expect(page.locator('.mobile-navigation')).toBeVisible();

  const toggle = page.getByRole('button', { name: 'Open primary navigation' });
  const panel = page.locator('#mobile-navigation-panel');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();

  await toggle.click();
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('link')).toHaveCount(3);

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await panel.getByRole('link', { name: 'Skills / Tech Superpowers' }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#skills')).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test('commands remain local, preserve results, and reveal the journey', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');

  const input = page.getByRole('textbox', { name: 'Command' });
  const output = page.getByTestId('command-output');
  const shortcuts = page.locator('.command-shortcuts');
  await expect(shortcuts.getByRole('button')).toHaveCount(5);

  await input.fill('help');
  await page.getByRole('button', { name: 'Run command' }).click();
  await expect(input).toBeFocused();
  await expect(output.getByRole('heading', { name: 'Available commands' })).toBeVisible();
  await expect(output.locator('code')).toHaveCount(5);

  await input.fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Run command' }).click();
  await expect(output).toContainText(
    'Unsupported command: <img src=x onerror=alert(1)>',
  );
  await expect(output.getByRole('heading', { name: 'Available commands' })).toBeVisible();
  await expect(output.locator('img')).toHaveCount(0);

  await input.fill('');
  await page.getByRole('button', { name: 'Run command' }).click();
  await expect(output).toContainText('Enter a command or choose a shortcut.');
  await expect(output.getByRole('heading', { name: 'Available commands' })).toBeVisible();

  await shortcuts.getByRole('button', { name: 'Run journey command' }).click();
  const commandJourney = output.locator('.journey');
  await expect(commandJourney.getByRole('button')).toHaveCount(3);
  const ai = commandJourney.getByRole('button', { name: /AI/ });
  await ai.click();
  await expect(ai).toHaveAttribute('aria-pressed', 'true');
  await expect(commandJourney).toContainText('Active stage: AI');
  await expect(commandJourney).toContainText(
    'I am developing AI and learning projects',
  );

  await shortcuts.getByRole('button', { name: 'Run superpower command' }).click();
  await expect(output).toContainText(
    'My superpower is making complex ideas understandable',
  );
  await expect(output).not.toContainText('Active stage: AI');
  await expect(input).toBeFocused();
});

test('layout switches at 768px and avoids horizontal overflow', async ({ page }) => {
  for (const width of [320, 375, 640, 767, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    if (width < 768) {
      await expect(page.locator('.mobile-navigation')).toBeVisible();
      await expect(page.locator('.desktop-navigation')).toBeHidden();
    } else {
      await expect(page.locator('.mobile-navigation')).toBeHidden();
      await expect(page.locator('.desktop-navigation')).toBeVisible();
    }

    await expectNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const shortcutBoxes = await page.locator('.command-shortcuts button').evaluateAll(
    (buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return { height: box.height, width: box.width };
      }),
  );
  expect(shortcutBoxes).toHaveLength(5);
  for (const box of shortcutBoxes) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
});

test(
  'interactive mobile states have no automated accessibility violations',
  { tag: '@a11y' },
  async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Open primary navigation' }).click();
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press('Escape');
    await page.getByRole('textbox', { name: 'Command' }).fill('help');
    await page.getByRole('button', { name: 'Run command' }).click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.getByRole('button', { name: 'Run journey command' }).click();
    await page
      .getByTestId('command-output')
      .getByRole('button', { name: /AI/ })
      .click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  },
);

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('removes journey transition motion while retaining selected state', async ({
    page,
  }) => {
    await page.goto('/');
    const aboutJourney = page.locator('.journey').filter({
      has: page.locator('#about-journey-title'),
    });
    const ai = aboutJourney.getByRole('button', { name: /AI/ });
    await ai.click();
    await expect(ai).toHaveAttribute('aria-pressed', 'true');

    const duration = await ai.evaluate((element) =>
      getComputedStyle(element).transitionDuration,
    );
    const firstDuration = Number.parseFloat(duration);
    expect(firstDuration).toBeLessThanOrEqual(0.001);
  });
});

test('certifications expose accurate statuses and only supported verification links', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');

  const cards = page.locator('.certification-card');
  await expect(cards).toHaveCount(10);

  const cka = cards.filter({
    has: page.getByRole('heading', {
      name: 'Certified Kubernetes Administrator (CKA)',
    }),
  });
  await expect(cka).toContainText('Expired');
  await expect(cka).toContainText(
    'Issued December 3, 2022 · expired December 3, 2025',
  );
  await expect(cka.getByRole('link')).toHaveAttribute(
    'href',
    'https://www.credly.com/go/Wr5GF1fB',
  );

  const udacity = cards.filter({
    has: page.getByRole('heading', { name: 'AWS AI Practitioner Challenge' }),
  });
  await expect(udacity).toContainText('Course completion');
  await expect(udacity).toContainText(
    'not the AWS Certified AI Practitioner certification',
  );
  await expect(udacity.getByRole('link')).toHaveAttribute(
    'href',
    'https://www.udacity.com/certificate/e/cb982b6e-3278-11f1-8e93-c320b758d7f5',
  );

  const terraform = cards.filter({
    has: page.getByRole('heading', {
      name: 'HashiCorp Certified: Terraform Associate (002)',
    }),
  });
  await expect(terraform).toContainText('Earned January 25, 2023');
  await expect(terraform).toContainText('current validity not verified');
  await expect(terraform.getByRole('link')).toHaveCount(0);

  await expect(cards.getByRole('link')).toHaveCount(2);
  await expectNoHorizontalOverflow(page);
});
