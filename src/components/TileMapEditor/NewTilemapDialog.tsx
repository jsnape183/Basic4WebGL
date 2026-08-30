import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addAsset } from '../../features/assets/assetsSlice';
import { validateAssetName } from '../TreePanel/AssetTree/validateAssetName';
import { getAssetType } from '../AssetPreview/getAssetType';

type Props = {
  projectId: string;
  onCreated: (assetId: string) => void;
  onCancel: () => void;
};

const NewTilemapDialog: React.FC<Props> = ({ projectId, onCreated, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();

  const assetsById = useSelector((state: RootState) => state.assets.byId);
  const allAssets = useMemo(
    () => Object.values(assetsById).filter((a) => a.projectId === projectId),
    [assetsById, projectId]
  );
  const imageAssets = useMemo(
    () => allAssets.filter((a) => getAssetType(a.name) === 'image'),
    [allAssets]
  );

  const [filename, setFilename] = useState('untitled.stm');
  const [tileImageName, setTileImageName] = useState<string>('');
  const [tileWidth, setTileWidth] = useState(16);
  const [tileHeight, setTileHeight] = useState(16);
  const [cols, setCols] = useState(10);
  const [rows, setRows] = useState(10);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadTilesetFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const id = crypto.randomUUID();
      // TODO(Task 12): write the uploaded tileset bytes to the blob store here
      dispatch(addAsset({
        id,
        name: file.name,
        projectId,
        folderId: null,
        fullName: file.name,
      }));
      setTileImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const name = filename.trim();
    const nameError = validateAssetName(name, allAssets, null);
    if (nameError) { setError(nameError); return; }
    if (!tileImageName) { setError('Choose or drop a tileset image.'); return; }
    if (tileWidth <= 0 || tileHeight <= 0 || cols <= 0 || rows <= 0) {
      setError('Tile size and grid dimensions must be greater than zero.');
      return;
    }
    const data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    const doc = { tileWidth, tileHeight, tileImage: tileImageName, layers: { background: data } };
    const json = JSON.stringify(doc);
    const id = crypto.randomUUID();
    // TODO(Task 12): putAssetBlob(id, new Blob([json], { type: 'application/json' }))
    void json;
    dispatch(addAsset({
      id,
      name,
      projectId,
      folderId: null,
      fullName: name,
    }));
    onCreated(id);
  };

  return (
    <div>
      <h2 className="text-ds-text text-lg font-semibold mb-4">New Tilemap</h2>

      <label className="block text-xs text-ds-text-muted mb-1">Filename</label>
      <input
        type="text"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
        className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-3"
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) uploadTilesetFile(file);
        }}
        className={`border border-dashed rounded px-2 py-2 mb-3 text-xs ${
          dragging ? 'border-ds-accent bg-ds-accent-subtle' : 'border-ds-border'
        }`}
      >
        <select
          aria-label="Tileset image"
          value={tileImageName}
          onChange={(e) => setTileImageName(e.target.value)}
          className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm mb-1"
        >
          <option value="">Choose an image asset…</option>
          {imageAssets.map((a) => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
        <p className="text-ds-text-dim">…or drag and drop an image file here</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Tile width</label>
          <input type="number" min={1} value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Tile height</label>
          <input type="number" min={1} value={tileHeight} onChange={(e) => setTileHeight(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Grid columns</label>
          <input type="number" min={1} value={cols} onChange={(e) => setCols(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Grid rows</label>
          <input type="number" min={1} value={rows} onChange={(e) => setRows(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
      </div>

      {error && <p className="text-ds-error text-xs mb-3">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          onClick={handleSubmit}
          className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
        >
          Create
        </button>
        <button onClick={onCancel} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NewTilemapDialog;
