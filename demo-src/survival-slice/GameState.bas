Class
' demo-src/survival-slice/GameState.bas
'
' The single piece of state that must survive a scenemanager.switch.
' scenemanager.switch(name) takes no arguments, so the destination scene's
' onenter() reads pendingEntry from here to know which entry: marker to spawn
' the player at. Constructed once in Main.bas, passed to every scene.
'
' Phase 1 scope: pendingEntry only. Later phases add activated-safe-zone,
' resource counts, and collapse depth here.

dim pendingEntry

Constructor()
  self.pendingEntry = "start"
EndConstructor

function setPendingEntry(name)
  self.pendingEntry = name
endfunction

function takePendingEntry()
  ' Read-and-reset: returns the pending entry name, then clears it back to
  ' "start" so a stray re-enter without a transition spawns at the map's
  ' start marker rather than repeating the last arrival point.
  dim name
  name = self.pendingEntry
  self.pendingEntry = "start"
  return name
endfunction

EndClass
