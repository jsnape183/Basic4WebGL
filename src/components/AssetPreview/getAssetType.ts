const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg']);

export function getAssetType(name: string): 'image' | 'audio' | 'text' {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = name.slice(dot).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  return 'text';
}
