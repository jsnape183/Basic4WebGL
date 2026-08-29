import React, { useEffect, useRef, useState } from 'react';
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
import { useLiveAnalysis } from '../hooks/useLiveAnalysis';
import { useRunnerMessages } from '../hooks/useRunnerMessages';
import { useAutoSave } from '../hooks/useAutoSave';
import { SourceLocation } from '../lib/CompilerLib/compiler/types';
import TreePanel from '../components/TreePanel';
import ProjectShell, { FilesIcon, ExportIcon, TilemapIcon } from '../components/ProjectShell';
import { exportProject } from '../features/projects/exportProject';
import FileTabs from '../components/FileTabs';
import BottomPanel from '../components/BottomPanel';
import AssetPreview from '../components/AssetPreview';
import { getAssetType } from '../components/AssetPreview/getAssetType';
import TilemapChooserModal from '../components/TileMapEditor/TilemapChooserModal';

const EnterFullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </svg>
);

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
  const [jumpTarget, setJumpTarget] = useState<{ line: number; col: number } | null>(null);
  const [isTilemapModalOpen, setIsTilemapModalOpen] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  // Set by the fullscreen toggle when clicked before the game is running --
  // read once by the effect below when isRunning next flips true, so a run
  // started while pre-armed retargets fullscreen from the editor itself
  // onto the freshly-mounted preview iframe.
  const pendingFullscreenOnRunRef = useRef(false);

  const { run, stop, isRunning } = useCompiler(id ?? '');
  const { diagnostics, symbols } = useLiveAnalysis(id ?? '');
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      // Tracks ANY fullscreen target, not just one specific element -- this
      // same flag both drives the toggle's icon and, before a run starts,
      // doubles as "the next run should retarget fullscreen onto the game"
      // (see pendingFullscreenOnRunRef / handleRunClick below).
      setIsPreviewFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isRunning && pendingFullscreenOnRunRef.current) {
      pendingFullscreenOnRunRef.current = false;
      previewIframeRef.current?.requestFullscreen().catch((err) => {
        console.warn('Failed to enter fullscreen:', err);
      });
    }
  }, [isRunning]);

  // Regular file edits auto-save (see useAutoSave) and are never at risk on
  // navigation, but an asset like a tilemap only persists on an explicit
  // Save -- closing/refreshing the tab with a dirty one open would silently
  // lose it, so warn the browser's own way (custom messages are ignored by
  // modern browsers; setting returnValue/calling preventDefault is what
  // actually triggers its native "leave site?" prompt).
  useEffect(() => {
    if (dirtyAssetIds.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyAssetIds]);

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

  // Shared by every way of navigating away from the currently-open asset
  // (switching to a file tab, switching to a different asset tab, or
  // exporting the project) -- an asset like a tilemap only persists on an
  // explicit Save, so anything that would abandon or bypass unsaved edits
  // needs the same confirmation handleAssetTabClose already uses. Returns
  // false (and leaves dirtyAssetIds untouched) if the user declines, so the
  // caller can bail out before actually navigating away.
  const confirmDiscardActiveAsset = (): boolean => {
    if (activeAssetTabId && dirtyAssetIds.includes(activeAssetTabId)) {
      if (!window.confirm('Discard unsaved changes?')) return false;
      setDirtyAssetIds((prev) => prev.filter((entryId) => entryId !== activeAssetTabId));
    }
    return true;
  };

  const handleJumpToLoc = (loc: SourceLocation) => {
    const target = files.find((f) => f.name === loc.filename);
    if (!target) return;
    if (!confirmDiscardActiveAsset()) return;
    setActiveAssetTabId(null);
    dispatch(selectFile({ projectId: project.id, fileId: target.id }));
    setJumpTarget({ line: loc.line, col: loc.col });
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.warn('Failed to exit fullscreen:', err);
      });
    } else if (isRunning) {
      // Already running -- fullscreen the game itself directly, same as
      // this button always has.
      previewIframeRef.current?.requestFullscreen().catch((err) => {
        console.warn('Failed to enter fullscreen:', err);
      });
    } else {
      // Not running yet -- there's no preview iframe to fullscreen, so this
      // just fullscreens the editor itself. Clicking Run while this is
      // still active passes that along (see handleRunClick), which
      // retargets fullscreen onto the game once it mounts.
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Failed to enter fullscreen:', err);
      });
    }
  };

  const handleRunClick = () => {
    // Threads the fullscreen toggle's current state into the run: if the
    // editor is fullscreen because the toggle was armed before Run was
    // clicked, the effect watching isRunning picks this up and retargets
    // fullscreen onto the preview iframe once it mounts.
    pendingFullscreenOnRunRef.current = isPreviewFullscreen;
    run();
  };

  const handleTabSelect = (fileId: string) => {
    if (!confirmDiscardActiveAsset()) return;
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
    if (assetId !== activeAssetTabId && !confirmDiscardActiveAsset()) return;

    // The running preview and the Tile Map Editor can both be looking at the
    // same tilemap asset at once -- collision/tile edits made while a game
    // built from stale data keeps running underneath are confusing at best,
    // and the game just keeps ticking off-screen for no reason otherwise.
    const asset = allAssetsById[assetId];
    if (isRunning && asset && getAssetType(asset.name) === 'tilemap') {
      stop();
    }
    if (!openAssetTabs.some((t) => t.assetId === assetId)) {
      setOpenAssetTabs((prev) => [...prev, { assetId }]);
    }
    setActiveAssetTabId(assetId);
  };

  const handleAssetTabSelect = (assetId: string) => {
    if (assetId !== activeAssetTabId && !confirmDiscardActiveAsset()) return;
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
    <>
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
          <Link
            to="/demos"
            className="text-sm text-ds-text-muted hover:text-ds-text transition-colors mr-4"
          >
            Demos
          </Link>
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
              onClick={handleRunClick}
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
          content: (
            <TreePanel
              projectId={project.id}
              onOpenAsset={handleOpenAsset}
              onSelectFile={handleTabSelect}
            />
          ),
        },
        {
          id: 'export',
          icon: <ExportIcon />,
          ariaLabel: 'Export project',
          onAction: () => {
            // Export reads saved (Redux) content, not an asset's in-progress
            // draft -- unlike navigating away, nothing here is discarded, so
            // this warns without touching dirtyAssetIds; the tilemap editor
            // still shows the same unsaved changes afterward either way.
            if (dirtyAssetIds.length > 0 && !window.confirm(
              "You have unsaved changes that won't be included in this export. Export anyway?"
            )) {
              return;
            }
            dispatch(exportProject(project.id));
          },
        },
        {
          id: 'tilemap',
          icon: <TilemapIcon />,
          ariaLabel: 'Tilemap editor',
          onAction: () => setIsTilemapModalOpen(true),
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
                  diagnostics={diagnostics}
                  jumpTo={jumpTarget}
                  symbols={symbols}
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
            <Preview ref={previewIframeRef} transpiled={transpiled} projectId={project.id} />
          </ErrorBoundary>
        ) : undefined
      }
      previewHeaderActions={
        <button
          onClick={toggleFullscreen}
          className="text-ds-text-dim hover:text-ds-text transition-colors focus:outline-none focus:ring-2 focus:ring-ds-accent rounded"
          aria-label={isPreviewFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isPreviewFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isPreviewFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
        </button>
      }
      panel={<BottomPanel logs={logs} onJumpToLoc={handleJumpToLoc} />}
      footer={
        <>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 2 · UTF-8 · LF</span>
        </>
      }
    />
    <TilemapChooserModal
      projectId={project.id}
      isOpen={isTilemapModalOpen}
      onClose={() => setIsTilemapModalOpen(false)}
      onOpenAsset={handleOpenAsset}
    />
    </>
  );
};

export default EditPage;
