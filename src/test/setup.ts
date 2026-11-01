// Shared setup for every Vitest unit, property, and component test.
import { cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { afterEach, vi } from 'vitest';

// Every property-based test explores at least 100 generated cases. On failure
// fast-check reports the shrunk counterexample with its seed and path for replay.
fc.configureGlobal({ numRuns: 100 });

// Unmount rendered React trees so DOM state never leaks between tests.
afterEach(() => {
  cleanup();
});

// Tests are local-only. Any attempt to open a network connection fails loudly
// instead of reaching an external service or AWS.
const networkBlockedMessage = 'Network access is blocked: tests must not make network or AWS requests.';

const blockedNetworkApis = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'] as const;

for (const api of blockedNetworkApis) {
  // A regular function throws on both a call and a `new` construction.
  vi.stubGlobal(api, function blockedNetworkApi(): never {
    throw new Error(`${api}: ${networkBlockedMessage}`);
  });
}
// jsdom does not implement layout scrolling. Keep navigation tests local while
// preserving the same method shape used by real browsers.
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: function scrollIntoView(): void {
    // Layout behavior is verified by Playwright against the built site.
  },
});