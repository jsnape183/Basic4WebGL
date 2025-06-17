import type { ProjectsState } from "../features/projects/projectsSlice";
import type { FilesState } from "../features/files/filesSlice";
import type { UIState } from "../features/ui/uiSlice";

export interface AppState {
  projects: ProjectsState;
  files: FilesState;
  ui: UIState;
}
