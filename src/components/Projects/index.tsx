// src/components/ProjectList.tsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { RootState, AppDispatch } from "../../store";
import { createProjectWithMainFile } from "../../features/projects/createProjectWithMainFile";
import { deleteProjectWithMainFile } from "../../features/projects/deleteProjectAndFiles";
import { Project } from "../../features/projects/projectsSlice";

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Projects</h2>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          + Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-600 text-center">No projects added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl shadow-md p-4 border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-blue-600 hover:underline">
                <Link to={`/projects/${project.id}/edit`}>{project.name}</Link>
              </h3>

              <button
                onClick={() => handleRemove(project.id)}
                className="mt-4 text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
