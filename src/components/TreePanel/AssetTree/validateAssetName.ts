export function validateAssetName(
  name: string,
  existingAssets: { name: string; folderId: string | null }[],
  folderId: string | null,
): string | null {
  if (!name.trim()) return 'Name cannot be empty.';
  const trimmed = name.trim();
  const exists = existingAssets.some(
    (a) => a.name === trimmed && (a.folderId ?? null) === folderId
  );
  if (exists) return `'${trimmed}' already exists in this folder.`;
  return null;
}
