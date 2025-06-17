import { useSelector } from "react-redux";
import { RootState } from "../store";
import { File } from "../features/files/filesSlice";

export const useFilesForProject = (projectId: string): File[] => {
  return useSelector((state: RootState) =>
    Object.values(state.files.byId).filter(
      (file) => (file as File).projectId === projectId
    )
  ) as Array<File>;
};
