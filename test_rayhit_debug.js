// Test the test setup to understand what's happening
import { readFileSync } from 'fs';

const sceneSource = readFileSync('src/lib/Basic4WebGL/defs/Scene.bas', 'utf-8');
console.log('Scene source length:', sceneSource.length);
console.log('Scene source:', sceneSource);
