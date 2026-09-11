type StmMarkerEntry = { row: number; col: number; tag: string };
type StmLayerValue =
  | number[][]
  | { type: 'markers'; markers: StmMarkerEntry[] }
  | { type: 'collision'; data: number[][] };

/**
 * The effective tag list a raw .stm JSON string carries: whatever is in its
 * `tags` field, plus any tag actually used by a marker (covers a legacy file
 * saved before the tag registry existed). Malformed JSON or a missing field
 * yields an empty list, never throws.
 *
 * Deliberately NOT shared with decodeStmText's near-identical logic in
 * index.tsx — this is a small, standalone read for an additive, read-only
 * feature (cross-map tag suggestions), kept separate so it cannot affect the
 * decode path every other editor feature depends on.
 */
export function extractTagsFromStmJson(raw: string): string[] {
  let parsed: { tags?: unknown; layers?: Record<string, StmLayerValue> };
  try {
    parsed = JSON.parse(raw || '{}');
  } catch {
    return [];
  }
  const storedTags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string => typeof t === 'string')
    : [];
  const layerEntries = Object.entries(parsed.layers ?? {});
  const usedTags = layerEntries.flatMap(([, value]) =>
    !Array.isArray(value) && value.type === 'markers' ? value.markers.map((m) => m.tag) : []
  );
  return Array.from(new Set([...storedTags, ...usedTags]));
}
