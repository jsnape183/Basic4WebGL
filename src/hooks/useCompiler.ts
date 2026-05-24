import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  addLog,
  clearLogs,
  setTranspiled,
  setIsRunning,
} from '../features/session/sessionSlice';
import { LogItemType } from '../Types/LogItem';
import Basic4WebGL from '../lib/Basic4WebGL';
import { useProjectForBuild } from './useProjectForBuild';

export const useCompiler = (projectId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const buildProject = useProjectForBuild(projectId);
  const isRunning = useSelector((state: RootState) => state.session.isRunning);

  const run = () => {
    dispatch(clearLogs());
    dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' }));

    const result = Basic4WebGL.transpile(buildProject);

    if (result.diagnostics.length > 0) {
      result.diagnostics.forEach((d) => {
        const locStr = d.loc
          ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
          : '';
        dispatch(addLog({ type: LogItemType.Error, text: d.message + locStr }));
      });
      dispatch(setIsRunning(false));
      dispatch(setTranspiled(''));
    } else {
      dispatch(addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' }));
      dispatch(setTranspiled(result.code!));
      dispatch(setIsRunning(true));
    }
  };

  const stop = () => {
    dispatch(setIsRunning(false));
    dispatch(clearLogs());
    dispatch(setTranspiled(''));
  };

  return { run, stop, isRunning };
};
