' Start of PIXI text functions
function drawText(s, x, y)
  return call("_sb.text(drawtext_s,drawtext_x,drawtext_y);")
endfunction

function setText(obj, text)
  call("_sb.setText(settext_obj,settext_text)")
endfunction
' End of PIXI text functions
