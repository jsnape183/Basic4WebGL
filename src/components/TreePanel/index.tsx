import React from 'react';
import AssetTree from './AssetTree';
import FileTree from '../FileTree';

type TreePanelProps = {
  projectId: string;
};

const TreePanel: React.FC<TreePanelProps> = ({ projectId }) => (
  <>
    <FileTree projectId={projectId} />
    <div className="mt-4 pt-4 border-t border-ds-border-subtle">
      <AssetTree projectId={projectId} />
    </div>
  </>
);

export default TreePanel;
