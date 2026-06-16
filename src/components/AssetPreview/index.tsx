import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { getAssetType } from './getAssetType';
import ImagePreview from './ImagePreview';
import AudioPreview from './AudioPreview';
import TextEditor from './TextEditor';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

const AssetPreview: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const type = getAssetType(asset.name);
  if (type === 'image') return <ImagePreview asset={asset} />;
  if (type === 'audio') return <AudioPreview asset={asset} />;
  return <TextEditor asset={asset} onDirtyChange={onDirtyChange} />;
};

export default AssetPreview;
