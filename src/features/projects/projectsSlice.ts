import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Project {
  id: string;
  name: string;
  packageIds: string[];
}

export interface ProjectsState {
  items: Project[];
}

const initialState: ProjectsState = {
  items: [],
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    addProject: (state, action: PayloadAction<Project>) => {
      state.items.push(action.payload);
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    addPackageToProject: (
      state,
      action: PayloadAction<{ projectId: string; packageId: string }>
    ) => {
      const project = state.items.find((p) => p.id === action.payload.projectId);
      if (!project) return;
      // Migration: projects persisted before this field was added
      if (!project.packageIds) {
        project.packageIds = ['softcore', 'softgfx'];
      }
      if (!project.packageIds.includes(action.payload.packageId)) {
        project.packageIds.push(action.payload.packageId);
      }
    },
    removePackageFromProject: (
      state,
      action: PayloadAction<{ projectId: string; packageId: string }>
    ) => {
      const project = state.items.find((p) => p.id === action.payload.projectId);
      if (!project) return;
      if (!project.packageIds) {
        project.packageIds = ['softcore', 'softgfx'];
      }
      project.packageIds = project.packageIds.filter(
        (id) => id !== action.payload.packageId
      );
    },
    renameProject: (
      state,
      action: PayloadAction<{ projectId: string; name: string }>
    ) => {
      const project = state.items.find((p) => p.id === action.payload.projectId);
      if (!project) return;
      project.name = action.payload.name;
    },
  },
});

export const {
  addProject,
  removeProject,
  addPackageToProject,
  removePackageFromProject,
  renameProject,
} = projectsSlice.actions;
export default projectsSlice.reducer;
