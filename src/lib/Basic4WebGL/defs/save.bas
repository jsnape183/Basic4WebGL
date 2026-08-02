function set(key, value)
    call("_sb.saveSet(set_key, set_value)")
endfunction

function get(key)
    return call("_sb.saveGet(get_key)")
endfunction

function exists(key)
    return call("_sb.saveExists(exists_key)")
endfunction

function delete(key)
    call("_sb.saveDelete(delete_key)")
endfunction

function setAll(data)
    call("_sb.saveSetAll(setall_data)")
endfunction

function getAll()
    return call("_sb.saveGetAll()")
endfunction