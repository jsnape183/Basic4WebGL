import { ModuleDescriptor } from '../generator/types';

export const penDescriptor: ModuleDescriptor = {
  name: 'pen',
  functions: [
    {
      name: 'setFillColor',
      params: ['r', 'g', 'b'],
      body: (p, _self) => `_sb.setFillColor(${p.r}, ${p.g}, ${p.b})`,
    },
    {
      name: 'setLineColor',
      params: ['r', 'g', 'b'],
      body: (p, _self) => `_sb.setLineColor(${p.r}, ${p.g}, ${p.b})`,
    },
  ],
};
