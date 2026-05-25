import { describe, test, expect } from 'vitest';
import { getFullName } from '../../../src/selectors/getFullName';
import { IFolder } from '../../../src/features/folders/foldersSlice';

const folders: IFolder[] = [
  { id: 'f1', name: 'Game', projectId: 'p1', parentId: null },
  { id: 'f2', name: 'Enemies', projectId: 'p1', parentId: 'f1' },
  { id: 'f3', name: 'Bosses', projectId: 'p1', parentId: 'f2' },
];

describe('getFullName', () => {
  test('root item — no folderId — returns just name', () => {
    expect(getFullName('Main.bas', null, folders)).toBe('Main.bas');
  });

  test('single folder level', () => {
    expect(getFullName('Player.bas', 'f1', folders)).toBe('Game/Player.bas');
  });

  test('two levels deep', () => {
    expect(getFullName('Goblin.bas', 'f2', folders)).toBe('Game/Enemies/Goblin.bas');
  });

  test('three levels deep', () => {
    expect(getFullName('FinalBoss.bas', 'f3', folders)).toBe('Game/Enemies/Bosses/FinalBoss.bas');
  });

  test('unknown folderId — treats as root', () => {
    expect(getFullName('Main.bas', 'missing', folders)).toBe('Main.bas');
  });

  test('empty folder list — treats as root', () => {
    expect(getFullName('Main.bas', 'f1', [])).toBe('Main.bas');
  });
});
