import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addPackageToProject } from '../../features/projects/projectsSlice';
import { IPackage } from '../../features/packages/packagesSlice';

type AddPackageModalProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
};

const AddPackageModal: React.FC<AddPackageModalProps> = ({ projectId, isOpen, onClose }) => {
  const [search, setSearch] = React.useState('');
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const projectPackageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? [];
  });

  const availablePackages = useSelector((state: RootState) =>
    Object.values(state.packages.byId).filter(
      (pkg): pkg is IPackage => !projectPackageIds.includes(pkg.id)
    )
  );

  const filtered = availablePackages.filter((pkg) =>
    pkg.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (packageId: string) => {
    dispatch(addPackageToProject({ projectId, packageId }));
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add package"
        className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-ds-text text-lg font-semibold mb-4">Add package</h2>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages..."
          className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"
        />
        {filtered.length === 0 ? (
          <p className="text-ds-text-dim text-sm">No packages available to add.</p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((pkg) => (
              <li key={pkg.id} className="flex items-center justify-between py-1.5">
                <span className="text-ds-text text-sm">{pkg.name}</span>
                <button
                  onClick={() => handleAdd(pkg.id)}
                  aria-label={`Add ${pkg.name}`}
                  className="text-ds-accent text-sm hover:opacity-80 transition"
                >
                  + Add
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddPackageModal;
