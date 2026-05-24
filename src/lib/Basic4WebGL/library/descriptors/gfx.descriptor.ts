import { ModuleDescriptor } from '../generator/types';

export const gfxDescriptor: ModuleDescriptor = {
  name: 'gfx',
  functions: [
    {
      name: 'boxCollide',
      params: ['a', 'b'],
      returns: (p, _self) => `_sb.boxCollide(${p.a}, ${p.b})`,
    },
    {
      name: 'getKeyDown',
      params: ['keycode'],
      returns: (p, _self) => `_sb.getKeyDown(${p.keycode})`,
    },
  ],
};
