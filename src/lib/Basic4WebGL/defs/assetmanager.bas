function loadImage(name)
    return call("_sb.get(loadimage_name)")
endfunction

function defineRegion(newName, sourceName, x, y, width, height)
    call("_sb.defineRegion(defineregion_newName, defineregion_sourceName, defineregion_x, defineregion_y, defineregion_width, defineregion_height)")
endfunction