import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { Project } from '../features/projects/projectsSlice';
import { AppDispatch, RootState } from '../store';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import ErrorBoundary from '../components/ErrorBoundary';
import { useCompiler } from '../hooks/useCompiler';
import TreePanel from '../components/TreePanel';
import ProjectShell from '../components/ProjectShell';

const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const project = useSelector((state: RootState) =>
    state.projects.items.find((p: Project) => p.id === id)
  );
  const transpiled = useSelector((state: RootState) => state.session.transpiled);

  const { run, stop, isRunning } = useCompiler(id ?? '');

  // Hooks must be called unconditionally — above early return
  const selectedFile = useSelectedFile(id ?? '');

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

  return (
    <ProjectShell
      header={
        <>
          <div className="text-lg font-bold">softBASIC</div>
          {!isRunning ? (
            <button
              onClick={run}
              className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              Run
            </button>
          ) : (
            <button
              onClick={stop}
              className="text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              Stop
            </button>
          )}
        </>
      }
      sidebar={<TreePanel projectId={project.id} />}
      editor={
        <ErrorBoundary
          key={project.id}
          fallback={<p className="p-4 text-red-400">Editor failed to load.</p>}
        >
          <Editor onChange={handleChange} file={selectedFile} height="90vh" />
        </ErrorBoundary>
      }
      preview={
        isRunning ? (
          <ErrorBoundary
            key={project.id}
            fallback={<p className="p-4 text-red-400">Preview failed to load.</p>}
          >
            <Preview transpiled={transpiled} projectId={project.id} />
          </ErrorBoundary>
        ) : undefined
      }
      footer={
        <>
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2 | UTF-8 | LF</span>
        </>
      }
    />
  );
};

export default EditPage;
