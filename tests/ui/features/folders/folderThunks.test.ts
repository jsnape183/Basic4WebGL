// tests/ui/features/folders/folderThunks.test.ts
import { describe, test, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import foldersReducer, { addFolder, IFolder } from '../../../../src/features/folders/foldersSlice';
import filesReducer, { addFile } from '../../../../src/features/files/filesSlice';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import {
  renameFolderWithCascade,
  moveFolderWithCascade,
  removeFolderWithCascade,
} from '../../../../src/features/folders/folderThunks';

function makeStore() {
  return configureStore({
    reducer: {
      folders: foldersReducer,
      files: filesReducer,
      assets: assetsReducer,
    },
  });
}

// Folder tree: root → f1 (Game) → f2 (Enemies)
const f1: IFolder = { id: 'f1', name: 'Game', projectId: 'p1', parentId: null };
const f2: IFolder = { id: 'f2', name: 'Enemies', projectId: 'p1', parentId: 'f1' };

describe('renameFolderWithCascade', () => {
  test('updates fullName of files inside the renamed folder', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addFile({ id: 'file1', name: 'Player.bas', source: '', projectId: 'p1', folderId: 'f1', fullName: 'Game/Player.bas' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Logic' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Logic/Player.bas');
  });

  test('updates fullName of files in nested folders', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addFolder(f2));
    store.dispatch(addFile({ id: 'file1', name: 'Goblin.bas', source: '', projectId: 'p1', folderId: 'f2', fullName: 'Game/Enemies/Goblin.bas' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Logic' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Logic/Enemies/Goblin.bas');
  });

  test('updates fullName of assets inside the renamed folder', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addAsset({ id: 'a1', name: 'hero.png', content: '', projectId: 'p1', folderId: 'f1', fullName: 'Game/hero.png' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Sprites' }));
    expect(store.getState().assets.byId['a1'].fullName).toBe('Sprites/hero.png');
  });

  test('does not affect files in other folders', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addFile({ id: 'file1', name: 'Utils.bas', source: '', projectId: 'p1', folderId: null, fullName: 'Utils.bas' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Logic' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Utils.bas');
  });
});

describe('moveFolderWithCascade', () => {
  test('updates fullName of files after folder is moved under a new parent', () => {
    const store = makeStore();
    const fA: IFolder = { id: 'fA', name: 'Assets', projectId: 'p1', parentId: null };
    const fB: IFolder = { id: 'fB', name: 'Sprites', projectId: 'p1', parentId: null };
    store.dispatch(addFolder(fA));
    store.dispatch(addFolder(fB));
    store.dispatch(addFile({ id: 'file1', name: 'hero.png', source: '', projectId: 'p1', folderId: 'fB', fullName: 'Sprites/hero.png' }));
    // Move fB under fA
    store.dispatch(moveFolderWithCascade({ folderId: 'fB', parentId: 'fA' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Assets/Sprites/hero.png');
  });
});

describe('removeFolderWithCascade', () => {
  test('moves items in deleted folder to its parent folder', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1)); // root
    store.dispatch(addFolder(f2)); // f2 is child of f1
    store.dispatch(addFile({ id: 'file1', name: 'Goblin.bas', source: '', projectId: 'p1', folderId: 'f2', fullName: 'Game/Enemies/Goblin.bas' }));
    // Remove f2 — file should move to f1
    store.dispatch(removeFolderWithCascade({ folderId: 'f2' }));
    const file = store.getState().files.byId['file1'];
    expect(file.folderId).toBe('f1');
    expect(file.fullName).toBe('Game/Goblin.bas');
  });

  test('moves items in deleted root folder to null (root)', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addAsset({ id: 'a1', name: 'hero.png', content: '', projectId: 'p1', folderId: 'f1', fullName: 'Game/hero.png' }));
    store.dispatch(removeFolderWithCascade({ folderId: 'f1' }));
    const asset = store.getState().assets.byId['a1'];
    expect(asset.folderId).toBeNull();
    expect(asset.fullName).toBe('hero.png');
  });

  test('removes the folder from the store', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(removeFolderWithCascade({ folderId: 'f1' }));
    expect(store.getState().folders.items).toHaveLength(0);
  });
});
