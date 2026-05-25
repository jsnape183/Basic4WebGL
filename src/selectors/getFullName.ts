import { IFolder } from '../features/folders/foldersSlice';

export function getFullName(
  itemName: string,
  folderId: string | null,
  folders: IFolder[]
): string {
  if (!folderId) return itemName;
  const parts: string[] = [itemName];
  let current = folders.find((f) => f.id === folderId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId
      ? folders.find((f) => f.id === current!.parentId)
      : undefined;
  }
  return parts.join('/');
}
