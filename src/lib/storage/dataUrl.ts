// Conversion between base64 `data:` URLs (the shape assets take in .b4wgl.json
// exports and in legacy persisted state) and binary Blobs (what we store in
// IndexedDB). Implemented without FileReader so it runs in Node as well as the
// browser.

/** Decode a base64 `data:` URL into a Blob, preserving its MIME type. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) {
    throw new Error('dataUrlToBlob: not a data URL');
  }
  const header = dataUrl.slice(0, comma); // e.g. "data:image/png;base64"
  if (!header.includes(';base64')) {
    // Every asset path here (readAsDataURL, .b4wgl.json exports) emits a
    // base64 payload; a plain (percent-encoded) data URL isn't something we
    // produce, and decoding one as base64 would silently corrupt the bytes.
    throw new Error('dataUrlToBlob: expected a ;base64 data URL');
  }
  const semi = header.indexOf(';');
  const mime = header.slice(5, semi === -1 ? undefined : semi) || 'application/octet-stream';
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Encode a Blob as a base64 `data:` URL. */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const CHUNK = 0x8000; // avoid arg-count limits on String.fromCharCode
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const mime = blob.type || 'application/octet-stream';
  return `data:${mime};base64,${btoa(binary)}`;
}
