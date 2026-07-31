import { readFileSync } from 'node:fs';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const sceneSource = readFileSync('src/lib/Basic4WebGL/defs/Scene.bas', 'utf-8');
const sceneManagerSource = readFileSync('src/lib/Basic4WebGL/defs/SceneManager.bas', 'utf-8');

const r1 = compiler.transpile({
  lib: [],
  files: [
    { name: 'Scene.bas', source: sceneSource },
    { name: 'Main.bas', source: 'class MenuScene extends Scene\nendclass' },
  ],
});
console.log('Scene extends test:', JSON.stringify(r1.diagnostics));

const r2 = compiler.transpile({
  lib: [{ name: 'SceneManager', source: sceneManagerSource }],
  files: [{ name: 'Main.bas', source: 'function test()\n  dim s\n  SceneManager.register("menu", s)\nendfunction' }],
});
console.log('SceneManager.register test:', JSON.stringify(r2.diagnostics));
