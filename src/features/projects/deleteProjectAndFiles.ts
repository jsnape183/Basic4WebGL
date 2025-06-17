import { AppDispatch, RootState } from "../../store";
import { removeProject } from "./projectsSlice";
import { File, removeFile } from "../files/filesSlice";

export const deleteProjectWithMainFile =
  (projectId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const files = Object.values(state.files.byId).filter(
      (file) => (file as File).projectId === projectId
    );

    files.forEach((file) => dispatch(removeFile((file as File).id)));
    dispatch(removeProject(projectId));
  };
