'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const THEMES = {
  retro: {
    id: 'retro',
    colors: [null,'#4dd0e1','#ffd54f','#ba68c8','#81c784','#e57373','#7986cb','#ffb74d','#78909c'],
    gridColor: '#22222e',
    bgBoard: '#1a1a25',
    bgBody: '#0f0f17',
    accent: '#7aa2f7',
    drawBlock(ctx, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      ctx.globalAlpha = alpha ?? 1;
      ctx.fillStyle = this.colors[colorIndex];
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      ctx.globalAlpha = 1;
    }
  },
  neon: {
    id: 'neon',
    colors: [null,'#00fff5','#ffe600','#dd00ff','#00ff88','#ff2255','#4466ff','#ff8800','#aaaaaa'],
    gridColor: '#111122',
    bgBoard: '#050510',
    bgBody: '#000008',
    accent: '#00fff5',
    drawBlock(ctx, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      ctx.globalAlpha = alpha ?? 1;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
    }
  },
  pastel: {
    id: 'pastel',
    colors: [null,'#a8d8ea','#ffd3a5','#d4a8d8','#b8e0b8','#f5b8b8','#b8bce8','#f5d0a8','#c8d0d8'],
    gridColor: '#2a2a3a',
    bgBoard: '#22222f',
    bgBody: '#18182a',
    accent: '#a8d8ea',
    drawBlock(ctx, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      ctx.globalAlpha = alpha ?? 1;
      ctx.fillStyle = this.colors[colorIndex];
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, 5);
      ctx.globalAlpha = 1;
    }
  },
  pixel: {
    id: 'pixel',
    colors: [null,'#4dd0e1','#ffd54f','#ba68c8','#81c784','#e57373','#7986cb','#ffb74d','#78909c'],
    gridColor: '#1a1a28',
    bgBoard: '#12121e',
    bgBody: '#0a0a14',
    accent: '#7aa2f7',
    drawBlock(ctx, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = this.colors[colorIndex];
      ctx.globalAlpha = alpha ?? 1;
      ctx.fillStyle = color;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // pixel cross pattern overlay
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      const px = x * size, py = y * size;
      // horizontal stripe
      ctx.fillRect(px + 1, py + size / 2 - 1, size - 2, 2);
      // vertical stripe
      ctx.fillRect(px + size / 2 - 1, py + 1, 2, size - 2);
      ctx.globalAlpha = 1;
    }
  }
};

let activeTheme = THEMES.retro;
const THEME_KEY = 'tetris_theme';

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // tuerca
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const controlsBtn = document.getElementById('controls-btn');
const pauseControls = document.getElementById('pause-controls');
const startLevelSelect = document.getElementById('start-level');
const nameForm = document.getElementById('name-form');
const playerNameInput = document.getElementById('player-name');
const submitNameBtn = document.getElementById('submit-name-btn');
const resetScoresBtn = document.getElementById('reset-scores-btn');
const scoresPanelEl = document.getElementById('scores-panel');
const overlayScoresEl = document.getElementById('overlay-scores');

const SCORES_KEY = 'tetris_scores';
function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY)) || []; } catch { return []; }
}
function saveScores(scores) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderScores(container, highlight) {
  const scores = loadScores();
  if (!scores.length) { container.textContent = 'Sin records'; return; }
  container.innerHTML = scores.map((s, i) =>
    `<div class="score-row${s.score === highlight ? ' score-highlight' : ''}">
      <span class="score-rank">#${i+1}</span>
      <span class="score-name">${escapeHtml(s.name)}</span>
      <span class="score-val">${s.score.toLocaleString()}</span>
      <span class="score-meta">${s.lines}L C${s.combo}</span>
    </div>`
  ).join('');
}

function resetScores() {
  localStorage.removeItem(SCORES_KEY);
  renderScores(scoresPanelEl, null);
  renderScores(overlayScoresEl, null);
}

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, holes;
let startLevel = 1;
let combo = 0, maxCombo = 0;

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
  if (current.type === 8)
    holes.push({ x: current.x + 1, y: current.y + 1 });
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      holes.forEach(h => { if (h.y < r) h.y++; });
      cleared++;
      r++;
    }
  }
  if (cleared) {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.max(startLevel, Math.floor(lines / 10) + 1);
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  } else {
    combo = 0;
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  activeTheme.drawBlock(context, x, y, colorIndex, size, alpha);
}

function drawHole(context, bx, by, size, alpha) {
  context.globalAlpha = alpha ?? 1;
  context.strokeStyle = '#78909c';
  context.lineWidth = 2;
  context.beginPath();
  context.arc((bx + 0.5) * size, (by + 0.5) * size, size * 0.28, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
}

function applyTheme(name) {
  const theme = THEMES[name];
  activeTheme = theme || THEMES.retro;
  const resolvedName = theme ? name : 'retro';
  const root = document.documentElement.style;
  root.setProperty('--bg-body', activeTheme.bgBody);
  root.setProperty('--bg-board', activeTheme.bgBoard);
  root.setProperty('--accent', activeTheme.accent);
  canvas.style.background = activeTheme.bgBoard;
  nextCanvas.style.background = activeTheme.bgBoard;
  document.body.style.background = activeTheme.bgBody;
  localStorage.setItem(THEME_KEY, resolvedName);
  const sel = document.getElementById('theme-select');
  if (sel) sel.value = resolvedName;
}

function drawGrid() {
  ctx.strokeStyle = activeTheme.gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);

  if (current.type === 8) {
    drawHole(ctx, current.x + 1, gy + 1, BLOCK, 0.2);
    drawHole(ctx, current.x + 1, current.y + 1, BLOCK);
  }
  for (const h of holes) drawHole(ctx, h.x, h.y, BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
  if (next.type === 8) drawHole(nextCtx, offX + 1, offY + 1, NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayTitle.classList.remove('paused');
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  pauseMenu.classList.add('hidden');
  restartBtn.classList.remove('hidden');
  const scores = loadScores();
  if (scores.length < 5 || score >= (scores[scores.length - 1]?.score ?? -1)) {
    nameForm.classList.remove('hidden');
    playerNameInput.value = '';
    playerNameInput.focus();
    overlayScoresEl.innerHTML = '';
  } else {
    nameForm.classList.add('hidden');
    renderScores(overlayScoresEl, null);
  }
  renderScores(scoresPanelEl, null);
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    pauseControls.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    overlay.classList.add('hidden');
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayTitle.classList.add('paused');
    overlayScore.textContent = '';
    restartBtn.classList.add('hidden');
    pauseMenu.classList.remove('hidden');
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  if (gameOver) return;
  draw();
  animId = requestAnimationFrame(loop);
}

function submitName() {
  if (nameForm.classList.contains('hidden')) return;
  const name = playerNameInput.value.trim() || 'AAA';
  const entry = { name, score, lines, combo: maxCombo };
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores.splice(5);
  saveScores(scores);
  nameForm.classList.add('hidden');
  renderScores(overlayScoresEl, score);
  renderScores(scoresPanelEl, null);
}

function init() {
  board = createBoard();
  holes = [];
  score = 0;
  lines = 0;
  level = startLevel;
  paused = false;
  gameOver = false;
  dropInterval = Math.max(100, 1000 - (startLevel - 1) * 90);
  dropAccum = 0;
  lastTime = performance.now();
  combo = 0;
  maxCombo = 0;
  next = randomPiece();
  spawn();
  updateHUD();
  pauseControls.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  restartBtn.classList.remove('hidden');
  renderScores(scoresPanelEl, null);
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);
resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', init);
controlsBtn.addEventListener('click', () => {
  pauseControls.classList.toggle('hidden');
});
startLevelSelect.addEventListener('change', () => {
  startLevel = parseInt(startLevelSelect.value, 10);
});
submitNameBtn.addEventListener('click', submitName);
playerNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitName(); });
resetScoresBtn.addEventListener('click', resetScores);

document.getElementById('theme-select').addEventListener('change', e => {
  applyTheme(e.target.value);
  if (!gameOver) draw();
});

const savedTheme = localStorage.getItem(THEME_KEY) || 'retro';
applyTheme(savedTheme);
init();
