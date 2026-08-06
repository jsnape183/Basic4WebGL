import { ModuleDescriptor } from '../generator/types';

export const assetmanagerDescriptor: ModuleDescriptor = {
  name: 'assetmanager',
  functions: [
    {
      name: 'loadImage',
      params: ['name'],
      returns: (p, _self) => `_sb.get(${p.name})`,
    },
    {
      name: 'defineRegion',
      params: ['newName', 'sourceName', 'x', 'y', 'width', 'height'],
      body: (p, _self) =>
        `_sb.defineRegion(${p.newName}, ${p.sourceName}, ${p.x}, ${p.y}, ${p.width}, ${p.height})`,
    },
  ],
};
