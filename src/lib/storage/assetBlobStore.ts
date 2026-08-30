import localforage from 'localforage';

// Asset binary content, keyed by asset id, in its own IndexedDB object store —
// kept out of the persisted Redux blob so a few MB of audio no longer blows the
// ~5 MB localStorage quota. Stored as { data: ArrayBuffer, type: string } rather
// than a raw Blob: ArrayBuffers structured-clone reliably in every engine
// (including fake-indexeddb under test), a raw Blob does not.

interface StoredBlob {
  data: ArrayBuffer;
  type: string;
}

const blobStore = localforage.createInstance({
  name: 'softBASIC',
  storeName: 'assetBlobs',
  description: 'asset binary content, keyed by asset id',
});

export async function putAssetBlob(id: string, blob: Blob): Promise<void> {
  const record: StoredBlob = { data: await blob.arrayBuffer(), type: blob.type };
  await blobStore.setItem(id, record);
}

export async function getAssetBlob(id: string): Promise<Blob | undefined> {
  const record = await blobStore.getItem<StoredBlob>(id);
  if (!record) return undefined;
  return new Blob([record.data], { type: record.type });
}

export async function deleteAssetBlob(id: string): Promise<void> {
  await blobStore.removeItem(id);
}

export async function deleteAssetBlobs(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => blobStore.removeItem(id)));
}

/** Test-only: wipe the store between cases. Not for production use. */
export async function _clearAllAssetBlobsForTests(): Promise<void> {
  await blobStore.clear();
}
