export type MarkerEntry = { row: number; col: number; tag: string };

export type EditorLayer =
  | { key: string; name: string; kind: 'tile'; data: number[][] }
  | { key: string; name: string; kind: 'marker'; markers: MarkerEntry[] }
  | { key: string; name: string; kind: 'collision'; data: number[][] };

export type StmDoc = {
  tileWidth: number;
  tileHeight: number;
  tileImage: string;
  /** The tilemap's tag registry — every tag name available to paint with,
   * kept independently of whether any marker currently uses it so a tag
   * doesn't vanish the moment its last marker is erased. */
  tags?: string[];
  layers: EditorLayer[];
};
