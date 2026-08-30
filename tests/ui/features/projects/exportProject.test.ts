import { describe, test, expect } from 'vitest';
import { buildExportJson } from '../../../../src/features/projects/exportProject';

const state = {
  projects: { items: [{ id: 'p1', name: 'My Game', packageIds: ['softcore'] }] },
  folders: {
    items: [
      { id: 'f1', name: 'Classes', projectId: 'p1', parentId: null, section: 'files' as const },
    ],
  },
  files: {
    byId: {
      file1: { id: 'file1', name: 'Main', source: 'print 1', projectId: 'p1', folderId: null, fullName: 'Main.bas' },
      file2: { id: 'file2', name: 'Player', source: 'class', projectId: 'p1', folderId: 'f1', fullName: 'Classes/Player.bas' },
      other: { id: 'other', name: 'Other', source: '', projectId: 'p99', folderId: null, fullName: 'Other.bas' },
    },
    fileOrder: {
      'p1:root': ['file1'],
      'p1:f1': ['file2'],
      'p99:root': ['other'],
    },
    dirtyFileIds: [],
  },
  assets: {
    byId: {
      a1: { id: 'a1', name: 'hero.png', projectId: 'p1', folderId: null, fullName: 'hero.png' },
    },
    assetOrder: { 'p1:root': ['a1'] },
  },
};

describe('buildExportJson', () => {
  test('version is 1', () => {
    expect(buildExportJson('p1', state).version).toBe(1);
  });

  test('project name is preserved', () => {
    expect(buildExportJson('p1', state).project.name).toBe('My Game');
  });

  test('only includes files for the exported project', () => {
    const json = buildExportJson('p1', state);
    expect(json.files).toHaveLength(2);
    expect(json.files.every((f) => f.id !== 'other')).toBe(true);
  });

  test('file entries do not include projectId', () => {
    const json = buildExportJson('p1', state);
    expect('projectId' in json.files[0]).toBe(false);
  });

  test('fileOrder keys have projectId prefix stripped', () => {
    const json = buildExportJson('p1', state);
    expect(Object.keys(json.fileOrder)).toContain(':root');
    expect(Object.keys(json.fileOrder)).toContain(':f1');
    expect(Object.keys(json.fileOrder).some((k) => k.includes('p1'))).toBe(false);
  });

  test('fileOrder keys do not include keys from other projects', () => {
    const json = buildExportJson('p1', state);
    expect(Object.keys(json.fileOrder)).toHaveLength(2);
  });

  test('asset content is preserved as-is', () => {
    const json = buildExportJson('p1', state);
    // updated in Task 8: buildExportJson becomes async and reads real bytes from
    // the blob store; for now the shim emits an empty string.
    expect(json.assets[0].content).toBe('');
  });

  test('folder entries do not include projectId', () => {
    const json = buildExportJson('p1', state);
    expect('projectId' in json.folders[0]).toBe(false);
  });

  test('throws if projectId is not found', () => {
    expect(() => buildExportJson('no-such', state)).toThrow();
  });
});
