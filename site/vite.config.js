import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { receipts } from './src/receipts.mjs';
// The lab reads ../tests, ../README.md and ../docs at build time, so every number on the page is generated, never typed.
// It is served at /PRISM/lab/, beside the marketing site (/PRISM/) and the app (/PRISM/app/), all assembled by deploy.yml.
export default defineConfig({
  base: '/PRISM/lab/',
  plugins: [react()],
  define: { __RECEIPTS__: JSON.stringify(receipts()) },
  server: { fs: { allow: ['..'] } },
});
