import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile } from '../../features/files/filesSlice';
import { selectFile } from '../../features/ui/uiSlice';

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  // Auto-select first file when none is selected for this project
  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      dispatch(selectFile({ projectId, fileId: files[0].id }));
    }
  }, [selectedFileId, files, dispatch, projectId]);

  const handleNewFile = (filename: string) => {
    const file: IFile = {
      id: uuidv4(),
      name: filename,
      source: '',
      projectId,
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  const handleDeleteFile = (id: string) => {
    dispatch(removeFile(id));
    // If we just deleted the selected file, select the next available file
    if (id === selectedFileId) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        handleFileSelected(remaining[0].id);
      }
    }
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
          <li
            key={file.id}
            className={`flex items-center justify-between group hover:text-white cursor-pointer ${
              file.id === selectedFileId ? 'text-white font-semibold' : ''
            }`}
          >
            <span onClick={() => handleFileSelected(file.id)}>{file.name}</span>
            {files.length > 1 && (
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="hidden group-hover:inline text-gray-500 hover:text-red-400 ml-2 text-xs"
                title="Delete file"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export default FileTree;
