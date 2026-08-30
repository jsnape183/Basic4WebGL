import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';

type Props = {
  asset: IAsset;
};

const AudioPreview: React.FC<Props> = ({ asset }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
    <p className="text-ds-text-muted text-sm font-mono">{asset.name}</p>
    {/* TODO(Task 11): useAssetObjectUrl — src stubbed empty until blob wiring lands */}
    <audio controls src={''} className="w-full max-w-sm" />
  </div>
);

export default AudioPreview;
