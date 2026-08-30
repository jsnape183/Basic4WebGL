// src/components/TileMapEditor/index.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch, RootState } from '../../store';
import { useTilesetSlices } from './useTilesetSlices';
import { CELL_SIZE } from './constants';
import Palette from './Palette';
import TileMapCanvas from './Canvas';
import MarkerCanvas from './MarkerCanvas';
import CollisionCanvas from './CollisionCanvas';
import TagPicker from './TagPicker';
import CollisionPicker from './CollisionPicker';
import LayersPanel from './LayersPanel';
import { StmDoc, EditorLayer, MarkerEntry } from './types';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

type StmLayerValue =
  | number[][]
  | { type: 'markers'; markers: MarkerEntry[] }
  | { type: 'collision'; data: number[][] };

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
    layers: layerEntries.map(([name, value]): EditorLayer => {
      if (Array.isArray(value)) return { key: crypto.randomUUID(), name, kind: 'tile', data: value };
      if (value.type === 'collision') return { key: crypto.randomUUID(), name, kind: 'collision', data: value.data };
      return { key: crypto.randomUUID(), name, kind: 'marker', markers: value.markers };
    }),
  };
}

function buildStmLayers(doc: StmDoc): Record<string, StmLayerValue> {
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    if (l.kind === 'tile') layers[l.name] = l.data;
    else if (l.kind === 'collision') layers[l.name] = { type: 'collision', data: l.data };
    else layers[l.name] = { type: 'markers', markers: l.markers };
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

  // TODO(Task 12): decode real .stm blob bytes instead of the empty shim
  const [draftDoc, setDraftDoc] = useState<StmDoc>(() => decodeStmContent(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<number | null>(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // 1 (solid) by default, matching this layer kind's original always-solid
  // painting behavior before Not Solid existed as an option.
  const [selectedCollisionValue, setSelectedCollisionValue] = useState<number>(1);
  const [isDirty, setIsDirty] = useState(false);
  const [hiddenLayerKeys, setHiddenLayerKeys] = useState<Set<string>>(() => new Set());
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    // TODO(Task 12): decode real .stm blob bytes instead of the empty shim
    setDraftDoc(decodeStmContent(''));
    setActiveIndex(0);
    setIsDirty(false);
    setHiddenLayerKeys(new Set());
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tilesetAsset = useSelector((state: RootState) =>
    Object.values(state.assets.byId).find(
      (a) => a.projectId === asset.projectId && a.name === draftDoc.tileImage
    )
  );

  // TODO(Task 12): pass tilesetAsset's object URL instead of undefined
  void tilesetAsset;
  const { slices } = useTilesetSlices(undefined, draftDoc.tileWidth, draftDoc.tileHeight);

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

  function setGridCell(data: number[][], row: number, col: number, value: number): number[][] {
    const newData = data.map((r) => r.slice());
    newData[row][col] = value;
    return newData;
  }

  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer) return;
    if (activeLayer.kind === 'tile') {
      const tileId = selectedTile ?? 0;
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'tile') return l;
          return { ...l, data: setGridCell(l.data, row, col, tileId) };
        }),
      }));
    } else if (activeLayer.kind === 'collision') {
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'collision') return l;
          return { ...l, data: setGridCell(l.data, row, col, selectedCollisionValue) };
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

  const handleAddLayer = (name: string, kind: 'tile' | 'marker' | 'collision') => {
    const emptyGrid = () => Array.from({ length: gridRows }, () => Array.from({ length: gridCols }, () => 0));
    let newLayer: EditorLayer;
    if (kind === 'tile') newLayer = { key: crypto.randomUUID(), name, kind: 'tile', data: emptyGrid() };
    else if (kind === 'collision') newLayer = { key: crypto.randomUUID(), name, kind: 'collision', data: emptyGrid() };
    else newLayer = { key: crypto.randomUUID(), name, kind: 'marker', markers: [] };
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

  const handleToggleLayerVisibility = (index: number) => {
    const layer = draftDoc.layers[index];
    if (!layer) return;
    // Hiding the layer you're actively editing would leave you painting
    // blind with no way back except re-selecting it by name -- disallow it.
    if (index === activeIndex && !hiddenLayerKeys.has(layer.key)) return;
    setHiddenLayerKeys((prev) => {
      const next = new Set(prev);
      if (next.has(layer.key)) next.delete(layer.key); else next.add(layer.key);
      return next;
    });
  };

  const handleSelectLayer = (index: number) => {
    setActiveIndex(index);
    const layer = draftDoc.layers[index];
    if (layer) {
      setHiddenLayerKeys((prev) => {
        if (!prev.has(layer.key)) return prev;
        const next = new Set(prev);
        next.delete(layer.key);
        return next;
      });
    }
  };

  const handleSave = () => {
    // TODO(Task 12): putAssetBlob(asset.id, new Blob([exportStmDoc(draftDoc)], { type: 'application/json' }))
    void encodeStmContent(draftDoc, '');
    dispatch(updateAsset({ ...asset }));
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
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 p-2 border-b border-ds-border">
          <span className="text-xs text-ds-text-muted min-w-0">
            {hoverCell &&
              `Row ${hoverCell.row}, Col ${hoverCell.col} · x ${hoverCell.col * draftDoc.tileWidth}, y ${hoverCell.row * draftDoc.tileHeight}`}
          </span>
          <div className="flex gap-2">
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
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-2">
          <div style={{ position: 'relative', width: gridCols * CELL_SIZE, height: gridRows * CELL_SIZE }}>
            {draftDoc.layers.length === 0 && (
              <TileMapCanvas layerData={[]} slices={slices} onPaintCell={handlePaintCell} />
            )}
            {draftDoc.layers.map((layer, index) => {
              if (hiddenLayerKeys.has(layer.key)) return null;
              const isActive = index === activeIndex;
              return (
                <div
                  key={layer.key}
                  aria-label={`Layer ${layer.name}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isActive ? 1 : 0.35,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  {layer.kind === 'marker' ? (
                    <MarkerCanvas
                      rows={gridRows}
                      cols={gridCols}
                      markers={layer.markers}
                      onPaintCell={handlePaintCell}
                      interactive={isActive}
                      onHoverCell={(row, col) => setHoverCell({ row, col })}
                      onHoverEnd={() => setHoverCell(null)}
                    />
                  ) : layer.kind === 'collision' ? (
                    <CollisionCanvas
                      rows={gridRows}
                      cols={gridCols}
                      data={layer.data}
                      onPaintCell={handlePaintCell}
                      interactive={isActive}
                      onHoverCell={(row, col) => setHoverCell({ row, col })}
                      onHoverEnd={() => setHoverCell(null)}
                    />
                  ) : (
                    <TileMapCanvas
                      layerData={layer.data}
                      slices={slices}
                      onPaintCell={handlePaintCell}
                      interactive={isActive}
                      onHoverCell={(row, col) => setHoverCell({ row, col })}
                      onHoverEnd={() => setHoverCell(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-40 flex-shrink-0 border-t border-ds-border">
          {activeLayer?.kind === 'marker' ? (
            <TagPicker tags={markerTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
          ) : activeLayer?.kind === 'collision' ? (
            <CollisionPicker selectedValue={selectedCollisionValue} onSelectValue={setSelectedCollisionValue} />
          ) : (
            <Palette slices={slices} selectedTile={selectedTile} onSelectTile={setSelectedTile} />
          )}
        </div>
      </div>
      <div className="w-48 flex-shrink-0 border-l border-ds-border">
        <LayersPanel
          layers={draftDoc.layers}
          activeIndex={activeIndex}
          hiddenKeys={hiddenLayerKeys}
          onSelect={handleSelectLayer}
          onAdd={handleAddLayer}
          onRename={handleRenameLayer}
          onRemove={handleRemoveLayer}
          onReorder={handleReorderLayers}
          onToggleVisibility={handleToggleLayerVisibility}
        />
      </div>
    </div>
  );
};

export default TileMapEditor;
