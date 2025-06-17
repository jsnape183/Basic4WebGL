import { useSelector } from "react-redux";
import { RootState } from "../store";
import { File } from "../features/files/filesSlice";
import { ProjectFile } from "../lib/compiler/types";

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<File>;
};

export const useProjectForBuild = (
  projectId: string,
  lib: Array<ProjectFile>
): BuildProject => {
  return {
    lib: lib,
    files: useSelector((state: RootState) =>
      Object.values(state.files.byId).filter(
        (file) => (file as File).projectId === projectId
      )
    ) as Array<File>,
  };
};
