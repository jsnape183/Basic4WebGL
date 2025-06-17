import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useFilesForProject } from "../../hooks/useFilesForProject";

type FileTreeProps = {
  projectId: string;
  onFileSelected: (fileId: string) => void;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId, onFileSelected }) => {
  const files = useFilesForProject(projectId);

  const selectedFileId: string = useSelector(
    (state: RootState) => state.files.selectedFileId as string
  );
  if (selectedFileId === "") {
    onFileSelected(files[0].id);
  }

  return (
    <aside className="w-64 bg-gray-850 p-4 border-r border-gray-700 overflow-y-auto">
      <div className="text-sm font-semibold text-gray-400 mb-2">Files</div>
      <ul className="space-y-2 text-sm">
        {files.map((file) => (
          <>
            <li key={file.id} className="hover:text-white cursor-pointer">
              {file.name}
            </li>
          </>
        ))}
      </ul>
    </aside>
  );
};

export default FileTree;
