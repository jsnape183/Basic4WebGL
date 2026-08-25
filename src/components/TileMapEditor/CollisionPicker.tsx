import React from 'react';

type Props = {
  /** Which value painting a cell currently writes: 1 (solid) or 0 (not solid). */
  selectedValue: number;
  onSelectValue: (value: number) => void;
};

const CollisionPicker: React.FC<Props> = ({ selectedValue, onSelectValue }) => {
  return (
    <div className="flex flex-row h-full p-2 gap-2 items-start">
      <button
        type="button"
        onClick={() => onSelectValue(1)}
        aria-label="Solid"
        aria-pressed={selectedValue === 1}
        className={`text-xs px-2 py-1 rounded border ${
          selectedValue === 1
            ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
            : 'border-ds-border text-ds-text-muted hover:text-ds-text'
        }`}
      >
        Solid
      </button>
      <button
        type="button"
        onClick={() => onSelectValue(0)}
        aria-label="Not Solid"
        aria-pressed={selectedValue === 0}
        className={`text-xs px-2 py-1 rounded border ${
          selectedValue === 0
            ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
            : 'border-ds-border text-ds-text-muted hover:text-ds-text'
        }`}
      >
        Not Solid
      </button>
    </div>
  );
};

export default CollisionPicker;
