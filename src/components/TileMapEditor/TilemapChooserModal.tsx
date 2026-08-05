import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getAssetType } from '../AssetPreview/getAssetType';
import NewTilemapDialog from './NewTilemapDialog';

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenAsset: (assetId: string) => void;
};

const TilemapChooserModal: React.FC<Props> = ({ projectId, isOpen, onClose, onOpenAsset }) => {
  const [step, setStep] = useState<'choose' | 'new' | 'open'>('choose');

  const tilemapAssets = useSelector((state: RootState) =>
    Object.values(state.assets.byId).filter(
      (a) => a.projectId === projectId && getAssetType(a.name) === 'tilemap'
    )
  );

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('choose');
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Tilemap editor" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
        {step === 'choose' && (
          <>
            <h2 className="text-ds-text text-lg font-semibold mb-4">Tilemap editor</h2>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => setStep('new')}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                New Tilemap
              </button>
              <button
                onClick={() => setStep('open')}
                disabled={tilemapAssets.length === 0}
                className="bg-ds-surface-2 text-ds-text text-sm px-4 py-2 rounded hover:bg-ds-border transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Open existing{tilemapAssets.length === 0 ? ' (none yet)' : ''}
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={handleClose} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'new' && (
          <NewTilemapDialog
            projectId={projectId}
            onCreated={(id) => { onOpenAsset(id); handleClose(); }}
            onCancel={() => setStep('choose')}
          />
        )}

        {step === 'open' && (
          <>
            <h2 className="text-ds-text text-lg font-semibold mb-4">Open existing</h2>
            <ul className="space-y-1 mb-4">
              {tilemapAssets.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => { onOpenAsset(a.id); handleClose(); }}
                    className="w-full text-left text-ds-text text-sm px-2 py-1.5 rounded hover:bg-ds-surface-2 transition"
                  >
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button onClick={() => setStep('choose')} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TilemapChooserModal;
