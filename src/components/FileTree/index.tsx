import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { RootState } from "../../store";
import { useFilesForProject } from "../../hooks/useFilesForProject";
import { ModalWithInput } from "../Modal";
import { IFile, addFile } from "../../features/files/filesSlice";
import { useDispatch } from "react-redux";

type FileTreeProps = {
  projectId: string;
  onFileSelected: (fileId: string) => void;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId, onFileSelected }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);

  const selectedFileId: string = useSelector(
    (state: RootState) => state.files.selectedFileId as string
  );
  if (selectedFileId === "") {
    onFileSelected(files[0].id);
  }

  const handleNewFile = (filename: string) => {
    let file: IFile = {
      id: uuidv4(),
      name: filename,
      source: "",
      projectId: projectId,
    };
    dispatch(addFile(file));
    onFileSelected(file.id);
  };

  return (
    <aside className="w-64 bg-gray-850 p-4 border-r border-gray-700 overflow-y-auto">
      <div className="text-sm font-semibold text-gray-400 mb-2">
        Files
        <ModalWithInput
          onSubmit={handleNewFile}
          openText="+"
          saveText="Save"
          closeText="Close"
          title="New file"
        />
      </div>
      <ul className="space-y-2 text-sm">
        {files.map((file) => (
          <>
            <li
              key={file.id}
              className="hover:text-white cursor-pointer"
              onClick={() => {
                onFileSelected(file.id);
              }}
            >
              {file.name}
            </li>
          </>
        ))}
      </ul>
    </aside>
  );
};

export default FileTree;
