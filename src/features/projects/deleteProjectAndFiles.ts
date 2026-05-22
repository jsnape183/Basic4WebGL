import { AppDispatch, RootState } from "../../store";
import { removeProject } from "./projectsSlice";
import { IFile, removeFile } from "../files/filesSlice";
import { IAsset, removeAsset } from "../assets/assetsSlice";
import { clearProjectSelection } from "../ui/uiSlice";

export const deleteProjectWithMainFile =
  (projectId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();

    // Remove all files for this project
    const files = Object.values(state.files.byId).filter(
      (file) => (file as IFile).projectId === projectId
    );
    files.forEach((file) => dispatch(removeFile((file as IFile).id)));

    // Remove all assets for this project
    const assets = Object.values(state.assets.byId).filter(
      (asset) => (asset as IAsset).projectId === projectId
    );
    assets.forEach((asset) => dispatch(removeAsset((asset as IAsset).id)));

    // Clear selected file entry for this project from UI state
    dispatch(clearProjectSelection(projectId));

    dispatch(removeProject(projectId));
  };
