import { IPackage } from '../features/packages/packagesSlice';

export const firstPartyPackages: IPackage[] = [
  {
    id: 'softcore',
    name: 'softCore',
    version: '1.1.0',
    isCore: true,
    isFirstParty: true,
    moduleNames: ['math', 'string', 'array', 'dict', 'file', 'save'],
  },
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '2.8.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'tilemaplayer', 'tilemapset', 'audio', 'collision', 'pathfinding', 'marker', 'rayhit', 'scene', 'scenemanager', 'camera', 'world', 'hud', 'Keyframe', 'tween', 'Emitter', 'keyboard', 'controller'],
  },
];
