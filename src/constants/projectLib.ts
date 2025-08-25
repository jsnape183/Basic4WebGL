import softGFX, {
  softDrawing,
  softStage,
  softPen,
  softText,
  softTransform,
} from "../lib/Basic4WebGL/defs/softGFX";
import softString from "../lib/Basic4WebGL/defs/softString";
import softMath from "../lib/Basic4WebGL/defs/softMath";
import softArray from "../lib/Basic4WebGL/defs/softArray";
import { ProjectFile } from "../lib/compiler/types";

export const projectLib: Array<ProjectFile> = [
  { name: "gfx", source: softGFX },
  { name: "string", source: softString },
  { name: "math", source: softMath },
  { name: "array", source: softArray },
  { name: "drawing", source: softDrawing },
  { name: "stage", source: softStage },
  { name: "pen", source: softPen },
  { name: "text", source: softText },
  { name: "transform", source: softTransform },
];
