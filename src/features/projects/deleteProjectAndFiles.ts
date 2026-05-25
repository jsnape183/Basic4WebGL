import { AppDispatch, RootState } from "../../store";
import { removeProject } from "./projectsSlice";
import { IFile, removeFile } from "../files/filesSlice";
import { IAsset, removeAsset } from "../assets/assetsSlice";
import { IFolder, removeFolder } from "../folders/foldersSlice";
import { clearProjectSelection } from "../ui/uiSlice";

export const deleteProjectWithMainFile =
  (projectId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();

    const files = Object.values(state.files.byId).filter(
      (file) => (file as IFile).projectId === projectId
    );
    files.forEach((file) => dispatch(removeFile((file as IFile).id)));

    const assets = Object.values(state.assets.byId).filter(
      (asset) => (asset as IAsset).projectId === projectId
    );
    assets.forEach((asset) => dispatch(removeAsset((asset as IAsset).id)));

    const folders = state.folders.items.filter(
      (folder: IFolder) => folder.projectId === projectId
    );
    folders.forEach((folder: IFolder) => dispatch(removeFolder(folder.id)));

    dispatch(clearProjectSelection(projectId));
    dispatch(removeProject(projectId));
  };
