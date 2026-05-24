import { ModuleDescriptor } from '../generator/types';

export const assetmanagerDescriptor: ModuleDescriptor = {
  name: 'assetmanager',
  functions: [
    {
      name: 'loadImage',
      params: ['name'],
      returns: (p, _self) => `_sb.get(${p.name})`,
    },
  ],
};
