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
    {
      name: 'clear',
      params: [],
      body: (_p, _self) => `_sb.clearDrawing()`,
    },
    {
      name: 'drawImageStrip',
      params: ['imageName', 'srcX', 'destX', 'destY', 'destWidth', 'destHeight', 'tint', 'srcVTop', 'srcVBot'],
      body: (p, _self) =>
        `_sb.drawImageStrip(${p.imageName}, ${p.srcX}, ${p.destX}, ${p.destY}, ${p.destWidth}, ${p.destHeight}, ${p.tint}, ${p.srcVTop}, ${p.srcVBot})`,
    },
    {
      name: 'drawFloorStrip',
      params: ['imageName', 'destX', 'yNear', 'yFar', 'wNearX', 'wNearY', 'wFarX', 'wFarY', 'stripW', 'tint'],
      body: (p, _self) =>
        `_sb.drawFloorStrip(${p.imageName}, ${p.destX}, ${p.yNear}, ${p.yFar}, ${p.wNearX}, ${p.wNearY}, ${p.wFarX}, ${p.wFarY}, ${p.stripW}, ${p.tint})`,
    },
    {
      name: 'drawVGradientRect',
      params: ['x', 'y', 'width', 'height', 'topR', 'topG', 'topB', 'botR', 'botG', 'botB'],
      body: (p, _self) =>
        `_sb.drawVGradientRect(${p.x}, ${p.y}, ${p.width}, ${p.height}, ${p.topR}, ${p.topG}, ${p.topB}, ${p.botR}, ${p.botG}, ${p.botB})`,
    },
  ],
};
