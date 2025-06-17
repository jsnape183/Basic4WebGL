import softGFX from "../lib/Basic4WebGL/defs/softGFX";
import softString from "../lib/Basic4WebGL/defs/softString";
import softMath from "../lib/Basic4WebGL/defs/softMath";
import softArray from "../lib/Basic4WebGL/defs/softArray";
import { ProjectFile } from "../lib/compiler/types";

export const projectLib: Array<ProjectFile> = [
  { name: "defs", source: softGFX },
  { name: "string", source: softString },
  { name: "math", source: softMath },
  { name: "array", source: softArray },
];
