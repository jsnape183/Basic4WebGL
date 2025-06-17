export default `
' Start of string functions
function len(s):return call("len_s.length"):endfunction
function lcase(s):return call("lcase_s.toLowerCase()"):endfunction
function padstart(s, n, p): return call("padstart_s.padStart(padstart_n,padstart_p)"):endfunction
function padend(s, n, p): return call("padend_p.padEnd(padend_n,padend_p)"):endfunction
function split(s, c): return call("split_s.split(split_c)"):endfunction
function str(n):return call("str_n.toString()"):endfunction
function substr(s, start, end):return call("substr_s.substring(substr_start,substr_end)"):endfunction
function trim(s):return call("trim_s.trim()"):endfunction
function ucase(s):return call("ucase_s.toUpperCase()"):endfunction
'End of string functions`;
