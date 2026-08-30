import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { useAssetObjectUrl } from '../../hooks/useAssetObjectUrl';

type Props = {
  asset: IAsset;
};

const AudioPreview: React.FC<Props> = ({ asset }) => {
  const url = useAssetObjectUrl(asset.id);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
      <p className="text-ds-text-muted text-sm font-mono">{asset.name}</p>
      {url ? (
        <audio controls src={url} className="w-full max-w-sm" />
      ) : (
        <p className="text-ds-text-dim text-sm">Loading…</p>
      )}
    </div>
  );
};

export default AudioPreview;
