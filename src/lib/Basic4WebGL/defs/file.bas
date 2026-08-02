function write(path, content)
    call("_sb.fileWrite(write_path, write_content)")
endfunction

function read(path)
    return call("_sb.fileRead(read_path)")
endfunction

function exists(path)
    return call("_sb.fileExists(exists_path)")
endfunction

function delete(path)
    call("_sb.fileDelete(delete_path)")
endfunction