// Shared helpers for the raycaster tests, after the library moved into the
// `softRaycaster` first-party package (src/lib/Basic4WebGL/defs/Rc*.bas).
import { readFileSync } from 'node:fs';
import { packageModules } from '../../../../src/constants/packageModules';

export const RC_MODULES = [
  'rcconfig', 'rcworld', 'rccast', 'rcmover', 'rclights', 'rcactor', 'rcactors', 'rcrender',
] as const;
const RC = new Set<string>(RC_MODULES);

export const RC_DEFS_DIR = 'src/lib/Basic4WebGL/defs';

/** packageModules WITHOUT the raycaster modules — for tests that compile a
 *  chosen subset of Rc* files themselves as `files`. */
export function baseLib(): Array<{ name: string; source: string }> {
  return Object.entries(packageModules)
    .filter(([n]) => !RC.has(n))
    .map(([name, source]) => ({ name, source }));
}

/** packageModules including the raycaster modules — the whole lib as a project
 *  would see it with softRaycaster enabled. Optionally patch a module's source
 *  (e.g. flip an RcConfig constant). */
export function fullLib(
  patch?: (name: string, source: string) => string,
): Array<{ name: string; source: string }> {
  return Object.entries(packageModules).map(([name, source]) => ({
    name,
    source: patch ? patch(name, source) : source,
  }));
}

/** Read one Rc* def file (e.g. 'RcWorld.bas'). */
export function readRcDef(fileName: string): string {
  return readFileSync(`${RC_DEFS_DIR}/${fileName}`, 'utf-8');
}
