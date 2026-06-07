' Start of string functions
function len(s):return call("len_s.length"):endfunction
function lcase(s):return call("lcase_s.toLowerCase()"):endfunction
function padstart(s, n, p): return call("padstart_s.padStart(padstart_n,padstart_p)"):endfunction
function padend(s, n, p): return call("padend_s.padEnd(padend_n,padend_p)"):endfunction
function split(s, c): return call("split_s.split(split_c)"):endfunction
function str(n):return call("str_n.toString()"):endfunction
function substr(s, start, end):return call("substr_s.substring(substr_start,substr_end)"):endfunction
function trim(s):return call("trim_s.trim()"):endfunction
function ucase(s):return call("ucase_s.toUpperCase()"):endfunction
function replace(s, a, b):return call("replace_s.replaceAll(replace_a,replace_b)"):endfunction
function contains(s, sub):return call("contains_s.includes(contains_sub)"):endfunction
function indexof(s, sub):return call("indexof_s.indexOf(indexof_sub)"):endfunction
function char(n):return call("String.fromCharCode(char_n)"):endfunction
function asc(s):return call("asc_s.charCodeAt(0)"):endfunction
' End of string functions
