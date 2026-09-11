// ============================================================
// player.js — Cyber Infiltration Multi-Form Player Renderer
// Renders Cube, Ship (Rocket Drone with thrusters), Wave (Dart),
// Dash Streaks, and 14-Shard Shattering Death FX.
// ============================================================

import { BLOCK_SIZE } from './physics.js';
import { SPRITES } from './assets.js';

export const CHARACTERS = {
  Admin: {
    name: 'The Admin',
    title: 'Network Systems Admin',
    primaryColor: '#00f0ff',
    secondaryColor: '#0c1b33',
    glowColor: '#00f0ff',
    emblem: 'admin',
  },
  Owner: {
    name: 'The Owner',
    title: 'Executive SecOps Owner',
    primaryColor: '#ffb703',
    secondaryColor: '#2b1e06',
    glowColor: '#ffb703',
    emblem: 'owner',
  },
  Specialist: {
    name: 'The Specialist',
    title: 'Offensive Security Specialist',
    primaryColor: '#ff0055',
    secondaryColor: '#200511',
    glowColor: '#ff0055',
    emblem: 'specialist',
  },
};

export function initPlayer(GROUND_Y, characterKey = 'Admin') {
  const size = BLOCK_SIZE;
  return {
    x: 140,
    y: GROUND_Y - size,
    w: size,
    h: size,
    vy: 0,
    onGround: true,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    gravityDir: 1,
    character: characterKey,
    mode: 'cube', // 'cube' | 'ship' | 'wave'
    isDashing: false,
    speedMult: 1.0,
    hasShield: false,
    trail: [],
    prevY: GROUND_Y - size,
  };
}

/**
 * Updates player visual scale recovery and mode trails
 */
export function updatePlayerVisuals(player, dt) {
  player.scaleX += (1 - player.scaleX) * 0.25 * dt;
  player.scaleY += (1 - player.scaleY) * 0.25 * dt;

  const mode = player.mode || 'cube';
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;

  if (player.trail) {
    player.trail.unshift({
      x: cx,
      y: cy,
      angle: player.angle,
      mode,
      alpha: mode === 'wave' ? 0.9 : 0.6,
      size: player.w * (mode === 'wave' ? 0.5 : 0.8),
    });

    const maxTrail = mode === 'wave' ? 18 : 8;
    if (player.trail.length > maxTrail) {
      player.trail.pop();
    }

    for (const t of player.trail) {
      t.alpha -= (mode === 'wave' ? 0.04 : 0.07) * dt;
    }
  }
}

/**
 * Renders player in Cube, Ship, or Wave form
 */
export function drawPlayer(ctx, player) {
  const config = CHARACTERS[player.character] || CHARACTERS.Admin;
  const { x, y, w, h, angle, scaleX, scaleY, mode } = player;
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.save();

  // ── 1. Wave Mode Continuous Energy Trail ────────────────────
  if (mode === 'wave' && player.trail && player.trail.length > 1) {
    ctx.save();
    ctx.strokeStyle = config.glowColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(player.trail[0].x, player.trail[0].y);
    for (let i = 1; i < player.trail.length; i++) {
      ctx.lineTo(player.trail[i].x, player.trail[i].y);
    }
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  } else if (player.trail) {
    // Cube / Ship motion ghosting
    for (const t of player.trail) {
      if (t.alpha <= 0) continue;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.globalAlpha = Math.max(0, t.alpha * 0.35);
      if (t.mode === 'ship' && SPRITES.shipDrone && SPRITES.shipDrone.complete && SPRITES.shipDrone.naturalWidth > 0) {
        ctx.drawImage(SPRITES.shipDrone, -t.size * 0.75, -t.size * 0.375, t.size * 1.5, t.size * 0.75);
      } else if (SPRITES.cubeHero && SPRITES.cubeHero.complete && SPRITES.cubeHero.naturalWidth > 0) {
        ctx.drawImage(SPRITES.cubeHero, -t.size / 2, -t.size / 2, t.size, t.size);
      } else {
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(-t.size / 2, -t.size / 2, t.size, t.size);
      }
      ctx.restore();
    }
  }

  // ── 2. Player Form Rendering ────────────────────────────────
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);

  const half = w / 2;

  if (mode === 'wave') {
    // ── THE WAVE: High-Definition Cyber Wave Dart ───────────────
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = 16;

    if (SPRITES.waveDart && SPRITES.waveDart.complete && SPRITES.waveDart.naturalWidth > 0) {
      const dw = w * 1.35;
      const dh = h * 0.85;
      ctx.drawImage(SPRITES.waveDart, -dw * 0.55, -dh / 2, dw, dh);
    } else {
      // Procedural Fallback
      ctx.fillStyle = config.primaryColor;
      ctx.beginPath();
      ctx.moveTo(half + 4, 0);       // Nose
      ctx.lineTo(-half, -half + 2);  // Top wing
      ctx.lineTo(-half + 8, 0);      // Inner notch
      ctx.lineTo(-half, half - 2);   // Bottom wing
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = config.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(half - 4, 0);
      ctx.lineTo(-half + 4, -half + 7);
      ctx.lineTo(-half + 10, 0);
      ctx.lineTo(-half + 4, half - 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-half + 14, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (mode === 'ship') {
    // ── THE SHIP: High-Definition Rocket Ship Drone ─────────────
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = 14;

    // Rear Thruster Flame Exhaust
    const flameLen = 16 + Math.random() * 12;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(-w * 0.72 + 2, -5);
    ctx.lineTo(-w * 0.72 - flameLen, 0);
    ctx.lineTo(-w * 0.72 + 2, 5);
    ctx.closePath();
    ctx.fill();

    if (SPRITES.shipDrone && SPRITES.shipDrone.complete && SPRITES.shipDrone.naturalWidth > 0) {
      const dw = w * 1.5;
      const dh = h * 0.75;
      ctx.drawImage(SPRITES.shipDrone, -w * 0.75, -dh / 2, dw, dh);
    } else {
      // Procedural Fallback
      ctx.fillStyle = config.primaryColor;
      ctx.beginPath();
      ctx.moveTo(half + 6, 0);       // Nose tip
      ctx.lineTo(half - 4, -half + 6); // Top forward
      ctx.lineTo(-half + 2, -half + 8); // Top tail
      ctx.lineTo(-half + 2, half - 8);  // Bottom tail
      ctx.lineTo(half - 4, half - 6);  // Bottom forward
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = config.secondaryColor;
      ctx.fillRect(-half + 12, -half + 12, w - 24, h - 24);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-half + 18, -4, 8, 8);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-half + 8, -half + 8);
      ctx.lineTo(-half - 2, -half + 2);
      ctx.moveTo(-half + 8, half - 8);
      ctx.lineTo(-half - 2, half - 2);
      ctx.stroke();
    }

  } else {
    // ── THE CUBE: High-Definition Cybernetic Operator Cube ──────
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = 16;

    if (SPRITES.cubeHero && SPRITES.cubeHero.complete && SPRITES.cubeHero.naturalWidth > 0) {
      ctx.drawImage(SPRITES.cubeHero, -half, -half, w, h);

      // Character-specific energetic border if non-default
      if (player.character === 'Owner' || player.character === 'Specialist') {
        ctx.save();
        ctx.strokeStyle = config.glowColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = config.glowColor;
        ctx.shadowBlur = 12;
        ctx.strokeRect(-half + 2, -half + 2, w - 4, h - 4);
        ctx.restore();
      }
    } else {
      // Procedural Fallback
      ctx.fillStyle = config.primaryColor;
      ctx.fillRect(-half, -half, w, h);

      ctx.shadowBlur = 0;
      ctx.fillStyle = config.secondaryColor;
      ctx.fillRect(-half + 5, -half + 5, w - 10, h - 10);

      if (config.emblem === 'admin') {
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(-half + 9, -half + 11, w - 18, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-half + 13, -half + 13, 6, 5);
        ctx.fillRect(-half + 25, -half + 13, 6, 5);
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(-half + 12, -half + 27, 8, 3);
        ctx.fillRect(-half + 23, -half + 27, 10, 3);
      } else if (config.emblem === 'owner') {
        ctx.fillStyle = config.primaryColor;
        ctx.beginPath();
        ctx.moveTo(-half + 10, -half + 12);
        ctx.lineTo(-half + 14, -half + 7);
        ctx.lineTo(-half + 22, -half + 12);
        ctx.lineTo(-half + 30, -half + 7);
        ctx.lineTo(-half + 34, -half + 12);
        ctx.lineTo(-half + 34, -half + 22);
        ctx.lineTo(-half + 10, -half + 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-half + 14, -half + 14, 5, 5);
        ctx.fillRect(-half + 25, -half + 14, 5, 5);
        ctx.fillRect(-half + 12, -half + 28, w - 24, 4);
      } else {
        ctx.fillStyle = config.primaryColor;
        ctx.beginPath();
        ctx.arc(-half + 14, -half + 16, 7, 0, Math.PI * 2);
        ctx.arc(-half + 30, -half + 16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-half + 12, -half + 14, 4, 4);
        ctx.fillRect(-half + 28, -half + 14, 4, 4);
        ctx.strokeStyle = config.primaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-half + 8, -half + 30);
        ctx.lineTo(-half + w - 8, -half + 30);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-half + 3, -half + 3, w - 6, h - 6);
    }
  }

  // ── Dash Aura (When green dash orb active) ──────────────────
  if (player.isDashing) {
    ctx.save();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, half + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Forward laser streaks
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(half + 10, -2, 25, 4);
    ctx.fillRect(half + 6, -8, 15, 2);
    ctx.fillRect(half + 6, 6, 15, 2);
    ctx.restore();
  }

  // ── Firewall Shield Visual ──────────────────────────────────
  if (player.hasShield) {
    ctx.save();
    ctx.rotate(-angle);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, half + 14, 0, Math.PI * 2);
    ctx.stroke();

    const now = Date.now() / 300;
    for (let i = 0; i < 3; i++) {
      const a = now + (i * Math.PI * 2) / 3;
      const nx = Math.cos(a) * (half + 14);
      const ny = Math.sin(a) * (half + 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nx - 3, ny - 3, 6, 6);
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 14-Shard Shattering Death Explosion
 */
export function spawnDeathParticles(particles, player) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const config = CHARACTERS[player.character] || CHARACTERS.Admin;

  particles.push({
    type: 'shockwave',
    x: cx,
    y: cy,
    radius: 10,
    maxRadius: 120,
    speed: 8,
    color: config.primaryColor,
    alpha: 1.0,
    life: 1.0,
  });

  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
    const speed = 5 + Math.random() * 9;
    const shardSize = 7 + Math.random() * 9;

    particles.push({
      type: 'shard',
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.4,
      size: shardSize,
      color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? config.primaryColor : config.secondaryColor,
      borderColor: config.glowColor,
      life: 1.0,
    });
  }
}

export function spawnLandingSparks(particles, player) {
  const cx = player.x + player.w / 2;
  const py = player.gravityDir === 1 ? player.y + player.h : player.y;
  const config = CHARACTERS[player.character] || CHARACTERS.Admin;

  for (let i = 0; i < 6; i++) {
    particles.push({
      type: 'spark',
      x: cx + (Math.random() - 0.5) * player.w,
      y: py,
      vx: (Math.random() - 0.5) * 5,
      vy: player.gravityDir === 1 ? -(1 + Math.random() * 2) : (1 + Math.random() * 2),
      size: 3,
      color: config.primaryColor,
      life: 0.5,
    });
  }
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    if (p.type === 'shockwave') {
      p.radius += p.speed * dt;
      p.life -= 0.05 * dt;
      p.alpha = Math.max(0, p.life);
    } else if (p.type === 'shard') {
      p.vy += 0.38 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.vRot * dt;
      p.life -= 0.026 * dt;
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.04 * dt;
    }
  }
  return particles.filter(p => p.life > 0);
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    if (p.type === 'shockwave') {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'shard') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.strokeStyle = p.borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }
}
