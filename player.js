// ============================================================
// player.js — Player state, animation, and particles
// ============================================================

const runSheet  = new Image();  runSheet.src  = 'brady_run.png';
const jumpSheet = new Image();  jumpSheet.src = 'brady_jump.png';
const fallSheet = new Image();  fallSheet.src = 'brady_fall.png';

// RUN_FRAMES — number of horizontal frames on brady_run.png
const RUN_FRAMES = 4;

// ── Player factory ───────────────────────────────────────────
// GROUND_Y passed as param to avoid circular import with game.js
export function initPlayer(GROUND_Y) {
  return {
    x:         80,
    y:         GROUND_Y - 50,
    w:         32,
    h:         50,
    vy:        0,
    onGround:  true,
    jumpsLeft: 2,
    angle:     0,
    scaleX:    1,
    scaleY:    1,
    frame:     0,
    animTimer: 0,
  };
}

// ── Animation update ─────────────────────────────────────────
// Call once per frame while playing or dead
export function updatePlayerAnimation(player, dt) {
  if (player.onGround) {
    // Advance run cycle (4 frames on brady_run.png)
    player.animTimer += dt;
    if (player.animTimer > 6) {
      player.frame  = (player.frame + 1) % 4;
      player.animTimer = 0;
    }
  }
  player.angle = 0; // sprite art handles orientation; keep upright

  // Lerp scaleX/Y back to 1 (squash / stretch recovery)
  player.scaleX += (1 - player.scaleX) * 0.2 * dt;
  player.scaleY += (1 - player.scaleY) * 0.2 * dt;
}

// ── Rendering ────────────────────────────────────────────────
export function drawPlayer(ctx, player) {
  const { x, y, w, h, angle, scaleX, scaleY } = player;

  let activeImg, sx, sourceW, sourceH;
  if (!player.onGround) {
    activeImg = player.vy < 0 ? jumpSheet : fallSheet;
    // Single-pose sheet: sample the full image
    sourceW = activeImg.naturalWidth  || activeImg.width  || 1024;
    sourceH = activeImg.naturalHeight || activeImg.height || 1024;
    sx = 0;
  } else {
    activeImg = runSheet;
    // 4-frame horizontal strip: each cell is 1/4 of the sheet width
    const sheetW = runSheet.naturalWidth  || runSheet.width  || 1024;
    const sheetH = runSheet.naturalHeight || runSheet.height || 1024;
    sourceW = sheetW / RUN_FRAMES;
    sourceH = sheetH;
    sx      = player.frame * sourceW;
  }

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);

  if (activeImg.complete && activeImg.naturalWidth > 0) {
    // Dest: 80×100 centered over the 32×50 physics hitbox
    // -40 horizontally centers the 80px draw on x=0
    // -60 places the top 10px above center so feet land at y=+50
    ctx.drawImage(activeImg, sx, 0, sourceW, sourceH, -40, -60, 80, 100);
  } else {
    // Fallback: orange box while sheets load
    ctx.fillStyle = '#e8a020';
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  // Shield ring — drawn on top of sprite so it's always visible
  if (player.hasShield) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth   = 3;
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(0, -10, 44, 0, Math.PI * 2); // slightly larger than sprite, offset up
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// ── Shield-break particles ────────────────────────────────────
export function spawnShieldBreakParticles(particles, player) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  for (let i = 0; i < 16; i++) {
    particles.push({
      x:     cx,
      y:     cy,
      vx:    (Math.random() - 0.5) * 7,
      vy:    -Math.random() * 5,
      color: '#4ade80',
      life:  1.0,
    });
  }
}

// ── Death particles ─────────────────────────────────────────
export function spawnDeathParticles(particles, player) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  for (let i = 0; i < 20; i++) {
    particles.push({
      x:     cx,
      y:     cy,
      vx:    (Math.random() - 0.5) * 6,
      vy:    -Math.random() * 5,
      color: i % 2 === 0 ? '#ff4444' : '#ffaa00',
      life:  1.0,
    });
  }
}

// ── Landing particles ────────────────────────────────────────
// Spawns 6 dust particles at player feet on landing
export function spawnLandingParticles(particles, player) {
  const cx = player.x + player.w / 2;
  const py = player.y + player.h;
  for (let i = 0; i < 6; i++) {
    particles.push({
      x:     cx,
      y:     py,
      vx:    (Math.random() - 0.5) * 4,
      vy:    -(1 + Math.random()),
      color: '#7ecfff',
      life:  0.6,
    });
  }
}

// ── Particle update ──────────────────────────────────────────
// Returns filtered array with dead particles removed
export function updateParticles(particles, dt) {
  for (const p of particles) {
    p.vy   += 0.2 * dt;
    p.x    += p.vx * dt;
    p.y    += p.vy * dt;
    p.life -= 0.03 * dt;
  }
  return particles.filter(p => p.life > 0);
}

// ── Particle draw ────────────────────────────────────────────
export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }
  ctx.globalAlpha = 1;
}
