/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Minimal 1×1 white pixel PNG — used as a stand-in for ship.png / enemy.png
// ---------------------------------------------------------------------------
const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ---------------------------------------------------------------------------
// State seed helper
// ---------------------------------------------------------------------------

interface FileSpec {
  name: string;
  source: string;
}

function buildPersistedState(
  projectId: string,
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = []
): string {
  const filesById: Record<string, object> = {};
  const fileOrder: string[] = [];
  files.forEach((f) => {
    const id = `file-${f.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    filesById[id] = {
      id,
      name: f.name,
      source: f.source,
      projectId,
      folderId: null,
      fullName: f.name,
    };
    fileOrder.push(id);
  });

  const assetsById: Record<string, object> = {};
  const assetOrder: string[] = [];
  assetNames.forEach((name) => {
    const id = `asset-${name.replace('.', '-')}`;
    assetsById[id] = {
      id,
      name,
      content: PIXEL_PNG,
      projectId,
      folderId: null,
      fullName: name,
    };
    assetOrder.push(id);
  });

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: projectName, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({
      byId: filesById,
      dirtyFileIds: [],
      fileOrder: { [`${projectId}:root`]: fileOrder },
    }),
    assets: JSON.stringify({
      byId: assetsById,
      assetOrder: { [`${projectId}:root`]: assetOrder },
    }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

// ---------------------------------------------------------------------------
// Run helper — seed state, visit, click Run, wait, assert no ERR in panel
// ---------------------------------------------------------------------------

function runTutorial(
  projectId: string,
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = [],
  waitMs = 3000
) {
  const persistedState = buildPersistedState(projectId, projectName, files, assetNames);

  cy.visit(`/projects/${projectId}/edit`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('persist:softBASIC', persistedState);
    },
  });

  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(waitMs);
  // Assert no ERR entries in the bottom panel — that is what the user sees
  cy.get('span').contains('ERR').should('not.exist');
}

// ---------------------------------------------------------------------------
// Shared source code (mirrors tutorials.test.ts — same code, confirmed compileable)
// ---------------------------------------------------------------------------

const MAIN_SIMPLE = `
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
`.trim();

const PLAYER_T3 = `
Class
Extends sprite

Constructor()
  super("ship.png")
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor
`.trim();

const PLAYER_T4 = `
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 200
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  x = self.transform.x() + self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
endfunction
`.trim();

const PLAYER_T5 = `
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  dim y
  dim move
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  self.transform.setPosition(x, y)
endfunction
`.trim();

const PLAYER_T6 = `
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  halfW = self.width() / 2
  halfH = self.height() / 2

  if x < halfW then
    x = halfW
  endif
  if x > stage.width() - halfW then
    x = stage.width() - halfW
  endif
  if y < halfH then
    y = halfH
  endif
  if y > stage.height() - halfH then
    y = stage.height() - halfH
  endif

  self.transform.setPosition(x, y)
endfunction
`.trim();

const PLAYER_T8 = `
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function clamp(value, minVal, maxVal)
  if value < minVal then
    value = minVal
  endif
  if value > maxVal then
    value = maxVal
  endif
  return value
endfunction

function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000
  halfW = self.width() / 2
  halfH = self.height() / 2

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  x = self.clamp(x, halfW, stage.width() - halfW)
  y = self.clamp(y, halfH, stage.height() - halfH)

  self.transform.setPosition(x, y)
endfunction
`.trim();

const SCORE_DISPLAY = `
Class
Extends text

Constructor()
  super("Score: 0", 10, 10)
  self.setStyle(24, 255, 255, 100)
  stage.add(self)
EndConstructor

function setScore(s)
  self.setText("Score: " + string.str(s))
endfunction
`.trim();

const MAIN_T7 = `
dim score
dim timer
dim scoreDisplay as ScoreDisplay

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()
endfunction

function onupdate(delta)
  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
`.trim();

const ENEMY = `
Class
Extends sprite

dim speed

Constructor(startX, startY)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, startY)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim y
  y = self.transform.y() + self.speed * delta / 1000
  if y > stage.height() then
    y = 0
  endif
  self.transform.setPosition(self.transform.x(), y)
endfunction
`.trim();

const MAIN_T9 = `
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim enemies(0)

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()

  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction

function onupdate(delta)
  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
`.trim();

const GAME_OVER_DISPLAY = `
Class
Extends text

Constructor()
  super("GAME OVER", stage.width() / 2 - 100, stage.height() / 2 - 20)
  self.setStyle(40, 255, 80, 80)
  self.setAlpha(0)
  stage.add(self)
EndConstructor

function show()
  self.setAlpha(1)
endfunction
`.trim();

const MAIN_T11 = `
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim gameOverDisplay as GameOverDisplay
dim enemies(0)
dim running
dim player as Player

function onenter()
  stage.setBackground(10, 10, 30)
  running = 1
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  gameOverDisplay = new GameOverDisplay()
  player = new Player()

  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction

function checkCollisions(p)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if gfx.boxCollide(p, enemies(i)) then
      running = 0
      gameOverDisplay.show()
    endif
  next i
endfunction

function onupdate(delta)
  if running = 0 then
    return
  endif

  checkCollisions(player)

  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
`.trim();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Tutorial 1: Hello World', () => {
  it('runs without runtime errors', () => {
    runTutorial('t01', 'Tutorial 1', [
      {
        name: 'Main',
        source: `
print "Hello, world!"

dim score
score = 0
score = score + 10
print "Score: " + string.str(score)

dim lives
lives = 3
print "Lives remaining: " + string.str(lives)
        `.trim(),
      },
    ]);
  });
});

describe('Tutorial 2: Drawing on Screen', () => {
  it('runs without runtime errors', () => {
    runTutorial('t02', 'Tutorial 2', [
      {
        name: 'Main',
        source: `
function onenter()
  stage.setBackground(10, 10, 30)

  pen.setFillColor(255, 255, 255)
  drawing.drawRect(50, 60, 3, 3)
  drawing.drawRect(120, 30, 2, 2)
  drawing.drawRect(200, 140, 3, 3)
  drawing.drawRect(300, 80, 2, 2)
  drawing.drawRect(380, 50, 3, 3)

  pen.setFillColor(100, 160, 220)
  drawing.drawCircle(480, 200, 95)

  pen.setFillColor(80, 140, 200)
  drawing.drawCircle(480, 200, 80)

  pen.setFillColor(180, 180, 200)
  drawing.drawRect(100, 180, 60, 20)
  drawing.drawRect(100, 170, 20, 10)
endfunction
        `.trim(),
      },
    ]);
  });
});

describe('Tutorial 3: Your First Sprite', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't03',
      'Tutorial 3',
      [
        { name: 'Player', source: PLAYER_T3 },
        { name: 'Main', source: MAIN_SIMPLE },
      ],
      ['ship.png'],
      3000
    );
  });
});

describe('Tutorial 4: Making Things Move', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't04',
      'Tutorial 4',
      [
        { name: 'Player', source: PLAYER_T4 },
        { name: 'Main', source: MAIN_SIMPLE },
      ],
      ['ship.png'],
      3000
    );
  });
});

describe('Tutorial 5: Keyboard Control', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't05',
      'Tutorial 5',
      [
        { name: 'Player', source: PLAYER_T5 },
        { name: 'Main', source: MAIN_SIMPLE },
      ],
      ['ship.png'],
      3000
    );
  });
});

describe('Tutorial 6: Staying on Screen', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't06',
      'Tutorial 6',
      [
        { name: 'Player', source: PLAYER_T6 },
        { name: 'Main', source: MAIN_SIMPLE },
      ],
      ['ship.png'],
      3000
    );
  });
});

describe('Tutorial 7: Score and Text', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't07',
      'Tutorial 7',
      [
        { name: 'Player', source: PLAYER_T6 },
        { name: 'ScoreDisplay', source: SCORE_DISPLAY },
        { name: 'Main', source: MAIN_T7 },
      ],
      ['ship.png'],
      5000
    );
  });
});

describe('Tutorial 8: Functions', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't08',
      'Tutorial 8',
      [
        { name: 'Player', source: PLAYER_T8 },
        { name: 'ScoreDisplay', source: SCORE_DISPLAY },
        { name: 'Main', source: MAIN_T7 },
      ],
      ['ship.png'],
      5000
    );
  });
});

describe('Tutorial 9: Multiple Enemies', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't09',
      'Tutorial 9',
      [
        { name: 'Player', source: PLAYER_T8 },
        { name: 'ScoreDisplay', source: SCORE_DISPLAY },
        { name: 'Enemy', source: ENEMY },
        { name: 'Main', source: MAIN_T9 },
      ],
      ['ship.png', 'enemy.png'],
      5000
    );
  });
});

describe('Tutorial 11: Dodge!', () => {
  it('runs without runtime errors', () => {
    runTutorial(
      't11',
      'Tutorial 11',
      [
        { name: 'Player', source: PLAYER_T8 },
        { name: 'ScoreDisplay', source: SCORE_DISPLAY },
        { name: 'Enemy', source: ENEMY },
        { name: 'GameOverDisplay', source: GAME_OVER_DISPLAY },
        { name: 'Main', source: MAIN_T11 },
      ],
      ['ship.png', 'enemy.png'],
      5000
    );
  });
});
