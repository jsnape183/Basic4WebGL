import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { RootState } from "../../store";
import { useFilesForProject } from "../../hooks/useFilesForProject";
import { ModalWithInput } from "../Modal";
import { IFile, addFile } from "../../features/files/filesSlice";
import { useDispatch } from "react-redux";
import { selectFile } from "../../features/ui/uiSlice";

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);

  const selectedFileId: string = useSelector(
    (state: RootState) => state.files.selectedFileId as string
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };


  if (selectedFileId === "") {
    handleFileSelected(files[0].id);
  }

  const handleNewFile = (filename: string) => {
    let file: IFile = {
      id: uuidv4(),
      name: filename,
      source: "",
      projectId: projectId,
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  return (
    <>
        Files
        <ModalWithInput
          onSubmit={handleNewFile}
          openText="+"
          saveText="Save"
          closeText="Close"
          title="New file"
        />
      <ul className="space-y-2 text-sm">
        {files.map((file) => (
          <>
            <li
              key={file.id}
              className="hover:text-white cursor-pointer"
              onClick={() => {
                handleFileSelected(file.id);
              }}
            >
              {file.name}
            </li>
          </>
        ))}
      </ul>
    </>
  );
};

export default FileTree;
