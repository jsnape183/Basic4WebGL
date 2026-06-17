// src/lib/Basic4WebGL/sortByDependencies.ts
import { ProjectFile } from '../CompilerLib/compiler/types';

export type SortResult = {
  files: ProjectFile[];
  error?: string;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Strip softBASIC line comments (' to end of line) before scanning for
// dependency names. Without this, a comment like "' enemy ammo" in Ammo.bas
// would add a false Ammo→Enemy edge and produce a phantom circular dependency.
function stripComments(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const idx = line.indexOf("'");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

export function sortByDependencies(files: ProjectFile[]): SortResult {
  if (files.length === 0) return { files: [] };

  // Build lookup keyed by lowercased filename (= softBASIC class/module name).
  // Map insertion order mirrors the user's drag-drop order, which we use as the
  // tiebreaker when multiple files become eligible at the same sort step.
  const fileMap = new Map<string, ProjectFile>();
  for (const f of files) {
    fileMap.set(f.name.toLowerCase(), f);
  }
  const names = Array.from(fileMap.keys()); // original order

  const originalIndex = new Map<string, number>();
  names.forEach((name, i) => originalIndex.set(name, i));

  // Dependency edges: name → set of other names this file references.
  // We require the file name to appear in a syntactically meaningful position —
  // one of the four patterns that actually create a compile-time dependency.
  // A bare occurrence like "dim enemy" (variable name) or "' enemy" (comment)
  // does not match any pattern and produces no edge.
  const PATTERN_FACTORIES = [
    (e: string) => new RegExp(`\\bnew\\s+${e}\\b`, 'i'),      // new ClassName
    (e: string) => new RegExp(`\\bas\\s+${e}\\b`, 'i'),       // dim x as ClassName
    (e: string) => new RegExp(`\\b${e}\\.`, 'i'),              // ClassName.method()
    (e: string) => new RegExp(`\\bextends\\s+${e}\\b`, 'i'),  // Extends ClassName
  ];

  const deps = new Map<string, Set<string>>();
  for (const name of names) {
    const file = fileMap.get(name)!;
    const strippedSource = stripComments(file.source);
    const referenced = new Set<string>();
    for (const other of names) {
      if (other === name) continue;
      const escaped = escapeRegex(other);
      if (PATTERN_FACTORIES.some((make) => make(escaped).test(strippedSource))) {
        referenced.add(other);
      }
    }
    deps.set(name, referenced);
  }

  // Reverse edges: name → files that depend on it (so we can decrement in-degree).
  const dependents = new Map<string, string[]>();
  for (const name of names) dependents.set(name, []);
  for (const [name, depSet] of deps) {
    for (const dep of depSet) {
      dependents.get(dep)!.push(name);
    }
  }

  // Kahn's BFS topological sort.
  const inDegree = new Map<string, number>();
  for (const name of names) inDegree.set(name, deps.get(name)!.size);

  // Seed with zero-in-degree nodes in their original order.
  const queue: string[] = names.filter((name) => inDegree.get(name) === 0);
  const result: ProjectFile[] = [];

  while (queue.length > 0) {
    const name = queue.shift()!;
    result.push(fileMap.get(name)!);

    const newlyEligible: string[] = [];
    for (const dep of dependents.get(name)!) {
      const degree = inDegree.get(dep)! - 1;
      inDegree.set(dep, degree);
      if (degree === 0) newlyEligible.push(dep);
    }
    // Sort newly eligible nodes by original position to preserve drag-drop order.
    newlyEligible.sort((a, b) => originalIndex.get(a)! - originalIndex.get(b)!);
    queue.push(...newlyEligible);
  }

  if (result.length < files.length) {
    const cycleNames = names
      .filter((name) => !result.some((f) => f.name.toLowerCase() === name))
      .map((name) => fileMap.get(name)!.name);
    return {
      files,
      error: `Circular dependency detected: ${cycleNames.join(' → ')}`,
    };
  }

  return { files: result };
}
