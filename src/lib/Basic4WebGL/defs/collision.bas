function spriteCollide(a, b)
    return call("_sb.spriteCollide(spritecollide_a, spritecollide_b)")
endfunction

function boxCollide(x1, y1, w1, h1, x2, y2, w2, h2)
    return call("_sb.boxCollide(boxcollide_x1, boxcollide_y1, boxcollide_w1, boxcollide_h1, boxcollide_x2, boxcollide_y2, boxcollide_w2, boxcollide_h2)")
endfunction

function circleCollide(a, radiusA, b, radiusB)
    return call("_sb.circleCollide(circlecollide_a, circlecollide_radiusA, circlecollide_b, circlecollide_radiusB)")
endfunction

function pointInBox(x, y, sprite)
    return call("_sb.pointInBox(pointinbox_x, pointinbox_y, pointinbox_sprite)")
endfunction

function raycast(x, y, angle, distance, sprites)
    return call("_sb.raycast(raycast_x, raycast_y, raycast_angle, raycast_distance, raycast_sprites)")
endfunction

function raycastAll(x, y, angle, distance, sprites)
    return call("_sb.raycastAll(raycastall_x, raycastall_y, raycastall_angle, raycastall_distance, raycastall_sprites)")
endfunction

function setupTileCollision(tileMapSet)
    call("_sb.setupTileCollision(setuptilecollision_tileMapSet)")
endfunction
