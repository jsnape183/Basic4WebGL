import { useEffect, useState } from 'react';
import { getAssetBlob } from '../lib/storage/assetBlobStore';

/**
 * Loads an asset's binary content from the blob store and decodes it as text.
 * Returns { text: undefined, loading: true } until it resolves; text stays
 * undefined if the blob is missing.
 */
export function useAssetText(assetId: string | undefined): { text: string | undefined; loading: boolean } {
  const [state, setState] = useState<{ text: string | undefined; loading: boolean }>({
    text: undefined,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ text: undefined, loading: true });
    if (!assetId) {
      setState({ text: undefined, loading: false });
      return;
    }
    getAssetBlob(assetId).then(async (blob) => {
      if (cancelled) return;
      setState({ text: blob ? await blob.text() : undefined, loading: false });
    });
    return () => { cancelled = true; };
  }, [assetId]);

  return state;
}
