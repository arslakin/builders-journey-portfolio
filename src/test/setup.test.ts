import { describe, expect, it } from 'vitest';

const blockedMessage = /tests must not make network or AWS requests/;

describe('shared test setup', () => {
  it('blocks fetch so tests cannot reach a network service', () => {
    expect(() => fetch('https://example.invalid/')).toThrow(blockedMessage);
  });

  it('blocks XMLHttpRequest, WebSocket, and EventSource construction', () => {
    expect(() => new XMLHttpRequest()).toThrow(blockedMessage);
    expect(() => new WebSocket('wss://example.invalid/')).toThrow(blockedMessage);
    expect(() => new EventSource('https://example.invalid/')).toThrow(blockedMessage);
  });
});
