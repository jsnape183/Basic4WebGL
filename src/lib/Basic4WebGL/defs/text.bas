Class
dim _handle

Constructor(content, x, y)
    self._handle = call("_sb.createText(constructor_content, constructor_x, constructor_y)")
EndConstructor

function setText(content)
    call("_sb.setText(this._handle, settext_content)")
endfunction

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

function setStyle(size, r, g, b)
    call("_sb.setTextStyle(this._handle, setstyle_size, setstyle_r, setstyle_g, setstyle_b)")
endfunction

EndClass
