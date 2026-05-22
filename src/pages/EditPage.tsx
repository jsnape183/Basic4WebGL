import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile, removeFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { useFilesForProject } from '../hooks/useFilesForProject';
import { selectFile } from '../features/ui/uiSlice';
import { Project } from '../features/projects/projectsSlice';
import { AppDispatch, RootState } from '../store';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import ErrorBoundary from '../components/ErrorBoundary';
import { useCompiler } from '../hooks/useCompiler';
import { useRunnerMessages } from '../hooks/useRunnerMessages';
import { useAutoSave } from '../hooks/useAutoSave';
import TreePanel from '../components/TreePanel';
import ProjectShell, { FilesIcon } from '../components/ProjectShell';
import FileTabs from '../components/FileTabs';
import BottomPanel from '../components/BottomPanel';

const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const project = useSelector((state: RootState) =>
    state.projects.items.find((p: Project) => p.id === id)
  );
  const transpiled = useSelector((state: RootState) => state.session.transpiled);
  const logs = useSelector((state: RootState) => state.session.logs);
  const dirtyFileIds = useSelector((state: RootState) => state.files.dirtyFileIds);

  const { run, stop, isRunning } = useCompiler(id ?? '');
  useRunnerMessages();
  useAutoSave();

  // Hooks must be called unconditionally — above early return
  const selectedFile = useSelectedFile(id ?? '');
  const files = useFilesForProject(id ?? '');

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
      <div className="min-h-screen bg-ds-bg flex items-center justify-center text-ds-error text-sm">
        Project not found.
      </div>
    );
  }

  const handleChange = (source: string | undefined) => {
    if (source && selectedFile) {
      dispatch(updateFile({ ...selectedFile, source }));
    }
  };

  const handleTabSelect = (fileId: string) => {
    dispatch(selectFile({ projectId: project.id, fileId }));
  };

  const handleTabClose = (fileId: string) => {
    dispatch(removeFile(fileId));
  };

  return (
    <ProjectShell
      header={
        <>
          <span className="font-bold text-sm text-ds-accent-btn-text tracking-wide mr-3">
            softBASIC
          </span>
          <span className="text-ds-text-dim text-sm">{project.name}</span>
          {selectedFile && (
            <>
              <span className="text-ds-text-dim mx-1.5 text-sm">›</span>
              <span className="text-ds-text-muted text-sm">{selectedFile.name}</span>
            </>
          )}
          <div className="flex-1" />
          {!isRunning ? (
            <button
              onClick={run}
              className="bg-ds-accent-btn text-ds-accent-btn-text text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ds-accent"
              aria-label="Run project"
            >
              ▶ Run
            </button>
          ) : (
            <button
              onClick={stop}
              className="border border-ds-error text-ds-error text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-ds-error-bg transition focus:outline-none focus:ring-2 focus:ring-ds-error"
              aria-label="Stop project"
            >
              ■ Stop
            </button>
          )}
        </>
      }
      activitySections={[
        {
          id: 'files',
          icon: <FilesIcon />,
          ariaLabel: 'Files',
          content: <TreePanel projectId={project.id} />,
        },
      ]}
      editor={
        <ErrorBoundary
          key={project.id}
          fallback={<p className="p-4 text-ds-error text-sm">Editor failed to load.</p>}
        >
          <div className="flex flex-col h-full">
            <FileTabs
              files={files}
              selectedFileId={selectedFile?.id}
              dirtyFileIds={dirtyFileIds}
              onSelect={handleTabSelect}
              onClose={handleTabClose}
            />
            <div className="flex-1 min-h-0">
              <Editor onChange={handleChange} file={selectedFile} height="100%" />
            </div>
          </div>
        </ErrorBoundary>
      }
      preview={
        isRunning ? (
          <ErrorBoundary
            key={project.id}
            fallback={<p className="p-4 text-ds-error text-sm">Preview failed to load.</p>}
          >
            <Preview transpiled={transpiled} projectId={project.id} />
          </ErrorBoundary>
        ) : undefined
      }
      panel={<BottomPanel logs={logs} />}
      footer={
        <>
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2 · UTF-8 · LF</span>
        </>
      }
    />
  );
};

export default EditPage;
