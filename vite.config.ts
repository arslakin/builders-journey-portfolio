import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The production build emits the complete client-side application as static
// files in one output directory. No custom application server is involved.
//
// Mode selection is not a security boundary. Development (`npm run dev`) and
// the local preview of the reviewed production build (`npm run preview`) bind
// to localhost only. Vite loads `.env.[mode]` files for the selected mode
// only, so development never reads production values. The application
// currently requires no environment variable, and any `VITE_*` value would be
// public in the browser bundle, so no secret may use that prefix.
export default defineConfig({
  base: '/',
  plugins: [react()],
  envPrefix: 'VITE_',
  server: {
    host: 'localhost',
  },
  preview: {
    host: 'localhost',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
