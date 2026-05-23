export default `
' Start of node registration function
function registerNode(nodeName)
  call("_SoftBasicGfx.getInstance().registerNode(registernode_nodeName.toLowerCase())")
endfunction
' End of node registration function

' Start of PIXI clear function 
function clear()
  call("_SoftBasicGfx.getInstance().clear()")
endfunction
' End of PIXI clear function

`;
