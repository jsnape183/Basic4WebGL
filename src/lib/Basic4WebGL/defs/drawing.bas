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

function drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight)
    call("_sb.drawImageStrip(drawimagestrip_imageName, drawimagestrip_srcX, drawimagestrip_destX, drawimagestrip_destY, drawimagestrip_destWidth, drawimagestrip_destHeight)")
endfunction