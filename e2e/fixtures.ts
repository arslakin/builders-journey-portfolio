import { expect, test as base } from '@playwright/test';

// Shared browser-test fixtures. Import `test` and `expect` from this module
// instead of `@playwright/test` so every browser test gets the guards below.
export const test = base.extend<{ externalRequestGuard: undefined }>({
  // Allows only same-origin requests to the local preview server. Any other
  // request is aborted and fails the test, so browser tests never reach an
  // external service or AWS. Only origin and path are reported, never queries.
  externalRequestGuard: [
    async ({ context, baseURL }, use) => {
      if (baseURL === undefined) {
        throw new Error('Browser tests require the local preview baseURL from playwright.config.ts.');
      }

      const allowedOrigin = new URL(baseURL).origin;
      const blockedRequests: string[] = [];

      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());

        if (url.origin === allowedOrigin) {
          await route.continue();
          return;
        }

        blockedRequests.push(`${url.origin}${url.pathname}`);
        await route.abort('blockedbyclient');
      });

      await use(undefined);

      expect(blockedRequests, 'Requests outside the local preview server were blocked').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
