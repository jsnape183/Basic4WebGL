// src/components/TileMapEditor/index.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch, RootState } from '../../store';
import { useTilesetSlices } from './useTilesetSlices';
import Palette from './Palette';
import TileMapCanvas from './Canvas';
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

export function encodeStmContent(doc: StmDoc, originalContent: string): string {
  const mime = originalContent.startsWith('data:')
    ? originalContent.slice(5, originalContent.indexOf(';'))
    : 'application/json';
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    layers[l.name] = l.kind === 'tile' ? l.data : { type: 'markers', markers: l.markers };
  });
  const json = JSON.stringify({
    tileWidth: doc.tileWidth,
    tileHeight: doc.tileHeight,
    tileImage: doc.tileImage,
    layers,
  });
  return `data:${mime};base64,` + btoa(unescape(encodeURIComponent(json)));
}

const TileMapEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const dispatch = useDispatch<AppDispatch>();

  const [draftDoc, setDraftDoc] = useState<StmDoc>(() => decodeStmContent(asset.content));
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<number | null>(1);
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

  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer || activeLayer.kind !== 'tile') return;
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
    setIsDirty(true);
  };

  const handleAddLayer = (name: string) => {
    const rows = activeLayer?.kind === 'tile' ? activeLayer.data.length : 1;
    const cols = activeLayer?.kind === 'tile' ? activeLayer.data[0]?.length ?? 1 : 1;
    const data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    setDraftDoc((prev) => ({ ...prev, layers: [...prev.layers, { key: crypto.randomUUID(), name, kind: 'tile', data }] }));
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

  return (
    <div className="flex h-full">
      <div className="w-40 flex-shrink-0 border-r border-ds-border">
        <Palette slices={slices} selectedTile={selectedTile} onSelectTile={setSelectedTile} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-end p-2 border-b border-ds-border">
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
          <TileMapCanvas layerData={activeLayer?.kind === 'tile' ? activeLayer.data : []} slices={slices} onPaintCell={handlePaintCell} />
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
