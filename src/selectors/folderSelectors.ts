import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const makeSelectFoldersBySection = (projectId: string, section: 'files' | 'assets') =>
  createSelector(
    (state: RootState) => state.folders.items,
    (items) => items.filter((f) => f.projectId === projectId && (f.section ?? 'files') === section)
  );
