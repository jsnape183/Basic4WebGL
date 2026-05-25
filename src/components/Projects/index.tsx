// src/components/Projects/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { createProjectWithMainFile } from '../../features/projects/createProjectWithMainFile';
import { deleteProjectWithMainFile } from '../../features/projects/deleteProjectAndFiles';
import { Project } from '../../features/projects/projectsSlice';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { useAssetsForProject } from '../../hooks/useAssetsForProject';

const ACCENT_SHADES = [
  '#5050cc', '#7050cc', '#3060aa', '#6040bb', '#4050dd', '#5070bb',
];

function projectAccent(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENT_SHADES[sum % ACCENT_SHADES.length];
}

const ProjectCard: React.FC<{ project: Project; onRemove: (id: string) => void }> = ({
  project,
  onRemove,
}) => {
  const files = useFilesForProject(project.id);
  const assets = useAssetsForProject(project.id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const deleteInputRef = useRef<HTMLInputElement>(null);

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
      {deleteModal}
      <div className="relative group bg-ds-surface border border-ds-border rounded-xl overflow-hidden hover:border-ds-accent transition-colors">
        {/* Accent stripe */}
        <div className="h-1" style={{ background: projectAccent(project.id) }} />
        <div className="p-4">
          <h3 className="font-semibold text-ds-text text-base mb-1 truncate">{project.name}</h3>
          <p className="text-ds-text-muted text-xs">
            {files.length} {files.length === 1 ? 'file' : 'files'}
            {assets.length > 0 && (
              <> &middot; {assets.length} {assets.length === 1 ? 'asset' : 'assets'}</>
            )}
          </p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-border-subtle">
            <Link
              to={`/projects/${project.id}/edit`}
              className="text-ds-accent-btn-text bg-ds-accent-btn text-xs font-semibold px-3 py-1.5 rounded hover:opacity-90 transition"
            >
              Open →
            </Link>
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
    </>
  );
};

const ProjectList: React.FC = () => {
  const projects = useSelector((state: RootState) => state.projects.items);
  const dispatch = useDispatch<AppDispatch>();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 0);
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

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
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
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

  return (
    <>
      {modal}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ds-text">My Projects</h1>
          <p className="text-ds-text-muted text-sm mt-0.5">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4 opacity-20">📁</div>
          <p className="text-ds-text-muted mb-4">No projects yet.</p>
          <button
            onClick={openModal}
            className="bg-ds-accent-btn text-ds-accent-btn-text text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition"
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
