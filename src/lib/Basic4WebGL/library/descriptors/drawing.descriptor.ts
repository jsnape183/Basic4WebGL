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
    {
      name: 'registerLightmap',
      params: ['id', 'width', 'height', 'worldCols', 'worldRows', 'bytes'],
      body: (p, _self) =>
        `_sb.registerLightmap(${p.id}, ${p.width}, ${p.height}, ${p.worldCols}, ${p.worldRows}, ${p.bytes})`,
    },
    {
      name: 'registerFieldTiles',
      params: ['atlasId', 'cols', 'rows', 'cellNames', 'cellColors', 'cellHeights'],
      body: (p, _self) =>
        `_sb.registerFieldTiles(${p.atlasId}, ${p.cols}, ${p.rows}, ${p.cellNames}, ${p.cellColors}, ${p.cellHeights})`,
    },
    {
      name: 'drawPlaneField',
      params: [
        'fieldId', 'texName', 'tilesId', 'planeZ', 'camX', 'camY', 'camZ', 'dirX', 'dirY', 'planeX', 'planeY',
        'pitch', 'viewW', 'viewH', 'scy', 'eyeZ', 'lightmapId', 'ambient', 'baseR', 'baseG', 'baseB',
      ],
      body: (p, _self) =>
        `_sb.drawPlaneField(${p.fieldId}, ${p.texName}, ${p.tilesId}, ${p.planeZ}, ${p.camX}, ${p.camY}, ${p.camZ}, ${p.dirX}, ${p.dirY}, ${p.planeX}, ${p.planeY}, ${p.pitch}, ${p.viewW}, ${p.viewH}, ${p.scy}, ${p.eyeZ}, ${p.lightmapId}, ${p.ambient}, ${p.baseR}, ${p.baseG}, ${p.baseB})`,
    },
    {
      name: 'drawRadialGradientCircle',
      params: ['x', 'y', 'radius', 'r', 'g', 'b', 'alpha'],
      body: (p, _self) =>
        `_sb.drawRadialGradientCircle(${p.x}, ${p.y}, ${p.radius}, ${p.r}, ${p.g}, ${p.b}, ${p.alpha})`,
    },
    {
      name: 'drawRadialGradientEllipse',
      params: ['x', 'y', 'radiusX', 'radiusY', 'r', 'g', 'b', 'alpha'],
      body: (p, _self) =>
        `_sb.drawRadialGradientEllipse(${p.x}, ${p.y}, ${p.radiusX}, ${p.radiusY}, ${p.r}, ${p.g}, ${p.b}, ${p.alpha})`,
    },
  ],
};
