const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);

export function getAssetType(name: string): 'image' | 'text' {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = name.slice(dot).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) ? 'image' : 'text';
}
