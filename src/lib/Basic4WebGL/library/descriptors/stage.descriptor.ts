import { ModuleDescriptor } from '../generator/types';

export const stageDescriptor: ModuleDescriptor = {
  name: 'stage',
  functions: [
    {
      name: 'add',
      params: ['obj'],
      body: (p, _self) => `_sb.addToStage(${p.obj})`,
    },
    {
      name: 'remove',
      params: ['obj'],
      body: (p, _self) => `_sb.removeFromStage(${p.obj})`,
    },
    {
      name: 'clear',
      params: [],
      body: (_p, _self) => `_sb.clear()`,
    },
  ],
};
