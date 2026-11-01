import AxeBuilder from '@axe-core/playwright';
import { chromium, type BrowserContext, type Page } from '@playwright/test';

function assertCondition(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const requestedUrl = process.argv[2];
if (requestedUrl === undefined) {
  throw new Error('Provide the confirmed HTTPS deployment URL to verify.');
}

const deploymentUrl = new URL(requestedUrl);
if (deploymentUrl.protocol !== 'https:') {
  throw new Error('Deployment verification requires an HTTPS URL.');
}

const deploymentOrigin = deploymentUrl.origin;
const blockedExternalRequests: string[] = [];
const failedSameOriginResponses: string[] = [];

async function createGuardedPage(
  width: number,
  height: number,
): Promise<{ readonly context: BrowserContext; readonly page: Page }> {
  const context = await browser.newContext({
    viewport: { width, height },
    serviceWorkers: 'block',
  });

  await context.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === deploymentOrigin) {
      await route.continue();
      return;
    }

    blockedExternalRequests.push(`${requestUrl.origin}${requestUrl.pathname}`);
    await route.abort('blockedbyclient');
  });

  const page = await context.newPage();
  page.on('response', (response) => {
    const responseUrl = new URL(response.url());
    if (responseUrl.origin === deploymentOrigin && !response.ok()) {
      failedSameOriginResponses.push(
        `${String(response.status())} ${responseUrl.pathname}`,
      );
    }
  });

  return { context, page };
}

async function openDeployment(page: Page): Promise<number> {
  const response = await page.goto(deploymentUrl.href, {
    waitUntil: 'networkidle',
  });
  assertCondition(response !== null, 'Deployment returned no document response.');
  assertCondition(
    response.ok(),
    `Deployment returned HTTP ${String(response.status())}.`,
  );
  return response.status();
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await createGuardedPage(1280, 900);
  const documentStatus = await openDeployment(desktop.page);

  await desktop.page.getByRole('heading', {
    level: 1,
    name: "The Builder's Journey — From Teaching to Technology",
  }).waitFor();
  await desktop.page.getByText(
    'Deployment verified on AWS Amplify Hosting.',
  ).waitFor();
  const liveLink = desktop.page.getByRole('link', {
    name: 'Open the live portfolio',
  });
  assertCondition(
    (await liveLink.getAttribute('href')) === deploymentUrl.href,
    'The published deployment link does not match the verified URL.',
  );

  const resources = await desktop.page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name).pathname),
  );
  const loadedAssets = resources.filter(
    (path) => path.endsWith('.js') || path.endsWith('.css'),
  );
  const javascriptAssets = resources.filter((path) => path.endsWith('.js')).length;
  const stylesheetAssets = resources.filter((path) => path.endsWith('.css')).length;
  assertCondition(javascriptAssets >= 1, 'No deployed JavaScript asset loaded.');
  assertCondition(stylesheetAssets >= 1, 'No deployed stylesheet asset loaded.');

  const desktopNavigation = desktop.page.locator('.desktop-navigation');
  for (const item of [
    { label: 'About', id: 'about' },
    { label: 'Skills / Tech Superpowers', id: 'skills' },
    { label: 'Projects / Achievements', id: 'projects' },
  ]) {
    await desktopNavigation.getByRole('link', { name: item.label }).click();
    await desktop.page.locator(`#${item.id}`).waitFor();
    const activeId = await desktop.page.locator(':focus').getAttribute('id');
    assertCondition(activeId === item.id, `Navigation did not focus ${item.id}.`);
  }

  const aboutJourney = desktop.page.locator('.journey').filter({
    has: desktop.page.locator('#about-journey-title'),
  });
  for (const label of ['Teaching', 'Cloud', 'AI']) {
    const control = aboutJourney.getByRole('button', {
      name: new RegExp(`^${label}`),
    });
    await control.click();
    assertCondition(
      (await control.getAttribute('aria-pressed')) === 'true',
      `Journey stage ${label} did not become active.`,
    );
    await aboutJourney.getByText(`Active stage: ${label}`).waitFor();
  }

  const commandInput = desktop.page.getByRole('textbox', { name: 'Command' });
  const commandButton = desktop.page.getByRole('button', { name: 'Run command' });
  const commandOutput = desktop.page.getByTestId('command-output');

  await commandInput.fill('help');
  await commandButton.click();
  assertCondition(
    (await commandOutput.locator('code').count()) === 5,
    'Help did not list all five commands.',
  );

  await commandInput.fill('journey');
  await commandButton.click();
  assertCondition(
    (await commandOutput.locator('.journey').count()) === 1,
    'Journey command did not reveal the journey controls.',
  );

  await commandInput.fill('skills');
  await commandButton.click();
  assertCondition(
    desktop.page.url().endsWith('#skills'),
    'Skills command did not navigate locally.',
  );

  await commandInput.fill('projects');
  await commandButton.click();
  assertCondition(
    desktop.page.url().endsWith('#projects'),
    'Projects command did not navigate locally.',
  );

  await commandInput.fill('superpower');
  await commandButton.click();
  await commandOutput.getByText(/My superpower is making complex ideas understandable/).waitFor();

  const certificationCards = desktop.page.locator('.certification-card');
  assertCondition(
    (await certificationCards.count()) === 10,
    'Deployment did not render ten certification records.',
  );
  assertCondition(
    (await certificationCards.getByRole('link').count()) === 2,
    'Deployment exposed an unexpected certification link count.',
  );
  await certificationCards.filter({
    has: desktop.page.getByRole('heading', {
      name: 'Certified Kubernetes Administrator (CKA)',
    }),
  }).getByText('Expired', { exact: true }).waitFor();
  await certificationCards.filter({
    has: desktop.page.getByRole('heading', {
      name: 'AWS AI Practitioner Challenge',
    }),
  }).getByText(/not the AWS Certified AI Practitioner certification/).waitFor();

  const desktopAxe = await new AxeBuilder({ page: desktop.page }).analyze();
  const desktopAxeViolations = desktopAxe.violations.length;
  assertCondition(
    desktopAxeViolations === 0,
    `Desktop axe violations: ${desktopAxe.violations.map(({ id }) => id).join(', ')}`,
  );
  await desktop.context.close();

  const mobile = await createGuardedPage(375, 812);
  await openDeployment(mobile.page);
  const toggle = mobile.page.getByRole('button', {
    name: 'Open primary navigation',
  });
  await toggle.click();
  const mobilePanel = mobile.page.locator('#mobile-navigation-panel');
  assertCondition(
    (await mobilePanel.getByRole('link').count()) === 3,
    'Mobile navigation did not expose all section links.',
  );

  const mobileAxe = await new AxeBuilder({ page: mobile.page }).analyze();
  const mobileAxeViolations = mobileAxe.violations.length;
  assertCondition(
    mobileAxeViolations === 0,
    `Mobile axe violations: ${mobileAxe.violations.map(({ id }) => id).join(', ')}`,
  );

  await mobile.page.keyboard.press('Escape');
  assertCondition(
    (await mobile.page.locator(':focus').getAttribute('aria-controls')) ===
      'mobile-navigation-panel',
    'Escape did not restore mobile toggle focus.',
  );
  await toggle.click();
  await mobilePanel.getByRole('link', { name: 'Projects / Achievements' }).click();
  assertCondition(
    (await mobile.page.locator(':focus').getAttribute('id')) === 'projects',
    'Mobile project navigation did not focus the target heading.',
  );

  const mobileWidths: {
    readonly clientWidth: number;
    readonly scrollWidth: number;
  } = await mobile.page.evaluate(
    '({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })',
  );
  assertCondition(
    mobileWidths.scrollWidth <= mobileWidths.clientWidth,
    'Mobile deployment has horizontal page overflow.',
  );
  await mobile.context.close();

  assertCondition(
    failedSameOriginResponses.length === 0,
    `Failed deployed assets: ${failedSameOriginResponses.join(', ')}`,
  );
  assertCondition(
    blockedExternalRequests.length === 0,
    `Unexpected external requests: ${blockedExternalRequests.join(', ')}`,
  );

  console.log(JSON.stringify({
    url: deploymentUrl.href,
    documentStatus,
    javascriptAssets,
    stylesheetAssets,
    loadedAssets,
    desktopNavigation: 'passed',
    mobileNavigation: 'passed',
    journeyStages: 'Teaching, Cloud, AI passed',
    commandExplorer: 'five commands passed',
    certificationCards: 10,
    certificationLinks: 2,
    desktopAxeViolations,
    mobileAxeViolations,
    blockedExternalRequests: blockedExternalRequests.length,
    failedSameOriginResponses: failedSameOriginResponses.length,
  }, null, 2));
} finally {
  await browser.close();
}
