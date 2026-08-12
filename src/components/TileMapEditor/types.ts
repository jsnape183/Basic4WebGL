export type MarkerEntry = { row: number; col: number; tag: string };

export type EditorLayer =
  | { key: string; name: string; kind: 'tile'; data: number[][] }
  | { key: string; name: string; kind: 'marker'; markers: MarkerEntry[] }
  | { key: string; name: string; kind: 'collision'; data: number[][] };

export type StmDoc = {
  tileWidth: number;
  tileHeight: number;
  tileImage: string;
  layers: EditorLayer[];
};
