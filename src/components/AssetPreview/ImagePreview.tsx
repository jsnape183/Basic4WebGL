import React, { useState } from 'react';
import { IAsset } from '../../features/assets/assetsSlice';

type Props = { asset: IAsset };

const ImagePreview: React.FC<Props> = ({ asset }) => {
  const [error, setError] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {error ? (
        <p className="text-ds-text-muted text-sm">Unable to display image.</p>
      ) : (
        <img
          src={asset.content}
          alt={asset.name}
          onError={() => setError(true)}
          className="max-w-full max-h-full object-contain"
        />
      )}
    </div>
  );
};

export default ImagePreview;
