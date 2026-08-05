import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { getAssetType } from './getAssetType';
import ImagePreview from './ImagePreview';
import AudioPreview from './AudioPreview';
import TextEditor from './TextEditor';
import TileMapEditor from '../TileMapEditor';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

const AssetPreview: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const type = getAssetType(asset.name);
  if (type === 'image') return <ImagePreview asset={asset} />;
  if (type === 'audio') return <AudioPreview asset={asset} />;
  if (type === 'tilemap') return <TileMapEditor asset={asset} onDirtyChange={onDirtyChange} />;
  return <TextEditor asset={asset} onDirtyChange={onDirtyChange} />;
};

export default AssetPreview;
