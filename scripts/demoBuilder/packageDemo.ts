import { v5 as uuidv5 } from 'uuid';
import type { ProjectExportJson } from '../../src/features/projects/exportProject';

// Deterministic ids: build:demo is a pure function of the source dir, so re-running
// it must produce byte-identical output (no churn in the committed .b4wgl.json).
// These ids are internal handles within one export file — importProject re-keys
// everything on import, so their actual values never matter downstream.
const DEMO_ID_NS = '6f9b1d2e-8a3c-4e7f-9b1a-2c3d4e5f6a7b';
const deterministicId = (projectName: string, kind: string, name: string) =>
  uuidv5(`${projectName}:${kind}:${name}`, DEMO_ID_NS);

export type { ProjectExportJson };

export interface RawBasFile {
  name: string;
  source: string;
}

export interface RawAsset {
  name: string;
  bytes: Buffer;
}

// Matches src/components/AssetPreview/getAssetType.ts's supported extensions,
// plus .json and .stm — both fall into that module's generic "text"/"tilemap"
// buckets rather than image/audio, needed for tilemap data assets (.json,
// loaded via the older tilemap.load()) and TileMapSet's multi-layer .stm
// files (loaded directly by its constructor). Matches the MIME type the
// browser's own File API assigns (and FileReader.readAsDataURL embeds) when
// a user drags one of these in by hand, or the app's own NewTilemapDialog
// assigns when creating a new .stm asset.
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.json': 'application/json',
  '.stm': 'application/json',
};

function mimeTypeFor(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot === -1 ? '' : fileName.slice(dot).toLowerCase();
  const mime = MIME_TYPES[ext];
  if (!mime) {
    throw new Error(
      `Unsupported asset extension "${ext}" for file "${fileName}" — supported: ${Object.keys(MIME_TYPES).join(', ')}`
    );
  }
  return mime;
}

export function packageDemo(
  projectName: string,
  basFiles: RawBasFile[],
  assets: RawAsset[]
): ProjectExportJson {
  const sortedFiles = [...basFiles].sort((a, b) => a.name.localeCompare(b.name));
  const files = sortedFiles.map((f) => ({
    id: deterministicId(projectName, 'file', f.name),
    name: f.name,
    source: f.source,
    folderId: null,
    fullName: f.name,
  }));

  const sortedAssets = [...assets].sort((a, b) => a.name.localeCompare(b.name));
  const assetEntries = sortedAssets.map((a) => ({
    id: deterministicId(projectName, 'asset', a.name),
    name: a.name,
    content: `data:${mimeTypeFor(a.name)};base64,${a.bytes.toString('base64')}`,
    folderId: null,
    fullName: a.name,
  }));

  return {
    version: 1,
    project: { name: projectName },
    folders: [],
    files,
    assets: assetEntries,
    fileOrder: { ':root': files.map((f) => f.id) },
    assetOrder: { ':root': assetEntries.map((a) => a.id) },
  };
}
