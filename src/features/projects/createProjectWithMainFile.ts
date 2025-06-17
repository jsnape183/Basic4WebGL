import { AppDispatch } from "../../store";
import { v4 as uuidv4 } from "uuid";
import { addProject } from "./projectsSlice";
import { addFile } from "../files/filesSlice";

export const createProjectWithMainFile =
  (name: string) => (dispatch: AppDispatch) => {
    const projectId = uuidv4();
    const mainFileId = uuidv4();

    dispatch(
      addProject({
        id: projectId,
        name,
        fileIds: [mainFileId],
      })
    );

    dispatch(
      addFile({
        id: mainFileId,
        name: "Main.bas",
        source: "",
        projectId: projectId,
      })
    );
  };
