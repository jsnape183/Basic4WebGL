import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { getAssetType } from './getAssetType';
import ImagePreview from './ImagePreview';
import TextEditor from './TextEditor';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

const AssetPreview: React.FC<Props> = ({ asset, onDirtyChange }) => {
  if (getAssetType(asset.name) === 'image') {
    return <ImagePreview asset={asset} />;
  }
  return <TextEditor asset={asset} onDirtyChange={onDirtyChange} />;
};

export default AssetPreview;
