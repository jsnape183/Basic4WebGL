import { IPackage } from '../features/packages/packagesSlice';

export const firstPartyPackages: IPackage[] = [
  {
    id: 'softcore',
    name: 'softCore',
    version: '1.0.0',
    isCore: true,
    isFirstParty: true,
    moduleNames: ['math', 'string', 'array'],
  },
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '1.0.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'drawing', 'stage', 'pen', 'text', 'transform', 'assetmanager', 'spritemanager'],
  },
];
