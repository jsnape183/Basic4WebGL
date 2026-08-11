import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import compiler from '../../src/lib/Basic4WebGL/index';
import { packageModules } from '../../src/constants/packageModules';
import { firstPartyPackages } from '../../src/constants/firstPartyPackages';
import { sortByDependencies } from '../../src/lib/Basic4WebGL/sortByDependencies';

const [, , sourceDir] = process.argv;

if (!sourceDir) {
  console.error('Usage: npm run check:demo -- <source-dir>');
  process.exit(1);
}

const files = readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.bas'))
  .map((entry) => ({
    name: entry.name,
    source: readFileSync(join(sourceDir, entry.name), 'utf-8'),
  }));

if (files.length === 0) {
  console.error(`No .bas files found directly in ${sourceDir}`);
  process.exit(1);
}

const DEFAULT_PACKAGE_IDS = ['softcore', 'softgfx'];
const lib = DEFAULT_PACKAGE_IDS.flatMap((pkgId) => {
  const pkg = firstPartyPackages.find((p) => p.id === pkgId);
  if (!pkg) return [];
  return pkg.moduleNames.map((name) => ({ name, source: packageModules[name] ?? '' }));
});

const { files: sorted, error: sortError } = sortByDependencies(files);
if (sortError) {
  console.error(`Dependency error: ${sortError}`);
  process.exit(1);
}

const result = compiler.transpile({ lib, files: sorted });
if (result.diagnostics && result.diagnostics.length > 0) {
  console.error(`${result.diagnostics.length} diagnostic(s):`);
  for (const d of result.diagnostics) {
    const loc = d.loc ? `${d.loc.filename}:${d.loc.line}:${d.loc.col}` : '(unknown location)';
    console.error(`  ${loc} — ${d.message}`);
  }
  process.exit(1);
}

console.log(`OK — ${files.length} file(s) compiled with zero diagnostics.`);
