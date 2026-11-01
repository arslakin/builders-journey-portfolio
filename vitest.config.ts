import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Unit, property, and component tests. These run in Node with a jsdom
// document; real-browser checks against the built `dist/` output live in
// playwright.config.ts. This file is independent of vite.config.ts so test
// settings never change the production build.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    // A stray `.only` must never silently skip the rest of the suite.
    allowOnly: false,
    restoreMocks: true,
    unstubEnvs: true,
  },
});
