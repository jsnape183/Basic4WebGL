import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { clearAllDirty } from '../features/files/filesSlice';

/**
 * Watches dirtyFileIds and clears them 500ms after the last updateFile dispatch.
 * Call this once at the EditPage level.
 */
export const useAutoSave = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dirtyFileIds = useSelector((state: RootState) => state.files.dirtyFileIds);

  useEffect(() => {
    if (dirtyFileIds.length === 0) return;
    const timer = setTimeout(() => {
      dispatch(clearAllDirty());
    }, 500);
    return () => clearTimeout(timer);
  }, [dirtyFileIds, dispatch]);
};
