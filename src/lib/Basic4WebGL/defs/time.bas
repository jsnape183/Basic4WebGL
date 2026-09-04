' time -- real (wall-clock) timing helpers.
' now() returns a monotonically increasing millisecond timestamp (fractional).
' The origin is arbitrary; use differences (t1 - t0) to measure elapsed time.
' Unlike onupdate(delta), which is the FIXED simulation step, now() advances
' with real time -- use it to profile a section of code or drive a real-time
' (not simulation-locked) timer.
function now()
    return call("_sb.timeNow()")
endfunction
