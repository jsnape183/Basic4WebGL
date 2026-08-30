import React, { useState } from 'react';
import { IAsset } from '../../features/assets/assetsSlice';

type Props = { asset: IAsset };

const ImagePreview: React.FC<Props> = ({ asset }) => {
  const [error, setError] = useState(false);

  const handleError = () => setError(true);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {error ? (
        <p role="alert" className="text-ds-text-muted text-sm">Unable to display image.</p>
      ) : (
        // TODO(Task 11): useAssetObjectUrl — src stubbed empty until blob wiring lands
        <img
          src={/* TODO(Task 11) */ ''}
          alt={asset.name}
          onError={handleError}
          className="max-w-full max-h-full object-contain"
        />
      )}
    </div>
  );
};

export default ImagePreview;
