import type { ClassDescriptor, ModuleDescriptor } from './generator/types';
import { spriteDescriptor } from './descriptors/sprite.descriptor';
import { textDescriptor } from './descriptors/text.descriptor';
import { transformDescriptor } from './descriptors/transform.descriptor';
import { stageDescriptor } from './descriptors/stage.descriptor';
import { gfxDescriptor } from './descriptors/gfx.descriptor';
import { drawingDescriptor } from './descriptors/drawing.descriptor';
import { penDescriptor } from './descriptors/pen.descriptor';
import { assetmanagerDescriptor } from './descriptors/assetmanager.descriptor';
import { fileDescriptor } from './descriptors/file.descriptor';
import { saveDescriptor } from './descriptors/save.descriptor';

// fileName defaults to descriptor.name, overridden where the .bas file's name
// on disk doesn't match the softBASIC class name it declares (e.g. the
// `ObjectTransform` class lives in `transform.bas`).
// This is the single source of truth for which descriptors are generated and
// where — both scripts/generateLibrary.ts and the generatedDefsInSync test
// import from here, so they can't drift apart from each other.
export const classDescriptors: Array<{ descriptor: ClassDescriptor; fileName?: string }> = [
  { descriptor: spriteDescriptor },
  { descriptor: textDescriptor },
  { descriptor: transformDescriptor, fileName: 'transform' },
];

export const moduleDescriptors: ModuleDescriptor[] = [
  stageDescriptor,
  gfxDescriptor,
  drawingDescriptor,
  penDescriptor,
  assetmanagerDescriptor,
  fileDescriptor,
  saveDescriptor,
];
