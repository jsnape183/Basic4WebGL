import compiler from '../src/lib/Basic4WebGL/index';
import { packageModules } from '../src/constants/packageModules';
import { firstPartyPackages } from '../src/constants/firstPartyPackages';
import { sortByDependencies } from '../src/lib/Basic4WebGL/sortByDependencies';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const softcore = firstPartyPackages.find((p) => p.id === 'softcore');
const softgfx = firstPartyPackages.find((p) => p.id === 'softgfx');
const lib = [...softcore.moduleNames, ...softgfx.moduleNames].map((name) => ({ name, source: packageModules[name] || '' }));
const dir = 'demo-src/bullet-hell-shooter';
const files = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.bas')).map((e) => ({ name: e.name, source: readFileSync(join(dir, e.name), 'utf-8') }));
const { files: sorted } = sortByDependencies(files);
const result = compiler.transpile({ lib, files: sorted });
console.log('diagnostics:', result.diagnostics ? result.diagnostics.length : 0);
writeFileSync('/tmp/bhs_check_output.js', result.code, 'utf-8');
