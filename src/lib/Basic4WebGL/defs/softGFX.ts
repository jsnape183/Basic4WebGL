import softDrawing from "./graphics/softDrawing";
import softPen from "./graphics/softPen";
import softStage from "./graphics/softStage";
import softText from "./graphics/softText";
import softTransform from "./graphics/softTransform";

export default `

function boxCollide(a,b)
  return call("_sb.boxCollide(a,b);")
endfunction


'Start of PIXI keyboard functions
function getKeyDown(keycode)
  return call("_sb.getKeyDown(keycode)")
endfunction`;

export { softDrawing, softPen, softStage, softText, softTransform };
