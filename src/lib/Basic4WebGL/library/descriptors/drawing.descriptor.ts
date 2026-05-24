import { ModuleDescriptor } from '../generator/types';

export const drawingDescriptor: ModuleDescriptor = {
  name: 'drawing',
  functions: [
    {
      name: 'drawLine',
      params: ['x', 'y', 'x2', 'y2'],
      body: (p, _self) => `_sb.drawLine(${p.x}, ${p.y}, ${p.x2}, ${p.y2})`,
    },
    {
      name: 'drawRect',
      params: ['x', 'y', 'width', 'height'],
      body: (p, _self) => `_sb.drawRect(${p.x}, ${p.y}, ${p.width}, ${p.height})`,
    },
    {
      name: 'drawCircle',
      params: ['x', 'y', 'radius'],
      body: (p, _self) => `_sb.drawCircle(${p.x}, ${p.y}, ${p.radius})`,
    },
  ],
};
