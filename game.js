// ============================================================
// Run Brady Run — game.js
// ============================================================
import { spawnObstacle, scrollObstacles,
         checkCollisions, drawObstacles } from './obstacles.js';
import { drawHUD, drawDeathTip, drawQuizFeedback, quizOptionBounds } from './hud.js';
import {
  initPlayer, updatePlayerAnimation, drawPlayer,
  spawnDeathParticles, spawnLandingParticles,
  spawnShieldBreakParticles,
  updateParticles, drawParticles,
} from './player.js';
import { initEnvironment, updateEnvironment, drawEnvironment } from './environment.js';
import { fetchQuizQuestion } from './supabase.js';
import { generateLevelSegment, checkFallDeath } from './level.js';
import {
  spawnPowerup, scrollPowerups,
  checkPowerupCollisions, drawPowerups,
} from './powerups.js';

// TUNEABLE CONSTANTS
//   SPEED      : 4      — horizontal scroll speed (px/frame at 60 fps)
//   GRAVITY    : 0.6    — gravity acceleration (px/frame²)
//   JUMP_VY    : -11    — vertical velocity applied on jump
//   TILE_H     : 20     — height of each ground tile
//   TILE_W     : 70     — width of each ground tile
//   MAX_JUMPS  : 2      — number of jumps allowed (double jump)
//   GROUND_PCT : 0.78   — ground surface as fraction of canvas height
//   CANVAS_W/CANVAS_H/GROUND_Y are mutable — updated by handleResize()
// ============================================================

const SPEED      = 4;
const BASE_SPEED = 4;   // alias used for dynamic speed calculation
const GRAVITY    = 0.6;
const JUMP_VY    = -11;
const TILE_H     = 20;
const TILE_W     = 70;
const MAX_JUMPS  = 2;
const GROUND_PCT = 0.78;

let CANVAS_W = window.innerWidth;
let CANVAS_H = window.innerHeight;
let GROUND_Y = Math.floor(CANVAS_H * GROUND_PCT);

// ── Canvas setup ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

// ── Resize handler ───────────────────────────────────────────
function handleResize() {
  CANVAS_W      = window.innerWidth;
  CANVAS_H      = window.innerHeight;
  GROUND_Y      = Math.floor(CANVAS_H * GROUND_PCT);
  canvas.width  = CANVAS_W;
  canvas.height = CANVAS_H;
  tiles         = initTiles();
  if (player.onGround) player.y = GROUND_Y - player.h;
}
window.addEventListener('resize', handleResize);

// ── Game state ───────────────────────────────────────────────
// States: 'waiting' | 'playing' | 'quiz'
let state = 'waiting';

// ── Tile factory ─────────────────────────────────────────────
// Fill the screen with solid ground segments to start
function initTiles() {
  const segments = [];
  let x = 0;
  while (x < CANVAS_W + 200) {
    segments.push({ x, y: GROUND_Y, w: 200, h: 40, type: 'ground' });
    x += 200;
  }
  return segments;
}

// ── World state ──────────────────────────────────────────────
let tiles           = initTiles();
let player          = initPlayer(GROUND_Y);
let obstacles       = [];
let powerups        = [];
let powerupTimer    = 0;
let spawnTimer      = 0;
let score           = 0;
let attempts        = 0;
let lastHitObstacle = null;
let scoreTimer      = 0;
let particles       = [];
let shakeFrames     = 0;
let shakeMag        = 0;
let environment     = initEnvironment(CANVAS_H);
let currentQuiz     = null;

// ── Input ─────────────────────────────────────────────────────
function handleJump() {
  if (state === 'waiting') {
    state = 'playing';
    player.onGround = false;
    obstacles  = [];
    spawnTimer = 100;
  }

  if (state !== 'playing') return;

  if (player.jumpsLeft > 0) {
    player.vy        = JUMP_VY;
    player.jumpsLeft--;
    player.onGround  = false;
    player.scaleX    = 0.7;
    player.scaleY    = 1.4;
  }
}

let quizLoading = false;
let quizFeedback = { isCorrect: false };

async function loadNewQuestion() {
  if (quizLoading) return;
  quizLoading = true;
  currentQuiz = null;
  currentQuiz = await fetchQuizQuestion();
  quizLoading = false;
}

function handleQuizAnswer(choice) {
  // State-lock: ignore if quiz isn't active or question isn't ready
  if (state !== 'quiz' || !currentQuiz || quizLoading) return;
  if (!Number.isInteger(choice) || choice < 0 || choice >= currentQuiz.options.length) return;

  quizFeedback.isCorrect = currentQuiz.options[choice] === currentQuiz.answer;
  if (!quizFeedback.isCorrect) { shakeFrames = 10; shakeMag = 4; }
  state = 'feedback'; // transition to feedback overlay
}

// Called when the player dismisses the feedback screen (Space or click)
function advanceFeedback() {
  if (state !== 'feedback') return;
  if (quizFeedback.isCorrect) {
    state       = 'playing';
    currentQuiz = null;
    obstacles   = [];
    spawnTimer  = 60;
  } else {
    // Load a fresh question and stay on quiz
    state       = 'quiz';
    quizLoading = false;
    loadNewQuestion();
  }
}

document.addEventListener('keydown', (e) => {
  if (state === 'feedback') {
    if (e.code === 'Space') { e.preventDefault(); advanceFeedback(); }
    return;
  }
  if (state === 'quiz') {
    e.preventDefault(); // block Space from scrolling the page
    // Only forward digit keys 1-4; ignore Space and everything else
    const choice = parseInt(e.key) - 1;
    if (Number.isInteger(choice) && choice >= 0 && choice < 4) {
      handleQuizAnswer(choice);
    }
    return; // always exit early — never reach handleJump()
  }
  if (e.code === 'Space') {
    e.preventDefault();
    handleJump();
  }
});

canvas.addEventListener('click', (e) => {
  if (state === 'feedback') { advanceFeedback(); return; }
  if (state === 'quiz') {
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    for (const b of quizOptionBounds) {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        handleQuizAnswer(b.index);
        return;
      }
    }
    return;
  }
  handleJump();
});

// ── Physics ──────────────────────────────────────────────────
function applyGravity(dt) {
  // dt is normalised: 1.0 = one frame at 60 fps
  player.vy += GRAVITY * dt;
  player.y  += player.vy * dt;
}

// Returns true if the player just landed this frame
function resolveGroundCollisions() {
  const wasOnGround = player.onGround;
  player.onGround = false;

  for (const tile of tiles) {
    if (tile.type === 'pit') continue; // Can't stand on air

    const px1 = player.x;
    const px2 = player.x + player.w;
    const py2 = player.y + player.h;

    const overlap  = px2 > tile.x && px1 < tile.x + tile.w;
    const wasAbove = (py2 - player.vy) <= tile.y + 2;

    if (overlap && wasAbove && py2 >= tile.y && player.vy >= 0) {
      player.y        = tile.y - player.h;
      player.vy       = 0;
      player.onGround = true;
    }
  }

  if (player.onGround) player.jumpsLeft = MAX_JUMPS;
  return !wasOnGround && player.onGround;
}

// ── Tile scrolling ───────────────────────────────────────────
function scrollTiles(dt, speed) {
  const shift = speed * dt;

  for (const seg of tiles) {
    seg.x -= shift;
  }

  // Remove segments that have scrolled fully off the left edge
  while (tiles.length > 0 && tiles[0].x + tiles[0].w < 0) {
    tiles.shift();
  }

  // Spawn new segments to keep the right side filled
  const lastSeg    = tiles[tiles.length - 1];
  const rightmostX = lastSeg ? lastSeg.x + lastSeg.w : 0;
  if (rightmostX < CANVAS_W + 300) {
    tiles.push(generateLevelSegment(rightmostX, CANVAS_W, GROUND_Y));
  }
}

// ── Rendering ────────────────────────────────────────────────
function drawBackground() {
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawTiles() {
  ctx.lineWidth = 1;

  for (const seg of tiles) {
    if (seg.type === 'pit') continue;

    if (seg.type === 'platform') {
      ctx.fillStyle   = '#5a6eab';
      ctx.strokeStyle = '#3a4e8b';
    } else {
      ctx.fillStyle   = '#3a8c5c';
      ctx.strokeStyle = '#2a6c42';
    }
    ctx.fillRect(seg.x, seg.y, seg.w, seg.h);
    ctx.strokeRect(seg.x + 0.5, seg.y + 0.5, seg.w - 1, seg.h - 1);
  }
}

function draw() {
  let shakeX = 0, shakeY = 0;
  if (shakeFrames > 0) {
    shakeX = (Math.random() * 2 - 1) * shakeMag;
    shakeY = (Math.random() * 2 - 1) * shakeMag;
    shakeFrames--;
    shakeMag = Math.max(0, shakeMag - 0.5);
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground();
  drawTiles();
  drawObstacles(ctx, obstacles);
  drawPowerups(ctx, powerups);
  drawPlayer(ctx, player);
  drawParticles(ctx, particles);
  drawHUD(ctx, state, score, attempts, CANVAS_W, CANVAS_H, currentQuiz);
  if (state === 'feedback') {
    drawQuizFeedback(ctx, currentQuiz, quizFeedback.isCorrect, CANVAS_W, CANVAS_H);
  }
  if (state === 'dead' && lastHitObstacle) {
    drawDeathTip(ctx, lastHitObstacle, CANVAS_W, CANVAS_H);
  }
  ctx.restore();
}

// ── Game loop ────────────────────────────────────────────────
let lastTime = 0;
const TARGET_FPS = 60;
const FRAME_MS   = 1000 / TARGET_FPS;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const elapsed = timestamp - lastTime;
  if (elapsed < FRAME_MS * 0.8) return;   // skip if too soon (no dt needed here)

  // dt: 1.0 = one frame at 60 fps; caps at 3 frames to prevent spiral of death
  const dt = Math.min(elapsed / FRAME_MS, 3);
  lastTime = timestamp;

  particles = updateParticles(particles, dt);

  if (state === 'playing') {
    applyGravity(dt);
    const justLanded = resolveGroundCollisions();
    updatePlayerAnimation(player, dt);

    if (justLanded) {
      player.scaleX = 1.4;
      player.scaleY = 0.7;
      spawnLandingParticles(particles, player);
      // Add a subtle "thud" to the camera
      shakeFrames = Math.max(shakeFrames, 5);
      shakeMag = Math.max(shakeMag, 2);
    }

    const dynamicSpeed = BASE_SPEED + (score * 0.1);
    scrollTiles(dt, dynamicSpeed);

    scoreTimer += dt;
    if (scoreTimer >= 60) { score++; scoreTimer -= 60; }

    // ── Obstacle spawning & scrolling ───────────────────────
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle(obstacles, CANVAS_W, GROUND_Y, CANVAS_H);
      spawnTimer = 90 + Math.random() * 60;
    }
    obstacles = scrollObstacles(obstacles, dt, dynamicSpeed);

    // ── Powerup spawning & scrolling ────────────────────────
    powerupTimer -= dt;
    if (powerupTimer <= 0) {
      spawnPowerup(powerups, CANVAS_W, GROUND_Y);
      powerupTimer = 300 + Math.random() * 200; // ~5-8 s between shields
    }
    powerups = scrollPowerups(powerups, dt, dynamicSpeed);
    checkPowerupCollisions(player, powerups);

    // ── Obstacle collision ──────────────────────────────────
    const hit = checkCollisions(player, obstacles);
    if (hit) {
      if (player.hasShield) {
        // Shield absorbs the hit
        player.hasShield = false;
        obstacles = obstacles.filter(o => o !== hit);
        spawnShieldBreakParticles(particles, player);
        shakeFrames = 6;
        shakeMag    = 3;
      } else {
        lastHitObstacle = hit;
        attempts++;
        state        = 'quiz';
        shakeFrames  = 12;
        shakeMag     = 6;
        quizLoading  = false;
        spawnDeathParticles(particles, player);
        loadNewQuestion();
      }
    }

    if (checkFallDeath(player, CANVAS_H)) {
      attempts++;
      state       = 'quiz';
      shakeFrames = 12;
      shakeMag    = 6;
      quizLoading = false;
      spawnDeathParticles(particles, player);
      loadNewQuestion();
    }
  }

  draw();
}

requestAnimationFrame((ts) => {
  lastTime = ts;
  requestAnimationFrame(loop);
});
