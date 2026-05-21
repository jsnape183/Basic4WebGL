import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { Project } from '../features/projects/projectsSlice';
import { AppDispatch, RootState } from '../store';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import { useProjectForBuild } from '../hooks/useProjectForBuild';
import Basic4WebGL from '../lib/Basic4WebGL';
import { projectLib } from '../constants/projectLib';
import {
  addLog,
  clearLogs,
  setTranspiled,
  setIsRunning,
} from '../features/session/sessionSlice';
import { LogItem, LogItemType } from '../Types/LogItem';
import TreePanel from '../components/TreePanel';

const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const project = useSelector((state: RootState) =>
    state.projects.items.find((p: Project) => p.id === id)
  );
  const transpiled = useSelector((state: RootState) => state.session.transpiled);
  const isRunning = useSelector((state: RootState) => state.session.isRunning);

  // Hooks must be called unconditionally — above early return
  const selectedFile = useSelectedFile(id ?? '');
  const buildProject = useProjectForBuild(id ?? '', projectLib);

  useEffect(() => {
    if (!project?.id) {
      if (location.key !== 'default') {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  }, [project, navigate, location]);

  if (!project) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center text-red-600">
        <p>Project not found.</p>
      </div>
    );
  }

  const handleChange = (source: string | undefined) => {
    if (source && selectedFile) {
      dispatch(updateFile({ ...selectedFile, source }));
    }
  };

  const handleRun = () => {
    dispatch(clearLogs());
    dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' } as LogItem));

    const result = Basic4WebGL.transpile(buildProject);

    if (result.diagnostics.length > 0) {
      result.diagnostics.forEach((d) => {
        const locStr = d.loc
          ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
          : '';
        dispatch(addLog({ type: LogItemType.Error, text: d.message + locStr } as LogItem));
      });
      dispatch(setTranspiled(''));
    } else {
      dispatch(addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' } as LogItem));
      dispatch(setTranspiled(result.code!));
      dispatch(setIsRunning(true));
    }
  };

  const handleStop = () => {
    dispatch(setIsRunning(false));
    dispatch(clearLogs());
    dispatch(setTranspiled(''));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <header className="h-12 px-4 flex items-center justify-between bg-gray-800 shadow">
        <div className="text-lg font-bold">softBASIC</div>
        {!isRunning ? (
          <button
            onClick={handleRun}
            className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            Run
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            Stop
          </button>
        )}
      </header>
      <div className="flex flex-1 overflow-hidden">
        <TreePanel projectId={project.id} />
        <main
          className={`flex-1 bg-gray-900 ${
            isRunning ? 'w-1/2' : 'w-full'
          } transition-all duration-300`}
        >
          <Editor onChange={handleChange} file={selectedFile} height="90vh" />
        </main>
        {isRunning && (
          <Preview transpiled={transpiled} projectId={project.id} />
        )}
      </div>
      <footer className="h-8 px-4 bg-gray-800 text-xs text-gray-400 flex items-center justify-between">
        <span>Ln 1, Col 1</span>
        <span>Spaces: 2 | UTF-8 | LF</span>
      </footer>
    </div>
  );
};

export default EditPage;
