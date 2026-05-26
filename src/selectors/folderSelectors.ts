import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Returns a memoized selector for folders belonging to a project and section.
 * Wrap in useMemo to keep the selector instance stable across renders.
 *
 * Legacy persisted folders without a `section` field default to 'files'.
 */
export const makeSelectFoldersBySection = (projectId: string, section: 'files' | 'assets') =>
  createSelector(
    (state: RootState) => state.folders.items,
    (items) => items.filter((f) => f.projectId === projectId && (f.section ?? 'files') === section)
  );
