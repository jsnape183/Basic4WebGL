import { describe, test, expect } from 'vitest';
import { packageDemo } from '../../../scripts/demoBuilder/packageDemo';

describe('packageDemo', () => {
  test('sorts .bas files alphabetically regardless of input order', () => {
    const result = packageDemo(
      'Test Demo',
      [
        { name: 'Zebra.bas', source: 'dummy' },
        { name: 'Main.bas', source: 'dummy' },
      ],
      []
    );
    expect(result.files.map((f) => f.name)).toEqual(['Main.bas', 'Zebra.bas']);
  });

  test('sorts assets alphabetically regardless of input order', () => {
    const result = packageDemo(
      'Test Demo',
      [{ name: 'Main.bas', source: 'x' }],
      [
        { name: 'zzz.png', bytes: Buffer.from([1, 2, 3]) },
        { name: 'aaa.png', bytes: Buffer.from([4, 5, 6]) },
      ]
    );
    expect(result.assets.map((a) => a.name)).toEqual(['aaa.png', 'zzz.png']);
  });

  test('assigns each file and asset a unique id', () => {
    const result = packageDemo(
      'Test Demo',
      [
        { name: 'Main.bas', source: 'x' },
        { name: 'Player.bas', source: 'y' },
      ],
      [
        { name: 'a.png', bytes: Buffer.from([1]) },
        { name: 'b.png', bytes: Buffer.from([2]) },
      ]
    );
    const ids = [...result.files.map((f) => f.id), ...result.assets.map((a) => a.id)];
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f-]{36}$/));
  });

  test('encodes a .png asset as a base64 image/png data URI', () => {
    const bytes = Buffer.from([137, 80, 78, 71]);
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
      { name: 'wall.png', bytes },
    ]);
    expect(result.assets[0].content).toBe(`data:image/png;base64,${bytes.toString('base64')}`);
  });

  test('encodes a .wav asset as a base64 audio/wav data URI', () => {
    const bytes = Buffer.from([82, 73, 70, 70]);
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
      { name: 'jump.wav', bytes },
    ]);
    expect(result.assets[0].content).toBe(`data:audio/wav;base64,${bytes.toString('base64')}`);
  });

  test('encodes a .json asset as a base64 application/json data URI', () => {
    const bytes = Buffer.from('[[0,0],[0,1]]', 'utf-8');
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
      { name: 'level1.json', bytes },
    ]);
    expect(result.assets[0].content).toBe(`data:application/json;base64,${bytes.toString('base64')}`);
  });

  test('encodes a .stm asset as a base64 application/json data URI', () => {
    const bytes = Buffer.from(
      '{"tileWidth":8,"tileHeight":8,"tileImage":"tiles.png","layers":{"ground":[[0,3]]}}',
      'utf-8'
    );
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
      { name: 'level1.stm', bytes },
    ]);
    expect(result.assets[0].content).toBe(`data:application/json;base64,${bytes.toString('base64')}`);
  });

  test('throws on an unsupported asset extension', () => {
    expect(() =>
      packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
        { name: 'notes.txt', bytes: Buffer.from([1]) },
      ])
    ).toThrow(/Unsupported asset extension/);
  });

  test('fileOrder and assetOrder list ids in the same sorted order as files/assets', () => {
    const result = packageDemo(
      'Test Demo',
      [
        { name: 'Zebra.bas', source: 'x' },
        { name: 'Main.bas', source: 'y' },
      ],
      [
        { name: 'zzz.png', bytes: Buffer.from([1]) },
        { name: 'aaa.png', bytes: Buffer.from([2]) },
      ]
    );
    expect(result.fileOrder[':root']).toEqual(result.files.map((f) => f.id));
    expect(result.assetOrder[':root']).toEqual(result.assets.map((a) => a.id));
  });

  test('supports zero assets', () => {
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], []);
    expect(result.assets).toEqual([]);
    expect(result.assetOrder[':root']).toEqual([]);
  });

  test('sets version, project name, and empty folders', () => {
    const result = packageDemo('My Demo', [{ name: 'Main.bas', source: 'x' }], []);
    expect(result.version).toBe(1);
    expect(result.project).toEqual({ name: 'My Demo' });
    expect(result.folders).toEqual([]);
  });
});
