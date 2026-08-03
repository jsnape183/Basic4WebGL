import { v4 as uuidv4 } from 'uuid';
import type { ProjectExportJson } from '../../src/features/projects/exportProject';

export type { ProjectExportJson };

export interface RawBasFile {
  name: string;
  source: string;
}

export interface RawAsset {
  name: string;
  bytes: Buffer;
}

// Matches src/components/AssetPreview/getAssetType.ts's supported extensions.
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
    id: uuidv4(),
    name: f.name,
    source: f.source,
    folderId: null,
    fullName: f.name,
  }));

  const sortedAssets = [...assets].sort((a, b) => a.name.localeCompare(b.name));
  const assetEntries = sortedAssets.map((a) => ({
    id: uuidv4(),
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
