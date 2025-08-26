import { useDispatch } from 'react-redux';
import { useAssetsForProject } from '../../../hooks/useAssetsForProject';
import FileInput, { FileUploadResult } from '../FileInput';
import { addAsset } from '../../../features/assets/assetsSlice';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Asset } from '../../../globalProps/Asset';

type AssetTreeProps = {
  projectId: string;
};

const AssetTree: React.FC<AssetTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const assets = useAssetsForProject(projectId);
  const [storedAssets, setStoredAssets] = useLocalStorage<Asset[]>(
    `${projectId}:assets`,
    []
  );

  const handleFileInputChange = (files: FileUploadResult[]) => {
    files.forEach((file) => {
      dispatch(
        addAsset({
          id: crypto.randomUUID(),
          name: file.name,
          content: file.content,
          projectId: projectId,
        })
      );

      setStoredAssets([...storedAssets, file as Asset]);
    });
  };

  return (
    <>
      Assets
      <FileInput onChange={handleFileInputChange} />
      <ul className="space-y-2 text-sm">
        {assets.map((asset) => (
          <>
            <li key={asset.id} className="hover:text-white cursor-pointer">
              {asset.name}
            </li>
          </>
        ))}
      </ul>
    </>
  );
};

export default AssetTree;
