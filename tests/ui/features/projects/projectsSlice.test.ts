import { configureStore } from '@reduxjs/toolkit';
import projectsReducer, {
  Project,
  ProjectsState,
  addProject,
  removeProject,
  addPackageToProject,
  removePackageFromProject,
} from '../../../../src/features/projects/projectsSlice';

const initial: ProjectsState = { items: [] };

const sampleProject: Project = {
  id: 'p1',
  name: 'My Project',
  packageIds: ['softcore', 'softgfx'],
};

test('addProject stores a project', () => {
  const state = projectsReducer(initial, addProject(sampleProject));
  expect(state.items).toHaveLength(1);
  expect(state.items[0].id).toBe('p1');
});

test('removeProject deletes by id', () => {
  const withProject = projectsReducer(initial, addProject(sampleProject));
  const removed = projectsReducer(withProject, removeProject('p1'));
  expect(removed.items).toHaveLength(0);
});

describe('addPackageToProject', () => {
  it('appends a package id to the project', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: ['softcore'] }] },
      addPackageToProject({ projectId: 'p1', packageId: 'softgfx' })
    );
    expect(state.items[0].packageIds).toContain('softgfx');
  });

  it('does not duplicate a package already in the project', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: ['softcore'] }] },
      addPackageToProject({ projectId: 'p1', packageId: 'softcore' })
    );
    expect(state.items[0].packageIds.filter(id => id === 'softcore')).toHaveLength(1);
  });

  it('initialises packageIds when project was created without it (migration)', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: undefined as unknown as string[] }] },
      addPackageToProject({ projectId: 'p1', packageId: 'softgfx' })
    );
    expect(state.items[0].packageIds).toContain('softcore');
    expect(state.items[0].packageIds).toContain('softgfx');
  });

  it('is a no-op for unknown project', () => {
    const state = projectsReducer(
      { items: [] },
      addPackageToProject({ projectId: 'no-such', packageId: 'softgfx' })
    );
    expect(state.items).toHaveLength(0);
  });
});

describe('removePackageFromProject', () => {
  it('removes a package id from the project', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }] },
      removePackageFromProject({ projectId: 'p1', packageId: 'softgfx' })
    );
    expect(state.items[0].packageIds).not.toContain('softgfx');
    expect(state.items[0].packageIds).toContain('softcore');
  });

  it('is a no-op for unknown project', () => {
    const state = projectsReducer(
      { items: [] },
      removePackageFromProject({ projectId: 'no-such', packageId: 'softgfx' })
    );
    expect(state.items).toHaveLength(0);
  });
});
