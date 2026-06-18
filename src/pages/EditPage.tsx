import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateFile } from '../features/files/filesSlice';
import useSelectedFile from '../features/ui/useSelectedFile';
import { useAllFilesForProject } from '../hooks/useAllFilesForProject';
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
import ProjectShell, { FilesIcon, ExportIcon } from '../components/ProjectShell';
import { exportProject } from '../features/projects/exportProject';
import FileTabs from '../components/FileTabs';
import BottomPanel from '../components/BottomPanel';
import AssetPreview from '../components/AssetPreview';

type AssetTabEntry = { assetId: string };

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
  const allAssetsById = useSelector((state: RootState) => state.assets.byId);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [openAssetTabs, setOpenAssetTabs] = useState<AssetTabEntry[]>([]);
  const [activeAssetTabId, setActiveAssetTabId] = useState<string | null>(null);
  const [dirtyAssetIds, setDirtyAssetIds] = useState<string[]>([]);

  const { run, stop, isRunning } = useCompiler(id ?? '');
  useRunnerMessages(id);
  useAutoSave();

  // Hooks must be called unconditionally — above early return
  const selectedFile = useSelectedFile(id ?? '');
  const files = useAllFilesForProject(id ?? '');

  // Track which file tabs are open (all files open by default; closing a tab hides it without deleting)
  const [openFileIds, setOpenFileIds] = useState<string[]>(() => files.map(f => f.id));

  // Auto-open newly created files
  useEffect(() => {
    setOpenFileIds(prev => {
      const newIds = files.map(f => f.id).filter(fid => !prev.includes(fid));
      return newIds.length > 0 ? [...prev, ...newIds] : prev;
    });
  }, [files]);

  useEffect(() => {
    if (!project?.id) {
      if (location.key !== 'default') {
        navigate(-1);
      } else {
        navigate('/projects');
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
    setActiveAssetTabId(null);
    dispatch(selectFile({ projectId: project.id, fileId }));
  };

  const handleTabClose = (fileId: string) => {
    // Switch selection to an adjacent tab before closing
    if (selectedFile?.id === fileId) {
      const currentIndex = openFileIds.indexOf(fileId);
      const remaining = openFileIds.filter(fid => fid !== fileId);
      const nextId = remaining[currentIndex] ?? remaining[currentIndex - 1];
      if (nextId) dispatch(selectFile({ projectId: project.id, fileId: nextId }));
    }
    setOpenFileIds(prev => prev.filter(fid => fid !== fileId));
  };

  const handleOpenAsset = (assetId: string) => {
    if (!openAssetTabs.some((t) => t.assetId === assetId)) {
      setOpenAssetTabs((prev) => [...prev, { assetId }]);
    }
    setActiveAssetTabId(assetId);
  };

  const handleAssetTabSelect = (assetId: string) => {
    setActiveAssetTabId(assetId);
  };

  const handleAssetTabClose = (assetId: string) => {
    if (dirtyAssetIds.includes(assetId)) {
      if (!window.confirm('Discard unsaved changes?')) return;
    }
    setOpenAssetTabs((prev) => prev.filter((t) => t.assetId !== assetId));
    setDirtyAssetIds((prev) => prev.filter((entryId) => entryId !== assetId));
    if (activeAssetTabId === assetId) {
      setActiveAssetTabId(null);
    }
  };

  const handleAssetDirtyChange = (assetId: string, dirty: boolean) => {
    setDirtyAssetIds((prev) =>
      dirty
        ? prev.includes(assetId) ? prev : [...prev, assetId]
        : prev.filter((entryId) => entryId !== assetId)
    );
  };

  const openFiles = files.filter(f => openFileIds.includes(f.id));

  const assetTabDescriptors = openAssetTabs.map((t) => ({
    id: t.assetId,
    name: allAssetsById[t.assetId]?.name ?? 'Unknown',
  }));

  const activeAsset = activeAssetTabId ? allAssetsById[activeAssetTabId] : undefined;

  return (
    <ProjectShell
      header={
        <>
          <Link
            to="/projects"
            className="mr-2 text-ds-text-dim hover:text-ds-text-muted transition-colors text-lg leading-none"
            aria-label="Back to projects"
            title="Back to projects"
          >
            ‹
          </Link>
          <Link to="/" className="font-bold text-sm text-gradient-accent tracking-wide mr-3 hover:opacity-80 transition-opacity">
            softBASIC
          </Link>
          <span className="text-ds-text-dim text-sm">{project.name}</span>
          {selectedFile && (
            <>
              <span className="text-ds-text-dim mx-1.5 text-sm">›</span>
              <span className="text-ds-text-muted text-sm">{selectedFile.name}</span>
            </>
          )}
          <div className="flex-1" />
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ds-text-muted hover:text-ds-text transition-colors mr-2"
          >
            Docs
          </a>
          {!isRunning ? (
            <button
              onClick={run}
              className="bg-accent-gradient text-white text-sm font-semibold px-4 py-1.5 rounded-md hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-ds-accent"
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
          content: <TreePanel projectId={project.id} onOpenAsset={handleOpenAsset} />,
        },
        {
          id: 'export',
          icon: <ExportIcon />,
          ariaLabel: 'Export project',
          onAction: () => dispatch(exportProject(project.id)),
        },
      ]}
      editor={
        <ErrorBoundary
          key={project.id}
          fallback={<p className="p-4 text-ds-error text-sm">Editor failed to load.</p>}
        >
          <div className="flex flex-col h-full">
            <FileTabs
              files={openFiles}
              selectedFileId={activeAssetTabId ? undefined : selectedFile?.id}
              dirtyFileIds={dirtyFileIds}
              onSelect={handleTabSelect}
              onClose={handleTabClose}
              assetTabs={assetTabDescriptors}
              selectedAssetTabId={activeAssetTabId ?? undefined}
              dirtyAssetIds={dirtyAssetIds}
              onSelectAsset={handleAssetTabSelect}
              onCloseAsset={handleAssetTabClose}
            />
            <div className="flex-1 min-h-0">
              {activeAssetTabId && activeAsset ? (
                <AssetPreview
                  asset={activeAsset}
                  onDirtyChange={handleAssetDirtyChange}
                />
              ) : (
                <Editor
                  onChange={handleChange}
                  file={selectedFile}
                  height="100%"
                  onCursorChange={(line, col) => setCursorPos({ line, col })}
                />
              )}
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
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 2 · UTF-8 · LF</span>
        </>
      }
    />
  );
};

export default EditPage;
