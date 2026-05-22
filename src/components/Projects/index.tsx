// src/components/Projects/index.tsx
import React from 'react';
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

  return (
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
            onClick={() => onRemove(project.id)}
            className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error text-xs transition-opacity"
            aria-label={`Delete project ${project.name}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectList: React.FC = () => {
  const projects = useSelector((state: RootState) => state.projects.items);
  const dispatch = useDispatch<AppDispatch>();

  const handleAdd = () => {
    dispatch(createProjectWithMainFile(`Project ${projects.length + 1}`));
  };

  const handleRemove = (id: string) => {
    dispatch(deleteProjectWithMainFile(id));
  };

  return (
    <>
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
            onClick={handleAdd}
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
            onClick={handleAdd}
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
