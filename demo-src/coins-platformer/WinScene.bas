Class extends scene

dim game
dim scores(0)

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  world.setBackground(20, 20, 40)
  camera.setZoom(1)

  dim finalScore
  finalScore = self.game.score

  self.loadScores()
  self.insertScore(finalScore)
  self.trimScores()
  save.set("leaderboard", self.scores)

  self.showResults(finalScore)
endfunction

function loadScores()
  if save.exists("leaderboard") then
    self.scores = save.get("leaderboard")
  else
    dim empty(0)
    self.scores = empty
  endif
endfunction

function insertScore(score)
  dim result(0)
  dim i
  dim inserted
  inserted = false
  for i = 0 to array.arrLength(self.scores) - 1
    if not inserted and score >= self.scores(i) then
      array.push(result, score)
      inserted = true
    endif
    array.push(result, self.scores(i))
  next i
  if not inserted then
    array.push(result, score)
  endif
  self.scores = result
endfunction

function trimScores()
  dim top(0)
  dim i
  dim limit
  limit = array.arrLength(self.scores)
  if limit > 5 then
    limit = 5
  endif
  for i = 0 to limit - 1
    array.push(top, self.scores(i))
  next i
  self.scores = top
endfunction

function showResults(finalScore)
  dim title as text
  title = new text("You Win!", 220, 60)
  title.setStyle(28, 255, 215, 0)
  hud.add(title)

  dim scoreLine as text
  scoreLine = new text("Coins collected: " + string.str(finalScore), 220, 110)
  scoreLine.setStyle(18, 255, 255, 255)
  hud.add(scoreLine)

  dim heading as text
  heading = new text("Leaderboard", 220, 150)
  heading.setStyle(18, 255, 255, 255)
  hud.add(heading)

  dim i
  dim y
  dim line as text
  y = 180
  for i = 0 to array.arrLength(self.scores) - 1
    line = new text(string.str(i + 1) + ". " + string.str(self.scores(i)), 220, y)
    line.setStyle(14, 255, 255, 255)
    hud.add(line)
    y = y + 22
  next i
endfunction

EndClass
