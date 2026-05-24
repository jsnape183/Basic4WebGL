import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removePackageFromProject } from '../../features/projects/projectsSlice';
import { IPackage } from '../../features/packages/packagesSlice';

type PackagesSectionProps = {
  projectId: string;
  onAddClick?: () => void;
};

const PackagesSection: React.FC<PackagesSectionProps> = ({ projectId, onAddClick = () => {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dispatch = useDispatch();

  const packageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? ['softcore', 'softgfx'];
  });

  const packages = useSelector((state: RootState) =>
    packageIds
      .map((id) => state.packages.byId[id])
      .filter((pkg): pkg is IPackage => Boolean(pkg))
  );

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <button
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim hover:text-ds-text transition"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-label="Packages"
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>Packages</span>
          {!isExpanded && (
            <span className="ml-1 bg-ds-surface-2 text-ds-accent text-[10px] px-1.5 rounded">
              {packages.length}
            </span>
          )}
        </button>
        <button
          onClick={onAddClick}
          aria-label="Add package"
          className="text-ds-text-muted hover:text-ds-text transition text-sm"
        >
          ＋
        </button>
      </div>

      {isExpanded && (
        <ul className="space-y-0.5 mb-1">
          {packages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex items-center gap-2 px-2 py-1 text-sm text-ds-text-dim rounded"
            >
              <span className="text-green-400 text-xs">●</span>
              <span>{pkg.name}</span>
              <span className="ml-auto">
                {pkg.isCore ? (
                  <span className="text-[10px] text-ds-text-dim">core</span>
                ) : (
                  <button
                    aria-label={`Remove ${pkg.name}`}
                    onClick={() =>
                      dispatch(removePackageFromProject({ projectId, packageId: pkg.id }))
                    }
                    className="text-ds-text-dim hover:text-ds-text transition text-xs"
                  >
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PackagesSection;
