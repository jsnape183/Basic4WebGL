import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compilerPath = resolve(__dirname, 'src/lib/Basic4WebGL/index.ts');
console.log('Trying to import:', compilerPath);

const compiler = await import('./src/lib/Basic4WebGL/index.ts?t=' + Date.now());
