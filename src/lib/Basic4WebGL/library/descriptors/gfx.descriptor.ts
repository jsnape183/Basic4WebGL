import { ModuleDescriptor } from '../generator/types';

export const gfxDescriptor: ModuleDescriptor = {
  name: 'gfx',
  functions: [
    {
      name: 'boxCollide',
      params: ['a', 'b'],
      returns: (p, _self) => `_sb.spriteCollide(${p.a}, ${p.b})`,
    },
  ],
};
