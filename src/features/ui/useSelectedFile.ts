import { useSelector } from "react-redux";
import { RootState } from "../../store";

const useSelectedFile = (projectId: string) => {
  return useSelector((state: RootState) => {
    const files = Object.values(state.files.byId).filter(
      (file) => file.projectId === projectId
    );

    const selectedId = state.ui.selectedFileByProject[projectId];
    const selected = files.find((f) => f.id === selectedId);

    return selected || files[0]; // fallback to first
  });
};

export default useSelectedFile;
