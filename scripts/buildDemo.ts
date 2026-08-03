import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { packageDemo, RawAsset, RawBasFile } from './demoBuilder/packageDemo';

const [, , sourceDir, slug] = process.argv;

if (!sourceDir || !slug) {
  console.error('Usage: npm run build:demo -- <source-dir> <SlugName>');
  process.exit(1);
}

const basFiles: RawBasFile[] = readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.bas'))
  .map((entry) => ({
    name: entry.name,
    source: readFileSync(join(sourceDir, entry.name), 'utf-8'),
  }));

if (basFiles.length === 0) {
  console.error(`No .bas files found directly in ${sourceDir}`);
  process.exit(1);
}

const assetsDir = join(sourceDir, 'assets');
const assets: RawAsset[] = existsSync(assetsDir)
  ? readdirSync(assetsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => ({
        name: entry.name,
        bytes: readFileSync(join(assetsDir, entry.name)),
      }))
  : [];

const json = packageDemo(slug, basFiles, assets);

const OUT_DIR = 'src/docs/demos';
const outPath = join(OUT_DIR, `${slug}.b4wgl.json`);
writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf-8');
console.log(`Wrote ${outPath} (${basFiles.length} file(s), ${assets.length} asset(s))`);
