export default `
' Start of PIXI manipulation functions

function setFillColor(r,g,b)
  call("_sb.setFillColor(r,g,b);")
endfunction

function setLineColor(r,g,b)
  call("_sb.setLineColor(r,g,b);")
endfunction

function setAlpha(obj,a)
  call("_sb.setAlpha(obj, a);")
endfunction
`;
