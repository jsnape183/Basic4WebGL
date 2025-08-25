import { useSelector } from "react-redux";
import { RootState } from "../store";
import { IFile } from "../features/files/filesSlice";

export const useFilesForProject = (projectId: string): IFile[] => {
  return useSelector((state: RootState) =>
    Object.values(state.files.byId).filter(
      (file) => (file as IFile).projectId === projectId
    )
  ) as Array<IFile>;
};
