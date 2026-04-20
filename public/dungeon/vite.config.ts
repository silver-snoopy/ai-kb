import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      // Force tests to consume Phaser's pre-bundled ESM dist instead of the CJS
      // src entry, which pulls the optional phaser3spectorjs dev dep.
      phaser: resolve(__dirname, 'node_modules/phaser/dist/phaser.js'),
    },
  },
});
