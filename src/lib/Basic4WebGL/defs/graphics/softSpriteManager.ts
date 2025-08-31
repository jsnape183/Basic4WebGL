export default `

function create(name, texture)
    call("const sprite = _SoftSpriteManager.create(create_name, create_texture);")
    return call("sprite;")
endfunction

`;
