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
    {
      name: 'width',
      params: [],
      returns: (_p, _self) => `_sb.getStageWidth()`,
    },
    {
      name: 'height',
      params: [],
      returns: (_p, _self) => `_sb.getStageHeight()`,
    },
    {
      name: 'setBackground',
      params: ['r', 'g', 'b'],
      body: (p, _self) => `_sb.setBackground(${p.r}, ${p.g}, ${p.b})`,
    },
  ],
};
