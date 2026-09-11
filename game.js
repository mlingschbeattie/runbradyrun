// ============================================================
// game.js — Run Brady Run: Cyber Infiltration Core Controller
// High-Octane Cyber Rhythm Arcade: Multi-Mode Vehicles (Cube, Ship, Wave),
// Green Dash Orbs, Speed Gates, Dynamic Camera, & CompTIA Bypass.
// ============================================================

import {
  BLOCK_SIZE, BASE_SPEED, JUMP_VY,
  updatePlayerPhysics, resolveBlockCollisions,
  checkPadCollisions, checkOrbInteractions,
  checkPortalCollisions, checkHazardCollisions
} from './physics.js';
import { scrollObjects } from './obstacles.js';
import { LevelManager, LEVEL_GOAL_DISTANCE } from './level.js';
import {
  CHARACTERS, initPlayer, updatePlayerVisuals, drawPlayer,
  spawnDeathParticles, spawnLandingSparks, updateParticles, drawParticles
} from './player.js';
import {
  initEnvironment, updateEnvironment, drawEnvironment, triggerBeatPulse
} from './environment.js';
import {
  drawFloorAndCeiling, drawBlocks, drawSpikes, drawSaws,
  drawPads, drawOrbs, drawPortals, drawPackets, drawSpeedVFX,
  addFloatingText, updateFloatingTexts, drawFloatingTexts
} from './render.js';
import {
  drawProgressBar, drawPlayingHUD, drawCrashScreen,
  drawQuizOverlay, drawQuizFeedback, drawMenu, drawCharacterSelect, drawIntelModal,
  drawLeaderboardScreen, drawVictoryScreen
} from './hud.js';
import {
  playJumpSound, playPadSound, playOrbSound, playDashSound, playPortalSound, playGravitySound,
  playCrashSound, playShieldSound, playPacketSound,
  playQuizSuccessSound, playQuizFailSound, playVictorySound,
  startBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic,
  toggleMute, getMuted, setOnBeatCallback,
  switchMusicTrack, getCurrentTrackName, TRACKS
} from './audio.js';
import {
  initStudentIdentity, getStudentName, setStudentName,
  getLeaderboard, submitRunScore
} from './leaderboard.js';
import { fetchQuizQuestion } from './supabase.js';
import { setupInput } from './input.js';
import { loadAllAssets } from './assets.js';

// Preload all commercial-grade 2D game assets & resolve Beattie Tech identity
loadAllAssets();
initStudentIdentity();

// ── Screen and Dimensions ─────────────────────────────────────
let CANVAS_W = window.innerWidth;
let CANVAS_H = window.innerHeight;
const GROUND_PCT = 0.75;
const CEILING_H = 48;
let GROUND_Y = Math.floor(CANVAS_H * GROUND_PCT);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

function handleResize() {
  CANVAS_W = window.innerWidth;
  CANVAS_H = window.innerHeight;
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  GROUND_Y = Math.floor(CANVAS_H * GROUND_PCT);
  if (levelManager) {
    levelManager.reset(CANVAS_W, GROUND_Y, CEILING_H);
  }
}
window.addEventListener('resize', handleResize);

// ── Game States ───────────────────────────────────────────────
let state = 'menu';
let selectedCharacter = 'Admin';
let attempts = 1;
let score = 0;
let distanceTraveled = 0;
let scrollOffset = 0;
let isHoldingJump = false;
let screenShake = 0;
let currentCameraZoom = 1.0;
let lastHitObstacle = null;
let currentQuiz = null;
let quizLoading = false;
let quizFeedback = { isCorrect: false };
let finalVictoryRank = null;
let leaderboardData = getLeaderboard();
let lastPhaseIndex = 0;

// ── World Entities ───────────────────────────────────────────
let player = initPlayer(GROUND_Y, selectedCharacter);
let environment = initEnvironment(CANVAS_W, CANVAS_H);
setOnBeatCallback(() => {
  triggerBeatPulse(environment);
});
let levelManager = new LevelManager(CANVAS_W, GROUND_Y, CEILING_H);

let hazards = [];
let blocks = [];
let pads = [];
let orbs = [];
let portals = [];
let packets = [];
let particles = [];

function initFloorBlocks() {
  const list = [];
  list.push({
    type: 'floor',
    x: -100,
    y: GROUND_Y,
    w: CANVAS_W + 800,
    h: CANVAS_H - GROUND_Y,
  });
  return list;
}
let floorBlocks = initFloorBlocks();

// ── Level Reset & Run Starter ────────────────────────────────
function startNewRun() {
  state = 'playing';
  player = initPlayer(GROUND_Y, selectedCharacter);
  distanceTraveled = 0;
  scrollOffset = 0;
  score = 0;
  currentCameraZoom = 1.0;
  lastHitObstacle = null;
  finalVictoryRank = null;
  lastPhaseIndex = 0;
  hazards = [];
  blocks = [];
  pads = [];
  orbs = [];
  portals = [];
  packets = [];
  particles = [];
  floorBlocks = initFloorBlocks();

  levelManager.reset(CANVAS_W, GROUND_Y, CEILING_H);
  levelManager.spawnNextChunks(hazards, blocks, pads, orbs, packets, portals);
  startBackgroundMusic(true);
}

function triggerCrash(obstacle) {
  if (state !== 'playing') return;
  state = 'crashed';
  lastHitObstacle = obstacle;
  screenShake = 18;
  currentCameraZoom = 1.0;
  playCrashSound();
  spawnDeathParticles(particles, player);
  attempts++;

  // Record score/progress to Beattie Tech leaderboard
  const currentPct = Math.min(100, Math.floor((distanceTraveled / LEVEL_GOAL_DISTANCE) * 100));
  if (currentPct >= 10 || score > 0) {
    submitRunScore({
      score,
      percent: currentPct,
      attempts,
      character: selectedCharacter,
      completed: false
    }).then(() => {
      leaderboardData = getLeaderboard();
    });
  }
}

function triggerVictory() {
  if (state !== 'playing') return;
  state = 'victory';
  playVictorySound();
  screenShake = 14;

  // Celebratory cyber particle fireworks
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 3 + Math.random() * 9;
    particles.push({
      type: 'spark',
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      radius: 3 + Math.random() * 4,
      color: Math.random() > 0.6 ? '#00ff88' : Math.random() > 0.3 ? '#ffd000' : '#00f0ff',
      alpha: 1,
      life: 1.2 + Math.random() * 0.8
    });
  }

  addFloatingText('★ FIREWALL BREACHED! ★', player.x, player.y - 60, '#00ff88');

  // Submit victorious 100% completion to Beattie Tech leaderboard
  submitRunScore({
    score,
    percent: 100,
    attempts,
    character: selectedCharacter,
    completed: true
  }).then(({ rank }) => {
    finalVictoryRank = rank;
    leaderboardData = getLeaderboard();
  });
}

// ── Input Event Handlers ─────────────────────────────────────
function onJumpPress() {
  isHoldingJump = true;
  startBackgroundMusic();

  if (state === 'menu') {
    startNewRun();
    return;
  }

  if (state === 'char_select' || state === 'intel') {
    state = 'menu';
    return;
  }

  if (state === 'playing') {
    // 1. Interactive Jump Orbs & Green Dash Rings
    const orb = checkOrbInteractions(player, orbs);
    if (orb) {
      player.scaleY = 1.25;
      player.scaleX = 0.8;

      if (orb.orbType === 'dash_green') {
        playDashSound();
        addFloatingText('>>> LASER DASH!', orb.x, orb.y - 30, '#00ff88');
      } else if (orb.orbType === 'blue') {
        playGravitySound();
        addFloatingText('🌀 GRAV FLIP', orb.x, orb.y - 30, '#00f0ff');
      } else {
        playOrbSound();
        addFloatingText('▲ AIR BOOST', orb.x, orb.y - 30, '#ffd000');
      }

      particles.push({
        type: 'shockwave',
        x: orb.x + orb.w / 2,
        y: orb.y + orb.h / 2,
        radius: 8,
        speed: 7,
        color: orb.orbType === 'dash_green' ? '#00ff88' : orb.orbType === 'blue' ? '#00f0ff' : '#ffd000',
        alpha: 1,
        life: 0.6,
      });
      return;
    }

    // 2. Standard Cube Ground Jump
    if (player.mode === 'cube' && player.onGround) {
      player.vy = JUMP_VY * player.gravityDir;
      player.onGround = false;
      player.scaleY = 1.25;
      player.scaleX = 0.8;
      playJumpSound();
    }
  }
}

function onJumpRelease() {
  isHoldingJump = false;
  if (player) {
    player.isDashing = false;
  }
}

function onRetry() {
  if (state === 'crashed') {
    startNewRun();
  }
}

async function onQuizTrigger() {
  if (state !== 'crashed') return;
  state = 'quiz';
  quizLoading = true;
  currentQuiz = null;
  currentQuiz = await fetchQuizQuestion();
  quizLoading = false;
}

function onQuizAnswer(choiceIdx) {
  if (state !== 'quiz' || !currentQuiz || quizLoading) return;
  if (choiceIdx < 0 || choiceIdx >= currentQuiz.options.length) return;

  const isCorrect = currentQuiz.options[choiceIdx] === currentQuiz.answer;
  quizFeedback.isCorrect = isCorrect;

  if (isCorrect) {
    playQuizSuccessSound();
  } else {
    playQuizFailSound();
    screenShake = 10;
  }

  state = 'feedback';
}

function onFeedbackAdvance() {
  if (state !== 'feedback') return;

  if (quizFeedback.isCorrect) {
    state = 'playing';
    player.y = player.gravityDir === 1 ? GROUND_Y - player.h : CEILING_H;
    player.vy = 0;
    player.onGround = true;
    player.hasShield = true;
    particles = [];
    hazards = hazards.filter(h => h.x > player.x + 220 || h.x + (h.w || 48) < player.x - 50);
    addFloatingText('🛡️ FIREWALL SHIELD DEPLOYED', player.x, player.y - 45, '#00ff88');
    resumeBackgroundMusic();
  } else {
    state = 'crashed';
  }
}

function onMenuClick(action) {
  startBackgroundMusic();
  if (action === 'open_operators') {
    state = 'char_select';
    return;
  }
  if (action === 'open_intel') {
    state = 'intel';
    return;
  }
  if (action === 'open_leaderboard') {
    leaderboardData = getLeaderboard();
    state = 'leaderboard';
    return;
  }
  if (action === 'edit_callsign') {
    const current = getStudentName();
    const next = window.prompt('Enter your Beattie Tech Operative Callsign:', current);
    if (next && next.trim()) {
      setStudentName(next.trim());
      leaderboardData = getLeaderboard();
    }
    return;
  }
  if (action === 'back_to_menu') {
    state = 'menu';
    return;
  }
  if (state === 'char_select') {
    if (action && CHARACTERS[action]) {
      selectedCharacter = action;
      if (player) player.character = action;
    }
    state = 'menu';
    return;
  }
  if (state === 'menu') {
    startNewRun();
  }
}

function onMuteToggle() {
  toggleMute();
}

function onCycleTrack() {
  const keys = Object.keys(TRACKS);
  const currentName = getCurrentTrackName();
  let nextIdx = 0;
  keys.forEach((k, i) => {
    if (TRACKS[k].name === currentName) {
      nextIdx = (i + 1) % keys.length;
    }
  });
  switchMusicTrack(keys[nextIdx]);
}

// ── Setup Input ──────────────────────────────────────────────
setupInput(canvas, {
  getState: () => state,
  onJumpPress,
  onJumpRelease,
  onQuizAnswer,
  onQuizTrigger,
  onRetry,
  onFeedbackAdvance,
  onMenuClick,
  onMuteToggle,
  onCycleTrack,
});

// ── Game Loop ────────────────────────────────────────────────
let lastTime = performance.now();
const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const elapsed = timestamp - lastTime;
  if (elapsed < FRAME_MS * 0.75) return;
  const dt = Math.min(elapsed / FRAME_MS, 2.5);
  lastTime = timestamp;

  // ── 1. Update Physics and State ─────────────────────────────
  particles = updateParticles(particles, dt);
  updateFloatingTexts(dt);

  if (state === 'playing') {
    const effectiveSpeed = BASE_SPEED * (player.speedMult || 1.0);

    // Cube auto-buffer jump on ground
    if (isHoldingJump && player.onGround && player.mode === 'cube') {
      player.vy = JUMP_VY * player.gravityDir;
      player.onGround = false;
      player.scaleY = 1.25;
      player.scaleX = 0.8;
      playJumpSound();
    }

    // Continuous Dash / Orb interaction while holding
    if (isHoldingJump) {
      const orb = checkOrbInteractions(player, orbs);
      if (orb) {
        playOrbSound();
        player.scaleY = 1.25;
        player.scaleX = 0.8;
      }
    }

    // Apply Multi-Mode Physics (Cube / Ship / Wave / Dash)
    updatePlayerPhysics(player, dt, isHoldingJump, effectiveSpeed);

    // Block & Floor Collisions
    const allSolidBlocks = [...floorBlocks, ...blocks];
    const colResult = resolveBlockCollisions(player, allSolidBlocks);

    if (colResult.crashed) {
      triggerCrash(colResult.tile);
    } else if (colResult.justLanded) {
      player.scaleY = 0.82;
      player.scaleX = 1.18;
      spawnLandingSparks(particles, player);
    }

    // Check Jump Pads (Yellow & Pink springboards)
    const pad = checkPadCollisions(player, pads);
    if (pad) {
      playPadSound();
      player.scaleY = 1.35;
      player.scaleX = 0.75;
      addFloatingText('▲ BOUNCE!', pad.x + pad.w / 2, pad.y - 25, '#ffd000');
      particles.push({
        type: 'shockwave',
        x: pad.x + pad.w / 2,
        y: pad.y,
        radius: 6,
        speed: 8,
        color: pad.padType === 'yellow' ? '#ffd000' : '#ff00aa',
        alpha: 1,
        life: 0.5,
      });
    }

    // Check Mode Portals (Wave, Ship, Cube, Gravity, Speed)
    const portal = checkPortalCollisions(player, portals);
    if (portal) {
      playPortalSound();
      if (portal.portalType === 'mode_wave') {
        addFloatingText('⚡ WAVE: HOLD UP / RELEASE DOWN', player.x, player.y - 45, '#00f0ff');
      } else if (portal.portalType === 'mode_ship') {
        addFloatingText('🚀 SHIP: HOLD TO FLY UP', player.x, player.y - 45, '#ff00aa');
      } else if (portal.portalType === 'mode_cube') {
        addFloatingText('🟩 CUBE: JUMP & HOP', player.x, player.y - 45, '#00ff88');
      } else if (portal.portalType === 'speed_2x') {
        addFloatingText('>> 2X OVERDRIVE!', player.x, player.y - 45, '#ffd000');
      } else if (portal.portalType === 'gravity_flip') {
        addFloatingText('🌀 GRAVITY INVERTED!', player.x, player.y - 45, '#38bdf8');
      }

      particles.push({
        type: 'shockwave',
        x: portal.x + portal.w / 2,
        y: portal.y + portal.h / 2,
        radius: 14,
        speed: 10,
        color: portal.portalType.includes('wave') ? '#00f0ff' : portal.portalType.includes('ship') ? '#ff00aa' : '#00ff88',
        alpha: 1,
        life: 0.7,
      });
    }

    // Check Lethal Spikes & Saws
    const hitHazard = checkHazardCollisions(player, hazards);
    if (hitHazard) {
      if (player.hasShield) {
        player.hasShield = false;
        playShieldSound();
        hazards = hazards.filter(h => h !== hitHazard);
        screenShake = 7;
        addFloatingText('🛡️ HIT DEFLECTED!', player.x, player.y - 45, '#00ff88');
      } else {
        triggerCrash(hitHazard);
      }
    }

    // Check Collectible Packets
    for (const p of packets) {
      if (!p.collected) {
        const px1 = player.x, px2 = player.x + player.w;
        const py1 = player.y, py2 = player.y + player.h;
        if (px2 > p.x && px1 < p.x + p.w && py2 > p.y && py1 < p.y + p.h) {
          p.collected = true;
          score += 10;
          playPacketSound();
          addFloatingText('+10 PACKETS', p.x, p.y - 20, '#00ff88');
        }
      }
    }

    // Void death check
    if (player.y > CANVAS_H + 80 || player.y < -120) {
      triggerCrash({ tips: ['Network packet dropped outside routing bounds. Check subnet masks and gateways.'] });
    }

    // ── Check Victory / Level Completion ──────────────────────
    if (distanceTraveled >= LEVEL_GOAL_DISTANCE) {
      triggerVictory();
    }

    // ── Level Scrolling & Continuous Spawning ─────────────────
    const scrollStep = effectiveSpeed * dt;
    distanceTraveled += scrollStep;
    scrollOffset += scrollStep;

    // ── Phase Milestone Notification ──
    const currentPhase = Math.floor((distanceTraveled / LEVEL_GOAL_DISTANCE) * 6);
    if (currentPhase > lastPhaseIndex && currentPhase <= 5) {
      lastPhaseIndex = currentPhase;
      const phaseNames = [
        'PHASE 1: PERIMETER INGRESS',
        'PHASE 2: ROCKET CAVERN',
        'PHASE 3: LASER OVERDRIVE',
        'PHASE 4: 45° DART WAVE',
        'PHASE 5: QUANTUM INVERSION',
        'FINAL GATE: MAINFRAME EXTRACTION'
      ];
      addFloatingText(`// ${phaseNames[currentPhase]} //`, player.x + 60, player.y - 45, '#00f0ff');
    }

    levelManager.scroll(scrollStep);
    levelManager.spawnNextChunks(hazards, blocks, pads, orbs, packets, portals);

    hazards = scrollObjects(hazards, dt, effectiveSpeed);
    blocks = scrollObjects(blocks, dt, effectiveSpeed);
    pads = scrollObjects(pads, dt, effectiveSpeed);
    orbs = scrollObjects(orbs, dt, effectiveSpeed);
    portals = scrollObjects(portals, dt, effectiveSpeed);
    packets = scrollObjects(packets, dt, effectiveSpeed);

    updateEnvironment(environment, dt, effectiveSpeed, CANVAS_W, CANVAS_H);
    updatePlayerVisuals(player, dt);

    // ── Dynamic Camera Zoom ──────────────────────────────────
    let targetZoom = 1.0;
    if (player.mode === 'wave') targetZoom = 1.14;
    else if (player.speedMult > 1.1 || player.isDashing) targetZoom = 0.94;
    currentCameraZoom += (targetZoom - currentCameraZoom) * 0.08 * dt;
  }

  // ── 2. Render ───────────────────────────────────────────────
  ctx.save();

  // Screen shake
  if (screenShake > 0) {
    const sx = (Math.random() * 2 - 1) * screenShake;
    const sy = (Math.random() * 2 - 1) * screenShake;
    ctx.translate(sx, sy);
    screenShake = Math.max(0, screenShake - 1.2 * dt);
  }

  // Dynamic Camera Zoom
  if (state === 'playing') {
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.scale(currentCameraZoom, currentCameraZoom);
    ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
  }

  const percent = Math.min(100, Math.floor((distanceTraveled / LEVEL_GOAL_DISTANCE) * 100));

  // Background
  drawEnvironment(ctx, environment, CANVAS_W, CANVAS_H, GROUND_Y, CEILING_H, percent);

  if (state === 'menu') {
    drawMenu(ctx, CANVAS_W, CANVAS_H, player);
  } else if (state === 'char_select') {
    drawCharacterSelect(ctx, CANVAS_W, CANVAS_H, CHARACTERS);
  } else if (state === 'intel') {
    drawIntelModal(ctx, CANVAS_W, CANVAS_H);
  } else if (state === 'leaderboard') {
    drawLeaderboardScreen(ctx, CANVAS_W, CANVAS_H, leaderboardData, getStudentName());
  } else {
    // World Elements
    drawFloorAndCeiling(ctx, CANVAS_W, CANVAS_H, GROUND_Y, CEILING_H, scrollOffset);
    drawBlocks(ctx, blocks);
    drawPads(ctx, pads);
    drawOrbs(ctx, orbs);
    drawPortals(ctx, portals);
    drawPackets(ctx, packets);
    drawSpikes(ctx, hazards.filter(h => h.type === 'spike'));
    drawSaws(ctx, hazards.filter(h => h.type === 'saw'));

    // Player
    if (state === 'playing' || state === 'victory') {
      drawPlayer(ctx, player);
    }

    // Particles & Floating Text Popups
    drawParticles(ctx, particles);
    drawFloatingTexts(ctx);

    // High-Speed Edge Motion Lines
    if (state === 'playing') {
      drawSpeedVFX(ctx, CANVAS_W, CANVAS_H, player.speedMult || 1.0, player.isDashing);
    }

    // Top Progress Bar & Real-time Playing HUD
    drawProgressBar(ctx, percent, CANVAS_W);
    drawPlayingHUD(ctx, score, attempts, CANVAS_W, getMuted(), player);

    // Overlays
    if (state === 'crashed') {
      drawCrashScreen(ctx, lastHitObstacle, CANVAS_W, CANVAS_H, attempts, score, percent);
    } else if (state === 'victory') {
      drawVictoryScreen(ctx, CANVAS_W, CANVAS_H, score, attempts, getStudentName(), finalVictoryRank);
    } else if (state === 'quiz') {
      drawQuizOverlay(ctx, currentQuiz, CANVAS_W, CANVAS_H);
    } else if (state === 'feedback') {
      drawQuizFeedback(ctx, currentQuiz, quizFeedback.isCorrect, CANVAS_W, CANVAS_H);
    }
  }

  ctx.restore();
}

requestAnimationFrame((ts) => {
  lastTime = ts;
  requestAnimationFrame(loop);
});
