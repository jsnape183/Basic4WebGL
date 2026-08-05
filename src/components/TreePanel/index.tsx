import React from 'react';
import AssetTree from './AssetTree';
import FileTree from '../FileTree';

type TreePanelProps = {
  projectId: string;
  onOpenAsset?: (assetId: string) => void;
  onSelectFile?: (fileId: string) => void;
};

const TreePanel: React.FC<TreePanelProps> = ({ projectId, onOpenAsset, onSelectFile }) => (
  <>
    <FileTree projectId={projectId} onSelectFile={onSelectFile} />
    <div className="mt-4 pt-4 border-t border-ds-border-subtle">
      <AssetTree projectId={projectId} onOpenAsset={onOpenAsset} />
    </div>
  </>
);

export default TreePanel;
