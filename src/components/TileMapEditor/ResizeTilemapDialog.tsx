import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ResizeLoss } from './resize';

type Props = {
  currentRows: number;
  currentCols: number;
  describeLoss: (rows: number, cols: number) => ResizeLoss;
  onApply: (rows: number, cols: number) => void;
  onCancel: () => void;
};

const clampDim = (n: number) => Math.max(1, Math.floor(Number.isFinite(n) && n > 0 ? n : 1));

function lossSentence(loss: ResizeLoss): string {
  const parts: string[] = [];
  if (loss.tiles) parts.push(`${loss.tiles} painted tile${loss.tiles === 1 ? '' : 's'}`);
  if (loss.collisionCells) parts.push(`${loss.collisionCells} collision cell${loss.collisionCells === 1 ? '' : 's'}`);
  if (loss.markers) parts.push(`${loss.markers} marker${loss.markers === 1 ? '' : 's'}`);
  const joined =
    parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `This removes ${joined}. Continue?`;
}

const ResizeTilemapDialog: React.FC<Props> = ({ currentRows, currentCols, describeLoss, onApply, onCancel }) => {
  const [rows, setRows] = useState(currentRows);
  const [cols, setCols] = useState(currentCols);
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const applyRows = clampDim(rows);
  const applyCols = clampDim(cols);
  const unchanged = applyRows === currentRows && applyCols === currentCols;
  const loss = describeLoss(applyRows, applyCols);
  const isDestructive = loss.tiles + loss.collisionCells + loss.markers > 0;

  const handleApply = () => {
    if (unchanged) return;
    if (isDestructive) { setStep('confirm'); return; }
    onApply(applyRows, applyCols);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Resize tilemap"
        className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-ds-text text-lg font-semibold mb-4">Resize tilemap</h2>

        {step === 'form' ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-ds-text-muted mb-1" htmlFor="resize-rows">Rows</label>
                <input
                  id="resize-rows"
                  type="number"
                  min={1}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-ds-text-muted mb-1" htmlFor="resize-cols">Columns</label>
                <input
                  id="resize-cols"
                  type="number"
                  min={1}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm"
                />
              </div>
            </div>
            <p className="text-ds-text-dim text-xs mb-4">
              Content stays anchored to the top-left. Larger pads empty cells; smaller trims from the bottom and right.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleApply}
                disabled={unchanged}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-ds-text text-sm mb-4">{lossSentence(loss)}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onApply(applyRows, applyCols)}
                className="border border-ds-error text-ds-error text-sm px-4 py-2 rounded hover:bg-ds-error-bg transition"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
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

export default ResizeTilemapDialog;
