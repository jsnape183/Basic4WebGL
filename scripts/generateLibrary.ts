import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateClass, generateModule } from '../src/lib/Basic4WebGL/library/generator/index';
import type { ClassDescriptor, ModuleDescriptor } from '../src/lib/Basic4WebGL/library/generator/types';

// Descriptors are imported directly — add new ones here as the library grows
const classDescriptors: ClassDescriptor[] = [];
const moduleDescriptors: ModuleDescriptor[] = [];

const OUT_DIR = 'src/lib/Basic4WebGL/defs';

for (const d of classDescriptors) {
  const content = generateClass(d);
  writeFileSync(join(OUT_DIR, `${d.name}.bas`), content, 'utf-8');
  console.log(`Generated ${d.name}.bas`);
}

for (const d of moduleDescriptors) {
  const content = generateModule(d);
  writeFileSync(join(OUT_DIR, `${d.name}.bas`), content, 'utf-8');
  console.log(`Generated ${d.name}.bas`);
}

console.log('Done.');
