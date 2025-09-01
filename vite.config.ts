import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@CompilerLib': resolve(__dirname, 'src/lib/CompilerLib'),
      '@Basic4WebGL': resolve(__dirname, 'src/lib/Basic4WebGL'),
    },
  },
});
