import { useSelector } from "react-redux";
import { RootState } from "../store";
import { IAsset } from "../features/assets/assetsSlice";

export const useAssetsForProject = (projectId: string): IAsset[] => {
  return useSelector((state: RootState) =>
    Object.values(state.assets.byId).filter(
      (asset) => (asset as IAsset).projectId === projectId
    )
  ) as Array<IAsset>;
};
