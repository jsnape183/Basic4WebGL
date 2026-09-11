import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getAssetBlob } from '../../lib/storage/assetBlobStore';
import { getAssetType } from '../AssetPreview/getAssetType';
import { extractTagsFromStmJson } from './stmTags';

export type CrossMapTag = { tag: string; sources: string[] };

/**
 * Every tag used by another tilemap asset in the same project (excluding
 * `excludeAssetId`, the map currently open). Purely additive/read-only: it
 * never touches any asset's stored data. Re-scans when the project's set of
 * candidate tilemap assets changes, not on every render. A blob that fails
 * to load or parse is skipped, not thrown.
 */
export function useCrossMapTags(projectId: string | undefined, excludeAssetId: string): CrossMapTag[] {
  const otherTilemapAssets = useSelector((state: RootState) =>
    Object.values(state.assets.byId).filter(
      (a) => a.projectId === projectId && a.id !== excludeAssetId && getAssetType(a.name) === 'tilemap'
    )
  );
  // A stable primitive key so the effect only re-runs when the actual set of
  // candidate assets changes, not on every unrelated Redux update.
  const assetsKey = otherTilemapAssets.map((a) => `${a.id}:${a.name}`).sort().join(',');

  const [crossMapTags, setCrossMapTags] = useState<CrossMapTag[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (otherTilemapAssets.length === 0) {
      setCrossMapTags([]);
      return;
    }
    Promise.all(
      otherTilemapAssets.map(async (a) => {
        try {
          const blob = await getAssetBlob(a.id);
          if (!blob) return { name: a.name, tags: [] as string[] };
          const text = await blob.text();
          return { name: a.name, tags: extractTagsFromStmJson(text) };
        } catch {
          return { name: a.name, tags: [] as string[] };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const sourcesByTag = new Map<string, Set<string>>();
      for (const { name, tags } of results) {
        for (const tag of tags) {
          if (!sourcesByTag.has(tag)) sourcesByTag.set(tag, new Set());
          sourcesByTag.get(tag)!.add(name);
        }
      }
      const next = Array.from(sourcesByTag.entries())
        .map(([tag, sources]) => ({ tag, sources: Array.from(sources).sort() }))
        .sort((a, b) => a.tag.localeCompare(b.tag));
      setCrossMapTags(next);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsKey]);

  return crossMapTags;
}
