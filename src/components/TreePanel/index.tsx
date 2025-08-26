import AssetTree from './AssetTree';
import FileTree from '../FileTree';

type TreePanelProps = {
  projectId: string;
};

const TreePanel: React.FC<TreePanelProps> = ({ projectId }) => {
  return (
    <aside className="w-64 bg-gray-850 p-4 border-r border-gray-700 overflow-y-auto">
      <FileTree projectId={projectId} />
      <AssetTree projectId={projectId} />
    </aside>
  );
};

export default TreePanel;
