// src/components/Projects/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { createProjectWithMainFile } from '../../features/projects/createProjectWithMainFile';
import { deleteProjectWithMainFile } from '../../features/projects/deleteProjectAndFiles';
import { exportProject, ProjectExportJson } from '../../features/projects/exportProject';
import { importProject } from '../../features/projects/importProject';
import { Project, renameProject, setProjectDescription } from '../../features/projects/projectsSlice';
import { useAllFilesForProject } from '../../hooks/useAllFilesForProject';
import { useAssetsForProject } from '../../hooks/useAssetsForProject';

const CardMarkdown: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <span className="block text-xs text-ds-text-muted leading-snug">{children}</span>,
      strong: ({ children }) => <strong className="font-semibold text-ds-text">{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      a: ({ children }) => <span className="text-ds-accent">{children}</span>,
      code: ({ children }) => <code className="font-mono text-ds-accent">{children}</code>,
      h1: ({ children }) => <span className="block font-bold text-ds-text text-xs">{children}</span>,
      h2: ({ children }) => <span className="block font-semibold text-ds-text text-xs">{children}</span>,
      h3: ({ children }) => <span className="block font-semibold text-ds-text text-xs">{children}</span>,
      ul: ({ children }) => <span className="block">{children}</span>,
      ol: ({ children }) => <span className="block">{children}</span>,
      li: ({ children }) => <span className="block text-xs text-ds-text-muted">{children}</span>,
    }}
  >
    {content}
  </ReactMarkdown>
);

function descriptionSnippet(desc: string): string {
  return desc.length > 100 ? desc.slice(0, 100) + '…' : desc;
}

const ACCENT_SHADES = [
  '#f5576c', '#f06292', '#f093fb', '#e040a0', '#f4436c', '#e91e8c',
];

function projectAccent(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_SHADES[sum % ACCENT_SHADES.length];
}

const ProjectCard: React.FC<{ project: Project; onRemove: (id: string) => void }> = ({
  project,
  onRemove,
}) => {
  const files = useAllFilesForProject(project.id);
  const assets = useAssetsForProject(project.id);
  const dispatch = useDispatch<AppDispatch>();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const deleteInputRef = useRef<HTMLInputElement>(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [showDescModal, setShowDescModal] = useState(false);
  const [descText, setDescText] = useState('');
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const openDeleteModal = () => {
    setConfirmName('');
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (confirmName !== project.name) return;
    onRemove(project.id);
    setShowDeleteModal(false);
  };

  useEffect(() => {
    if (showDeleteModal) setTimeout(() => deleteInputRef.current?.focus(), 0);
  }, [showDeleteModal]);

  useEffect(() => {
    if (!showDeleteModal) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDeleteModal(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showDeleteModal]);

  const openRenameModal = () => {
    setNewName(project.name);
    setShowRenameModal(true);
  };

  const handleRename = () => {
    const name = newName.trim();
    if (!name || name === project.name) return;
    dispatch(renameProject({ projectId: project.id, name }));
    setShowRenameModal(false);
  };

  useEffect(() => {
    if (showRenameModal) setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
  }, [showRenameModal]);

  useEffect(() => {
    if (!showRenameModal) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowRenameModal(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showRenameModal]);

  const openDescModal = () => {
    setDescText(project.description ?? '');
    setShowDescModal(true);
  };

  const handleDescSave = () => {
    dispatch(setProjectDescription({ projectId: project.id, description: descText }));
    setShowDescModal(false);
  };

  useEffect(() => {
    if (showDescModal) setTimeout(() => descTextareaRef.current?.focus(), 0);
  }, [showDescModal]);

  useEffect(() => {
    if (!showDescModal) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDescModal(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showDescModal]);

  const descModal = showDescModal
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDescModal(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="desc-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-md shadow-xl"
          >
            <h2 id="desc-modal-title" className="text-ds-text text-lg font-semibold mb-1">
              Edit description
            </h2>
            <p className="text-ds-text-dim text-xs mb-3">Supports markdown</p>
            <textarea
              ref={descTextareaRef}
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              placeholder="Describe this project…"
              rows={6}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4 resize-y font-mono"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDescSave}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowDescModal(false)}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const renameModal = showRenameModal
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRenameModal(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-project-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="rename-project-modal-title" className="text-ds-text text-lg font-semibold mb-4">
              Rename project
            </h2>
            <input
              ref={renameInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
              placeholder="Project name"
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={handleRename}
                disabled={!newName.trim() || newName.trim() === project.name}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Rename
              </button>
              <button
                onClick={() => setShowRenameModal(false)}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const deleteModal = showDeleteModal
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="delete-project-modal-title" className="text-ds-text text-lg font-semibold mb-2">
              Delete project
            </h2>
            <p className="text-ds-text-muted text-sm mb-4">
              This will permanently delete <span className="text-ds-text font-medium">{project.name}</span> and all its files. Type the project name to confirm.
            </p>
            <input
              ref={deleteInputRef}
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDelete(); }}
              placeholder={project.name}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDelete}
                disabled={confirmName !== project.name}
                className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {descModal}
      {renameModal}
      {deleteModal}
      <div className="relative group bg-ds-surface border border-ds-border rounded-xl overflow-hidden hover:border-ds-accent transition-colors">
        {/* Accent stripe */}
        <div className="h-1" style={{ background: projectAccent(project.id) }} />
        <div className="p-4">
          <div className="flex items-center gap-1 mb-1">
            <h3 className="font-semibold text-ds-text text-base truncate">{project.name}</h3>
            <button
              onClick={openRenameModal}
              className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text transition-opacity flex-shrink-0 p-0.5"
              aria-label={`Rename project ${project.name}`}
              title="Rename"
            >
              ✏️
            </button>
          </div>
          <p className="text-ds-text-muted text-xs mb-2">
            {files.length} {files.length === 1 ? 'file' : 'files'}
            {assets.length > 0 && (
              <> &middot; {assets.length} {assets.length === 1 ? 'asset' : 'assets'}</>
            )}
          </p>
          {project.description ? (
            <div className="flex items-start gap-1 min-h-[2.5rem]">
              <div className="flex-1 min-w-0">
                <CardMarkdown content={descriptionSnippet(project.description)} />
              </div>
              <button
                onClick={openDescModal}
                className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text transition-opacity flex-shrink-0 p-0.5 mt-0.5"
                aria-label="Edit description"
                title="Edit description"
              >
                ✏️
              </button>
            </div>
          ) : (
            <button
              onClick={openDescModal}
              className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text-muted text-xs transition-opacity block"
              aria-label="Add description"
            >
              + Add description…
            </button>
          )}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-border-subtle">
            <Link
              to={`/projects/${project.id}/edit`}
              className="text-white bg-accent-gradient text-xs font-semibold px-3 py-1.5 rounded hover:opacity-90 transition"
            >
              Open →
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(exportProject(project.id))}
                className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text-muted text-xs transition-opacity"
                aria-label={`Export project ${project.name}`}
              >
                Export
              </button>
              <button
                onClick={openDeleteModal}
                className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error text-xs transition-opacity"
                aria-label={`Delete project ${project.name}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ProjectList: React.FC = () => {
  const projects = useSelector((state: RootState) => state.projects.items);
  const dispatch = useDispatch<AppDispatch>();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importPendingJson, setImportPendingJson] = useState<ProjectExportJson | null>(null);
  const [showImportOverwriteModal, setShowImportOverwriteModal] = useState(false);
  const [importConfirmName, setImportConfirmName] = useState('');
  const importOverwriteInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setNewName('');
    setShowModal(true);
  };

  const handleConfirm = () => {
    const name = newName.trim();
    if (!name) return;
    dispatch(createProjectWithMainFile(name));
    setShowModal(false);
  };

  const handleRemove = (id: string) => {
    dispatch(deleteProjectWithMainFile(id));
  };

  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!importInputRef.current) return;
    importInputRef.current.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let json: ProjectExportJson;
      try {
        json = JSON.parse(event.target?.result as string) as ProjectExportJson;
      } catch {
        alert('Invalid file: not valid JSON');
        return;
      }
      if (json.version !== 1) {
        alert('Unsupported export version');
        return;
      }
      const existing = projects.find((p) => p.name === json.project.name);
      if (existing) {
        setImportPendingJson(json);
        setImportConfirmName('');
        setShowImportOverwriteModal(true);
      } else {
        dispatch(importProject(json));
      }
    };
    reader.readAsText(file);
  };

  const handleImportOverwrite = () => {
    if (!importPendingJson || importConfirmName !== importPendingJson.project.name) return;
    const existing = projects.find((p) => p.name === importPendingJson.project.name);
    if (existing) dispatch(deleteProjectWithMainFile(existing.id));
    dispatch(importProject(importPendingJson));
    setShowImportOverwriteModal(false);
    setImportPendingJson(null);
    setImportConfirmName('');
  };

  const handleImportOverwriteCancel = () => {
    setShowImportOverwriteModal(false);
    setImportPendingJson(null);
    setImportConfirmName('');
  };

  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 0);
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

  useEffect(() => {
    if (showImportOverwriteModal) setTimeout(() => importOverwriteInputRef.current?.focus(), 0);
  }, [showImportOverwriteModal]);

  useEffect(() => {
    if (!showImportOverwriteModal) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleImportOverwriteCancel(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showImportOverwriteModal]);

  const modal = showModal
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="new-project-modal-title" className="text-ds-text text-lg font-semibold mb-4">
              New project
            </h2>
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              placeholder="Project name"
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={handleConfirm}
                disabled={!newName.trim()}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const importOverwriteModal = showImportOverwriteModal && importPendingJson
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) handleImportOverwriteCancel(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-overwrite-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="import-overwrite-modal-title" className="text-ds-text text-lg font-semibold mb-2">
              Overwrite project
            </h2>
            <p className="text-ds-text-muted text-sm mb-4">
              A project named <span className="text-ds-text font-medium">{importPendingJson.project.name}</span> already exists. This will replace all its files and assets. Type the project name to confirm.
            </p>
            <input
              ref={importOverwriteInputRef}
              type="text"
              value={importConfirmName}
              onChange={(e) => setImportConfirmName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleImportOverwrite(); }}
              placeholder={importPendingJson.project.name}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={handleImportOverwrite}
                disabled={importConfirmName !== importPendingJson.project.name}
                className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import & Overwrite
              </button>
              <button
                onClick={handleImportOverwriteCancel}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {modal}
      {importOverwriteModal}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFileSelected}
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ds-text">My Projects</h1>
          <p className="text-ds-text-muted text-sm mt-0.5">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <button
          onClick={() => importInputRef.current?.click()}
          className="text-ds-text-dim hover:text-ds-text-muted text-sm transition-colors"
          aria-label="Import project"
        >
          Import
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4 opacity-20">📁</div>
          <p className="text-ds-text-muted mb-4">No projects yet.</p>
          <button
            onClick={openModal}
            className="bg-accent-gradient text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} onRemove={handleRemove} />
          ))}
          {/* New project dashed slot */}
          <button
            onClick={openModal}
            className="border-2 border-dashed border-ds-border rounded-xl p-4 flex flex-col items-center justify-center min-h-[108px] text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted transition-colors"
            aria-label="Create new project"
          >
            <span className="text-3xl leading-none mb-1">+</span>
            <span className="text-xs">New project</span>
          </button>
        </div>
      )}
    </>
  );
};

export default ProjectList;
