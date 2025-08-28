export default `

function loadImage(name)
    call("try {")
    return call("AssetManager.get(loadimage_name);")
    call(" } catch (e) { _throwError(e); }")
endfunction

`;
