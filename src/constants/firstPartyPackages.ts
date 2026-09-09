import { IPackage } from '../features/packages/packagesSlice';

export const firstPartyPackages: IPackage[] = [
  {
    id: 'softcore',
    name: 'softCore',
    version: '1.2.0',
    isCore: true,
    isFirstParty: true,
    moduleNames: ['math', 'string', 'array', 'dict', 'file', 'save', 'time'],
  },
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '2.9.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'tilemaplayer', 'tilemapset', 'audio', 'collision', 'pathfinding', 'marker', 'rayhit', 'scene', 'scenemanager', 'camera', 'world', 'hud', 'Keyframe', 'tween', 'Emitter', 'keyboard', 'controller'],
  },
  {
    // First-person raycaster library (RcWorld/RcCast/RcRender/RcMover/RcLights/
    // RcActors). Opt-in — a 2D game shouldn't carry it. Needs softGfx (drawing,
    // tilemapset, input, scene). Module order is a real dependency order: lib
    // files are parsed in this sequence and typed fields need their target
    // module declared first.
    id: 'softraycaster',
    name: 'softRaycaster',
    version: '1.0.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['rcconfig', 'rcsettings', 'rcworld', 'rccast', 'rcmover', 'rclights', 'rcactor', 'rcactors', 'rcrender'],
  },
];
