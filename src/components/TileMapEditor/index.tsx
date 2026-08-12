// src/components/TileMapEditor/index.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch, RootState } from '../../store';
import { useTilesetSlices } from './useTilesetSlices';
import Palette from './Palette';
import TileMapCanvas from './Canvas';
import MarkerCanvas from './MarkerCanvas';
import TagPicker from './TagPicker';
import LayersPanel from './LayersPanel';
import { StmDoc, EditorLayer, MarkerEntry } from './types';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

type StmLayerValue = number[][] | { type: 'markers'; markers: MarkerEntry[] };

export function decodeStmContent(content: string): StmDoc {
  const comma = content.indexOf(',');
  const raw = comma === -1 ? '{}' : decodeURIComponent(escape(atob(content.slice(comma + 1))));
  let parsed: { tileWidth?: number; tileHeight?: number; tileImage?: string; layers?: Record<string, StmLayerValue> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const layerEntries = Object.entries(parsed.layers ?? {});
  return {
    tileWidth: parsed.tileWidth ?? 16,
    tileHeight: parsed.tileHeight ?? 16,
    tileImage: parsed.tileImage ?? '',
    layers: layerEntries.map(([name, value]): EditorLayer =>
      Array.isArray(value)
        ? { key: crypto.randomUUID(), name, kind: 'tile', data: value }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: value.markers }
    ),
  };
}

function buildStmLayers(doc: StmDoc): Record<string, StmLayerValue> {
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    layers[l.name] = l.kind === 'tile' ? l.data : { type: 'markers', markers: l.markers };
  });
  return layers;
}

export function exportStmDoc(doc: StmDoc): string {
  return JSON.stringify({
    tileWidth: doc.tileWidth,
    tileHeight: doc.tileHeight,
    tileImage: doc.tileImage,
    layers: buildStmLayers(doc),
  });
}

function downloadStmFile(doc: StmDoc, filename: string): void {
  // application/octet-stream, not application/json -- a MIME type the
  // browser associates with .json can override or hide the .stm extension
  // in the download attribute's suggested filename.
  const blob = new Blob([exportStmDoc(doc)], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function encodeStmContent(doc: StmDoc, originalContent: string): string {
  const mime = originalContent.startsWith('data:')
    ? originalContent.slice(5, originalContent.indexOf(';'))
    : 'application/json';
  return `data:${mime};base64,` + btoa(unescape(encodeURIComponent(exportStmDoc(doc))));
}

const TileMapEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const dispatch = useDispatch<AppDispatch>();

  const [draftDoc, setDraftDoc] = useState<StmDoc>(() => decodeStmContent(asset.content));
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<number | null>(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setDraftDoc(decodeStmContent(asset.content));
    setActiveIndex(0);
    setIsDirty(false);
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tilesetAsset = useSelector((state: RootState) =>
    Object.values(state.assets.byId).find(
      (a) => a.projectId === asset.projectId && a.name === draftDoc.tileImage
    )
  );

  const { slices } = useTilesetSlices(tilesetAsset?.content, draftDoc.tileWidth, draftDoc.tileHeight);

  useEffect(() => {
    onDirtyChange?.(asset.id, isDirty);
  }, [isDirty, asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLayer = draftDoc.layers[activeIndex];

  // A marker layer has no dense array of its own to derive grid dimensions
  // from — every layer in a document is assumed to share one grid size, so
  // fall back to the first tile layer present (the same assumption
  // handleAddLayer already relied on implicitly before this feature).
  const firstTileLayer = draftDoc.layers.find(
    (l): l is Extract<EditorLayer, { kind: 'tile' }> => l.kind === 'tile'
  );
  const gridRows = firstTileLayer?.data.length ?? 1;
  const gridCols = firstTileLayer?.data[0]?.length ?? 1;

  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer) return;
    if (activeLayer.kind === 'tile') {
      const tileId = selectedTile ?? 0;
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'tile') return l;
          const newData = l.data.map((r) => r.slice());
          newData[row][col] = tileId;
          return { ...l, data: newData };
        }),
      }));
    } else {
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'marker') return l;
          const withoutCell = l.markers.filter((m) => !(m.row === row && m.col === col));
          const newMarkers = selectedTag ? [...withoutCell, { row, col, tag: selectedTag }] : withoutCell;
          return { ...l, markers: newMarkers };
        }),
      }));
    }
    setIsDirty(true);
  };

  const handleAddLayer = (name: string, kind: 'tile' | 'marker') => {
    const newLayer: EditorLayer =
      kind === 'tile'
        ? {
            key: crypto.randomUUID(),
            name,
            kind: 'tile',
            data: Array.from({ length: gridRows }, () => Array.from({ length: gridCols }, () => 0)),
          }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: [] };
    setDraftDoc((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
  };

  const handleRenameLayer = (index: number, name: string) => {
    setDraftDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => (i === index ? { ...l, name } : l)),
    }));
  };

  const handleRemoveLayer = (index: number) => {
    setDraftDoc((prev) => ({ ...prev, layers: prev.layers.filter((_, i) => i !== index) }));
    setActiveIndex((prev) => {
      if (index < prev) return prev - 1;
      if (index === prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  const handleReorderLayers = (fromIndex: number, toIndex: number) => {
    setDraftDoc((prev) => {
      const layers = prev.layers.slice();
      const [moved] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, moved);
      return { ...prev, layers };
    });
    setActiveIndex((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  };

  const handleSave = () => {
    dispatch(updateAsset({ ...asset, content: encodeStmContent(draftDoc, asset.content) }));
    setIsDirty(false);
  };

  // The currently-selected tag is always shown as a chip even before any
  // marker uses it yet, so picking/typing a tag gives immediate visual
  // confirmation of what's "loaded" to paint with.
  const markerTags =
    activeLayer?.kind === 'marker'
      ? Array.from(new Set([...activeLayer.markers.map((m) => m.tag), ...(selectedTag ? [selectedTag] : [])]))
      : [];

  return (
    <div className="flex h-full">
      <div className="w-40 flex-shrink-0 border-r border-ds-border">
        {activeLayer?.kind === 'marker' ? (
          <TagPicker tags={markerTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
        ) : (
          <Palette slices={slices} selectedTile={selectedTile} onSelectTile={setSelectedTile} />
        )}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-end gap-2 p-2 border-b border-ds-border">
          <button
            type="button"
            onClick={() => downloadStmFile(draftDoc, asset.name)}
            className="border border-ds-border text-ds-text text-sm px-4 py-1.5 rounded hover:bg-ds-surface transition"
          >
            Export
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={handleSave}
            className="bg-accent-gradient text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {activeLayer?.kind === 'marker' ? (
            <MarkerCanvas rows={gridRows} cols={gridCols} markers={activeLayer.markers} onPaintCell={handlePaintCell} />
          ) : (
            <TileMapCanvas layerData={activeLayer?.kind === 'tile' ? activeLayer.data : []} slices={slices} onPaintCell={handlePaintCell} />
          )}
        </div>
      </div>
      <div className="w-48 flex-shrink-0 border-l border-ds-border">
        <LayersPanel
          layers={draftDoc.layers}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAdd={handleAddLayer}
          onRename={handleRenameLayer}
          onRemove={handleRemoveLayer}
          onReorder={handleReorderLayers}
        />
      </div>
    </div>
  );
};

export default TileMapEditor;
