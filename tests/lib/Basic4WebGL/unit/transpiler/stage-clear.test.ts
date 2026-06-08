import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const stageSource   = readFileSync('src/lib/Basic4WebGL/defs/stage.bas',   'utf-8');
const penSource     = readFileSync('src/lib/Basic4WebGL/defs/pen.bas',     'utf-8');
const drawingSource = readFileSync('src/lib/Basic4WebGL/defs/drawing.bas', 'utf-8');
const gfxSource     = readFileSync('src/lib/Basic4WebGL/defs/gfx.bas',     'utf-8');
const mathSource    = readFileSync('src/lib/Basic4WebGL/defs/math.bas',    'utf-8');

const transpileGame = (source: string) =>
  compiler.transpile({
    lib: [
      { name: 'stage',   source: stageSource   },
      { name: 'pen',     source: penSource     },
      { name: 'drawing', source: drawingSource },
      { name: 'gfx',     source: gfxSource     },
      { name: 'math',    source: mathSource    },
    ],
    files: [{ name: 'Main.bas', source }],
  });

// ─── Isolated stage.clear() ───────────────────────────────────────────────────

describe('stage.clear() with real lib: setup', () => {
  test('stage.clear() alone', () => {
    const result = transpileGame(
      'function game()\n  stage.clear()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('stage.clear() coexists with user-defined clear(arr)', () => {
    const result = transpileGame([
      'function clear(arr)',
      '  print arr',
      'endfunction',
      'function game()',
      '  stage.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── Full Breakout program ────────────────────────────────────────────────────

const breakout = `
dim paddleX
dim paddleW
dim paddleH
dim paddleY

dim ballX
dim ballY
dim ballVX
dim ballVY
dim ballR

dim brickCols
dim brickRows
dim brickW
dim brickH
dim brickOffX
dim brickOffY
dim brickPad

dim bricks(32)
dim score
dim lives
dim running

function onenter()
    stage.setBackground(10, 10, 30)

    paddleW = 100
    paddleH = 14
    paddleY = stage.height() - 40
    paddleX = stage.width() / 2

    ballR = 8
    ballX = stage.width() / 2
    ballY = paddleY - 30
    ballVX = 3
    ballVY = -4

    brickCols = 8
    brickRows = 4
    brickW = 90
    brickH = 20
    brickOffX = 21
    brickOffY = 70
    brickPad = 4

    for i = 0 to 31
        bricks(i) = 1
    next

    score = 0
    lives = 3
    running = 1
endfunction

function onupdate()
    dim i
    dim bRow
    dim bCol
    dim bcx
    dim bcy
    dim nearX
    dim nearY
    dim dx
    dim dy
    dim paddleLeft
    dim paddleRight
    dim paddleTop
    dim hitRatio

    if running == 0
        stage.clear()
        pen.setFillColor(160, 30, 30)
        pen.setLineColor(255, 80, 80)
        pen.setLineWidth(3)
        drawing.drawRect(stage.width() / 2, stage.height() / 2, 260, 90)
        return
    endif

    if gfx.getKeyDown(37)
        paddleX = paddleX - 7
    endif
    if gfx.getKeyDown(39)
        paddleX = paddleX + 7
    endif
    if paddleX < paddleW / 2
        paddleX = paddleW / 2
    endif
    if paddleX > stage.width() - paddleW / 2
        paddleX = stage.width() - paddleW / 2
    endif

    ballX = ballX + ballVX
    ballY = ballY + ballVY

    if ballX - ballR < 0
        ballX = ballR
        ballVX = math.abs(ballVX)
    endif
    if ballX + ballR > stage.width()
        ballX = stage.width() - ballR
        ballVX = -math.abs(ballVX)
    endif
    if ballY - ballR < 0
        ballY = ballR
        ballVY = math.abs(ballVY)
    endif

    if ballY - ballR > stage.height()
        lives = lives - 1
        print lives
        if lives <= 0
            running = 0
        else
            ballX = stage.width() / 2
            ballY = paddleY - 30
            ballVX = 3
            ballVY = -4
        endif
    endif

    paddleLeft  = paddleX - paddleW / 2
    paddleRight = paddleX + paddleW / 2
    paddleTop   = paddleY - paddleH / 2

    if ballVY > 0
        if ballY + ballR >= paddleTop
            if ballX >= paddleLeft and ballX <= paddleRight
                ballVY = -math.abs(ballVY)
                hitRatio = (ballX - paddleLeft) / paddleW
                ballVX = (hitRatio - 0.5) * 8
            endif
        endif
    endif

    for i = 0 to 31
        if bricks(i) == 1
            bRow = math.floor(i / brickCols)
            bCol = i - bRow * brickCols
            bcx = brickOffX + bCol * (brickW + brickPad) + brickW / 2
            bcy = brickOffY + bRow * (brickH + brickPad) + brickH / 2

            nearX = math.max(bcx - brickW / 2, math.min(ballX, bcx + brickW / 2))
            nearY = math.max(bcy - brickH / 2, math.min(ballY, bcy + brickH / 2))
            dx = ballX - nearX
            dy = ballY - nearY

            if dx * dx + dy * dy < ballR * ballR
                bricks(i) = 0
                score = score + 10
                print score
                if math.abs(dx) > math.abs(dy)
                    ballVX = -ballVX
                else
                    ballVY = -ballVY
                endif
            endif
        endif
    next

    stage.clear()

    for i = 0 to 31
        if bricks(i) == 1
            bRow = math.floor(i / brickCols)
            bCol = i - bRow * brickCols
            bcx = brickOffX + bCol * (brickW + brickPad) + brickW / 2
            bcy = brickOffY + bRow * (brickH + brickPad) + brickH / 2

            if bRow == 0
                pen.setFillColor(220, 60, 60)
                pen.setLineColor(255, 130, 130)
            endif
            if bRow == 1
                pen.setFillColor(220, 150, 50)
                pen.setLineColor(255, 200, 100)
            endif
            if bRow == 2
                pen.setFillColor(60, 200, 80)
                pen.setLineColor(100, 255, 130)
            endif
            if bRow == 3
                pen.setFillColor(60, 130, 220)
                pen.setLineColor(100, 180, 255)
            endif

            pen.setLineWidth(1)
            drawing.drawRect(bcx, bcy, brickW, brickH)
        endif
    next

    pen.setFillColor(180, 180, 220)
    pen.setLineColor(240, 240, 255)
    pen.setLineWidth(2)
    drawing.drawRect(paddleX, paddleY, paddleW, paddleH)

    pen.setFillColor(255, 240, 60)
    pen.setLineColor(255, 180, 0)
    pen.setLineWidth(1)
    drawing.drawCircle(ballX, ballY, ballR)

    for i = 0 to lives - 1
        pen.setFillColor(255, 90, 90)
        pen.setLineColor(255, 150, 150)
        drawing.drawCircle(16 + i * 24, stage.height() - 16, 7)
    next

endfunction

function onkeydown(k)
endfunction

function onkeyup(k)
endfunction
`.trim();

describe('Full Breakout program', () => {
  test('compiles without error', () => {
    const result = transpileGame(breakout);
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
