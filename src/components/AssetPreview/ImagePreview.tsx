import React, { useState } from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { useAssetObjectUrl } from '../../hooks/useAssetObjectUrl';

type Props = { asset: IAsset };

const ImagePreview: React.FC<Props> = ({ asset }) => {
  const [error, setError] = useState(false);
  const url = useAssetObjectUrl(asset.id);

  const handleError = () => setError(true);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {error ? (
        <p role="alert" className="text-ds-text-muted text-sm">Unable to display image.</p>
      ) : url ? (
        <img
          src={url}
          alt={asset.name}
          onError={handleError}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <p className="text-ds-text-dim text-sm">Loading…</p>
      )}
    </div>
  );
};

export default ImagePreview;
