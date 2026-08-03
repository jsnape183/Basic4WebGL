import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateClass, generateModule } from '../src/lib/Basic4WebGL/library/generator/index';
import { classDescriptors, moduleDescriptors } from '../src/lib/Basic4WebGL/library/registry';

const OUT_DIR = 'src/lib/Basic4WebGL/defs';

for (const { descriptor, fileName } of classDescriptors) {
  const content = generateClass(descriptor);
  const name = fileName ?? descriptor.name;
  writeFileSync(join(OUT_DIR, `${name}.bas`), content, 'utf-8');
  console.log(`Generated ${name}.bas`);
}

for (const d of moduleDescriptors) {
  const content = generateModule(d);
  writeFileSync(join(OUT_DIR, `${d.name}.bas`), content, 'utf-8');
  console.log(`Generated ${d.name}.bas`);
}

console.log('Done.');
