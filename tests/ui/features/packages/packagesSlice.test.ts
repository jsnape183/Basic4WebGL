import { configureStore } from '@reduxjs/toolkit';
import packagesReducer, {
  IPackage,
  IPackagesState,
  seedPackages,
} from '../../../../src/features/packages/packagesSlice';

const pkg1: IPackage = {
  id: 'softcore',
  name: 'softCore',
  version: '1.0.0',
  isCore: true,
  isFirstParty: true,
  moduleNames: ['math', 'string', 'array'],
};

const pkg1v2: IPackage = { ...pkg1, version: '2.0.0', moduleNames: ['math', 'string', 'array', 'extra'] };

const initial: IPackagesState = { byId: {} };

test('initial state is empty', () => {
  const state = packagesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {} });
});

test('seedPackages inserts a package not yet in the store', () => {
  const state = packagesReducer(initial, seedPackages([pkg1]));
  expect(state.byId['softcore']).toEqual(pkg1);
});

test('seedPackages is a no-op when package exists with the same version', () => {
  const withPkg = packagesReducer(initial, seedPackages([pkg1]));
  const again = packagesReducer(withPkg, seedPackages([pkg1]));
  expect(again.byId['softcore']).toEqual(pkg1);
});

test('seedPackages overwrites when version has changed', () => {
  const withPkg = packagesReducer(initial, seedPackages([pkg1]));
  const updated = packagesReducer(withPkg, seedPackages([pkg1v2]));
  expect(updated.byId['softcore'].moduleNames).toContain('extra');
  expect(updated.byId['softcore'].version).toBe('2.0.0');
});

test('seedPackages inserts multiple packages in one call', () => {
  const pkg2: IPackage = {
    id: 'softgfx',
    name: 'softGfx',
    version: '1.0.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx'],
  };
  const state = packagesReducer(initial, seedPackages([pkg1, pkg2]));
  expect(Object.keys(state.byId)).toHaveLength(2);
});
