import { useDispatch } from "react-redux";
import { useAssetsForProject } from "../../hooks/useAssetsForProject";

type AssetTreeProps = {
  projectId: string;
  onAssetSelected: (fileId: string) => void;
};

const AssetTree: React.FC<AssetTreeProps> = ({
  projectId,
  onAssetSelected,
}) => {
  const dispatch = useDispatch();
  const assets = useAssetsForProject(projectId);

  const handleOpenFileDialog = () => {};

  return (
    <aside className="w-64 bg-gray-850 p-4 border-r border-gray-700 overflow-y-auto">
      <div className="text-sm font-semibold text-gray-400 mb-2">
        Assets
        <button
          onClick={handleOpenFileDialog}
          className="bg-blue-500 text-white p-2 rounded"
        >
          +
        </button>
        <ul className="space-y-2 text-sm">
          {assets.map((asset) => (
            <>
              <li
                key={asset.id}
                className="hover:text-white cursor-pointer"
                onClick={() => {
                  onAssetSelected(asset.id);
                }}
              >
                {asset.name}
              </li>
            </>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default AssetTree;
