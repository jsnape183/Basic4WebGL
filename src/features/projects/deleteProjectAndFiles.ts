import { AppDispatch, RootState } from "../../store";
import { removeProject } from "./projectsSlice";
import { IFile, removeFile } from "../files/filesSlice";
import { IAsset, removeAsset } from "../assets/assetsSlice";
import { removeFolder } from '../folders/foldersSlice';
import { clearProjectSelection } from "../ui/uiSlice";
import { deleteAssetBlobs } from "../../lib/storage/assetBlobStore";

export const deleteProjectWithMainFile =
  (projectId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();

    const files = Object.values(state.files.byId).filter(
      (file) => (file as IFile).projectId === projectId
    );
    files.forEach((file) => dispatch(removeFile((file as IFile).id)));

    const assetIds = Object.values(state.assets.byId)
      .filter((asset) => (asset as IAsset).projectId === projectId)
      .map((asset) => (asset as IAsset).id);
    assetIds.forEach((id) => dispatch(removeAsset(id)));

    const folders = state.folders.items.filter(
      (folder) => folder.projectId === projectId
    );
    folders.forEach((folder) => dispatch(removeFolder(folder.id)));

    dispatch(clearProjectSelection(projectId));
    dispatch(removeProject(projectId));

    // Blob cleanup is fire-after: the read side already tolerates orphaned blobs,
    // so the UI updates immediately and this just reclaims quota.
    await deleteAssetBlobs(assetIds);
  };
