import { useSelector } from "react-redux";
import { RootState } from "../store";
import { IFile } from "../features/files/filesSlice";
import { ProjectFile } from "../lib/compiler/types";

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<IFile>;
};

export const useProjectForBuild = (
  projectId: string,
  lib: Array<ProjectFile>
): BuildProject => {
  return {
    lib: lib,
    files: useSelector((state: RootState) =>
      Object.values(state.files.byId).filter(
        (file) => (file as IFile).projectId === projectId
      )
    ) as Array<IFile>,
  };
};
