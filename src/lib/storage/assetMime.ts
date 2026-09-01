// Single source of truth for the MIME type an asset blob should carry, keyed by
// filename. Matters because `.stm` (and sometimes `.json`) files dragged in from
// disk arrive as a `File` with an empty `.type` — the browser has no MIME
// registered for the `.stm` extension. If that typeless blob is stored as-is it
// later reaches the runner as a `data:application/octet-stream` URL, PIXI v8
// finds no loader for it, `PIXI.Assets.load` resolves `null`, and TileMapSet
// dies with "Cannot read properties of null (reading 'tileWidth')". Coerce our
// known text formats to `application/json` on the way in.
export function assetMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json') || lower.endsWith('.stm')) return 'application/json';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  return 'text/plain';
}

// Returns a Blob for `file` guaranteed to carry a usable MIME type: the file's
// own type when the browser assigned one, otherwise the type implied by its
// name. A no-op re-wrap when `file.type` is already set.
export function blobWithAssetMime(file: File): Blob {
  if (file.type) return file;
  return new Blob([file], { type: assetMimeFromName(file.name) });
}
