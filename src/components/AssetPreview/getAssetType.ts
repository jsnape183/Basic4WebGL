const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg']);
const TILEMAP_EXTENSIONS = new Set(['.stm']);

export function getAssetType(name: string): 'image' | 'audio' | 'tilemap' | 'text' {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = name.slice(dot).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (TILEMAP_EXTENSIONS.has(ext)) return 'tilemap';
  return 'text';
}
