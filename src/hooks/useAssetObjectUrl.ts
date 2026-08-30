import { useEffect, useState } from 'react';
import { getAssetBlob } from '../lib/storage/assetBlobStore';

/**
 * Resolves an asset id to an object URL for its binary content, suitable for
 * <img src>, <audio src>, or `new Image().src`. Returns undefined while loading
 * or if the blob is missing. Revokes the URL on unmount and whenever the id
 * changes, so callers never leak.
 *
 * Only safe for use in the top-level document — object URLs minted here do not
 * reliably resolve inside a srcdoc iframe (see useRunnerAssets for that path).
 */
export function useAssetObjectUrl(assetId: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let created: string | undefined;
    setUrl(undefined);
    if (!assetId) return;
    getAssetBlob(assetId).then((blob) => {
      if (cancelled || !blob) return;
      created = URL.createObjectURL(blob);
      setUrl(created);
    });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [assetId]);

  return url;
}
