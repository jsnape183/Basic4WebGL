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

function registerLightmap(id, width, height, worldCols, worldRows, bytes)
    call("_sb.registerLightmap(registerlightmap_id, registerlightmap_width, registerlightmap_height, registerlightmap_worldCols, registerlightmap_worldRows, registerlightmap_bytes)")
endfunction

function drawPlaneField(fieldId, planeZ, camX, camY, camZ, dirX, dirY, planeX, planeY, pitch, viewW, viewH, scy, eyeZ, lightmapId, ambient, baseR, baseG, baseB)
    call("_sb.drawPlaneField(drawplanefield_fieldId, drawplanefield_planeZ, drawplanefield_camX, drawplanefield_camY, drawplanefield_camZ, drawplanefield_dirX, drawplanefield_dirY, drawplanefield_planeX, drawplanefield_planeY, drawplanefield_pitch, drawplanefield_viewW, drawplanefield_viewH, drawplanefield_scy, drawplanefield_eyeZ, drawplanefield_lightmapId, drawplanefield_ambient, drawplanefield_baseR, drawplanefield_baseG, drawplanefield_baseB)")
endfunction

function drawRadialGradientCircle(x, y, radius, r, g, b, alpha)
    call("_sb.drawRadialGradientCircle(drawradialgradientcircle_x, drawradialgradientcircle_y, drawradialgradientcircle_radius, drawradialgradientcircle_r, drawradialgradientcircle_g, drawradialgradientcircle_b, drawradialgradientcircle_alpha)")
endfunction

function drawRadialGradientEllipse(x, y, radiusX, radiusY, r, g, b, alpha)
    call("_sb.drawRadialGradientEllipse(drawradialgradientellipse_x, drawradialgradientellipse_y, drawradialgradientellipse_radiusX, drawradialgradientellipse_radiusY, drawradialgradientellipse_r, drawradialgradientellipse_g, drawradialgradientellipse_b, drawradialgradientellipse_alpha)")
endfunction