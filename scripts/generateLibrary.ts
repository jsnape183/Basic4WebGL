import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateClass, generateModule } from '../src/lib/Basic4WebGL/library/generator/index';
import type { ClassDescriptor, ModuleDescriptor } from '../src/lib/Basic4WebGL/library/generator/types';
import { spriteDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/sprite.descriptor';
import { textDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/text.descriptor';
import { stageDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/stage.descriptor';
import { gfxDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/gfx.descriptor';
import { drawingDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/drawing.descriptor';
import { penDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/pen.descriptor';
import { assetmanagerDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor';

const classDescriptors: ClassDescriptor[] = [
  spriteDescriptor,
  textDescriptor,
];

const moduleDescriptors: ModuleDescriptor[] = [
  stageDescriptor,
  gfxDescriptor,
  drawingDescriptor,
  penDescriptor,
  assetmanagerDescriptor,
];

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
