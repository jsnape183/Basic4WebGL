import { describe, test, expect } from 'vitest';
import foldersReducer, {
  IFolder,
  IFoldersState,
  addFolder,
  removeFolder,
  renameFolder,
  moveFolder,
} from '../../../../src/features/folders/foldersSlice';

const initial: IFoldersState = { items: [] };

const f1: IFolder = { id: 'f1', name: 'Game', projectId: 'p1', parentId: null };
const f2: IFolder = { id: 'f2', name: 'Enemies', projectId: 'p1', parentId: 'f1' };
const f3: IFolder = { id: 'f3', name: 'Bosses', projectId: 'p1', parentId: 'f2' };

describe('addFolder', () => {
  test('stores the folder', () => {
    const state = foldersReducer(initial, addFolder(f1));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(f1);
  });
});

describe('removeFolder', () => {
  test('removes the folder', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, removeFolder('f1'));
    expect(s.items).toHaveLength(0);
  });

  test('re-parents direct children to the removed folder\'s parent', () => {
    // f1 (root) → f2 → f3
    // Remove f2 → f3 should become a direct child of f1
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f2));
    s = foldersReducer(s, addFolder(f3));
    s = foldersReducer(s, removeFolder('f2'));
    expect(s.items.find((f) => f.id === 'f2')).toBeUndefined();
    expect(s.items.find((f) => f.id === 'f3')?.parentId).toBe('f1');
  });

  test('re-parents children of a root folder to null', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f2));
    s = foldersReducer(s, removeFolder('f1'));
    expect(s.items.find((f) => f.id === 'f2')?.parentId).toBeNull();
  });
});

describe('renameFolder', () => {
  test('updates folder name', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, renameFolder({ folderId: 'f1', name: 'Logic' }));
    expect(s.items[0].name).toBe('Logic');
  });

  test('no-ops for unknown folderId', () => {
    const s = foldersReducer(initial, renameFolder({ folderId: 'nope', name: 'X' }));
    expect(s.items).toHaveLength(0);
  });
});

describe('moveFolder', () => {
  test('updates parentId', () => {
    const f4: IFolder = { id: 'f4', name: 'UI', projectId: 'p1', parentId: null };
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f4));
    s = foldersReducer(s, moveFolder({ folderId: 'f4', parentId: 'f1' }));
    expect(s.items.find((f) => f.id === 'f4')?.parentId).toBe('f1');
  });

  test('can move to root (null)', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f2));
    s = foldersReducer(s, moveFolder({ folderId: 'f2', parentId: null }));
    expect(s.items.find((f) => f.id === 'f2')?.parentId).toBeNull();
  });
});
