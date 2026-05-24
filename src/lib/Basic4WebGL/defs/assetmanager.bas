function loadImage(name)
  call("try {")
  return call("_SoftAssetManager.get(loadimage_name);")
  call(" } catch (e) { _throwError(e); }")
endfunction
