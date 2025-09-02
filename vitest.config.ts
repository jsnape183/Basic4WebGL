import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: [
      {
        find: '@CompilerLib/*',
        replacement: fileURLToPath(
          new URL('./src/lib/CompilerLib/', import.meta.url)
        ),
      },
      {
        find: '@Basic4WebGL',
        replacement: resolve(__dirname, './src/lib/Basic4WebGL/'),
      },
    ],
  },
  test: {
    globals: true,
    // Two test projects that run together
    projects: [
      {
        test: {
          name: 'compiler',
          environment: 'node',
          include: ['**/CompilerLib/**/*.{test,spec}.ts'],
          exclude: ['**/*.{test,spec}.tsx', '**/*.dom.{test,spec}.ts'],
          //setupFiles: ['./vitest.setup.node.ts'], // optional
        },
      },
      {
        test: {
          name: 'basic4webgl',
          environment: 'node',
          include: ['**/Basic4WebGL/**/*.{test,spec}.ts'],
          exclude: ['**/*.{test,spec}.tsx', '**/*.dom.{test,spec}.ts'],
          //setupFiles: ['./vitest.setup.node.ts'], // optional
        },
      },
      // React/DOM tests
      {
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['**/*.{test,spec}.tsx', '**/*.dom.{test,spec}.ts'],
          setupFiles: ['./vitest.setup.dom.ts'], // can import @testing-library/jest-dom here
        },
      },
    ],
  },
});
