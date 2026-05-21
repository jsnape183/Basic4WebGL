import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@CompilerLib': resolve(__dirname, './src/lib/CompilerLib'),
      '@Basic4WebGL': resolve(__dirname, './src/lib/Basic4WebGL'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/ui/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**'],
      exclude: ['src/lib/**/*.d.ts'],
    },
  },
});
