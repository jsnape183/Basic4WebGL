export default `

function create(texture)
    call("const sprite = new PIXI.Sprite(create_texture);")
    call("app.stage.addChild(sprite);")
    return call("sprite;")
endfunction

`;
