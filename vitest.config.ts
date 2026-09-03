import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const server = fileURLToPath(new URL('./server', import.meta.url));
const catalog = fileURLToPath(new URL('./packages/antd-catalog/src', import.meta.url));

const alias = {
  '@src': src,
  '@server': server,
  '@catalog': catalog,
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    clearMocks: true,
    restoreMocks: true,
    exclude: ['**/node_modules/**', '**/submodules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'packages/antd-catalog/src/**/*.{ts,tsx}'],
      exclude: ['src/index.tsx', 'src/env.d.ts'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'snapshot',
          include: ['tests/snapshot/**/*.test.{ts,tsx}'],
          environment: 'happy-dom',
          setupFiles: ['tests/setup/dom.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.{ts,tsx}'],
          environment: 'happy-dom',
          setupFiles: ['tests/setup/e2e.tsx'],
          testTimeout: 20_000,
        },
      },
    ],
  },
});
