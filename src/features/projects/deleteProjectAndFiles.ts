import { AppDispatch, RootState } from "../../store";
import { removeProject } from "./projectsSlice";
import { IFile, removeFile } from "../files/filesSlice";

export const deleteProjectWithMainFile =
  (projectId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const files = Object.values(state.files.byId).filter(
      (file) => (file as IFile).projectId === projectId
    );

    files.forEach((file) => dispatch(removeFile((file as IFile).id)));
    dispatch(removeProject(projectId));
  };
