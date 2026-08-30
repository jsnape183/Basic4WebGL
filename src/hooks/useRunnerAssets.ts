import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeSelectAssetsByProject } from '../selectors/assetSelectors';
import { getAssetBlob } from '../lib/storage/assetBlobStore';
import { blobToDataUrl } from '../lib/storage/dataUrl';

export type RunnerAsset = { name: string; src: string };

/**
 * Resolves every asset in a project (all folders) to a { name, src } entry for
 * the runner iframe, where `src` is a base64 data URL. Data URLs (not blob:
 * URLs) because the runner is a srcdoc + sandbox iframe and parent-minted
 * object URLs do not reliably resolve across that boundary. Re-encoding on each
 * Run is a user-initiated cost and acceptable.
 *
 * Returns { assets: null } while resolving or when `enabled` is false, so the
 * caller can withhold the iframe until the manifest is ready.
 */
export function useRunnerAssets(projectId: string, enabled: boolean): { assets: RunnerAsset[] | null } {
  const selectAssets = useMemo(() => makeSelectAssetsByProject(projectId), [projectId]);
  const metaAll = useSelector(selectAssets);
  const [assets, setAssets] = useState<RunnerAsset[] | null>(null);

  // Serialize the identity of the asset list so the effect re-runs on real change.
  const key = metaAll.map((a) => `${a.id}:${a.fullName ?? a.name}`).join('|');

  useEffect(() => {
    if (!enabled) { setAssets(null); return; }
    let cancelled = false;
    setAssets(null);
    (async () => {
      const resolved = await Promise.all(
        metaAll.map(async (a) => {
          try {
            const blob = await getAssetBlob(a.id);
            if (!blob) return null;
            return { name: a.fullName ?? a.name, src: await blobToDataUrl(blob) };
          } catch (err) {
            console.error(`useRunnerAssets: failed to resolve asset ${a.fullName ?? a.name}`, err);
            return null;
          }
        }),
      );
      if (!cancelled) setAssets(resolved.filter((x): x is RunnerAsset => x !== null));
    })();
    return () => { cancelled = true; };
  }, [enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { assets };
}
