function drawLine(x, y, x2, y2)
    call("_sb.drawLine(drawline_x, drawline_y, drawline_x2, drawline_y2)")
endfunction

function drawRect(x, y, width, height)
    call("_sb.drawRect(drawrect_x, drawrect_y, drawrect_width, drawrect_height)")
endfunction

function drawCircle(x, y, radius)
    call("_sb.drawCircle(drawcircle_x, drawcircle_y, drawcircle_radius)")
endfunction

function clear()
    call("_sb.clearDrawing()")
endfunction

function drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight, tint, srcVTop, srcVBot)
    call("_sb.drawImageStrip(drawimagestrip_imageName, drawimagestrip_srcX, drawimagestrip_destX, drawimagestrip_destY, drawimagestrip_destWidth, drawimagestrip_destHeight, drawimagestrip_tint, drawimagestrip_srcVTop, drawimagestrip_srcVBot)")
endfunction

function drawFloorStrip(imageName, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW, tint)
    call("_sb.drawFloorStrip(drawfloorstrip_imageName, drawfloorstrip_destX, drawfloorstrip_yNear, drawfloorstrip_yFar, drawfloorstrip_wNearX, drawfloorstrip_wNearY, drawfloorstrip_wFarX, drawfloorstrip_wFarY, drawfloorstrip_stripW, drawfloorstrip_tint)")
endfunction

function drawVGradientRect(x, y, width, height, topR, topG, topB, botR, botG, botB)
    call("_sb.drawVGradientRect(drawvgradientrect_x, drawvgradientrect_y, drawvgradientrect_width, drawvgradientrect_height, drawvgradientrect_topR, drawvgradientrect_topG, drawvgradientrect_topB, drawvgradientrect_botR, drawvgradientrect_botG, drawvgradientrect_botB)")
endfunction