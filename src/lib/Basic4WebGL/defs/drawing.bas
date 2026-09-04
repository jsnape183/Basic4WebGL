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

function wallColumn(imageName, destX, topY, botY, srcU, srcVTop, srcVBot, tint)
    call("_sb.wallColumn(wallcolumn_imageName, wallcolumn_destX, wallcolumn_topY, wallcolumn_botY, wallcolumn_srcU, wallcolumn_srcVTop, wallcolumn_srcVBot, wallcolumn_tint)")
endfunction

function wallFlush()
    call("_sb.wallFlush()")
endfunction