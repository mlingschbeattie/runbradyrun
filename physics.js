// ============================================================
// physics.js — Cyber Infiltration Multi-Mode Physics Engine
// Supports: Cube, Ship (Rocket), Wave (45° Zig-Zag), Dash Orbs,
// and 1x/2x Speed Modifiers.
// ============================================================

export const BLOCK_SIZE = 48;
export const BASE_SPEED = 9.8;
export const GRAVITY = 1.34;
export const JUMP_VY = -16.8;
export const PAD_YELLOW_VY = -21.5;
export const PAD_PINK_VY = -15.0;
export const ORB_YELLOW_VY = -16.2;
export const ORB_PINK_VY = -12.5;

/**
 * Updates vertical movement and mode physics for the player.
 */
export function updatePlayerPhysics(player, dt, isHoldingJump, effectiveSpeed) {
  player.prevY = player.y;
  const grav = player.gravityDir || 1;
  const mode = player.mode || 'cube';

  // ── 1. Green Dash Orb Active ────────────────────────────────
  if (player.isDashing) {
    // Lock vertical velocity, shoot horizontally forward!
    player.vy = 0;
    player.angle = 0;
    player.onGround = false;

    // Geometry Dash Dash-Stop: auto-release dash once chasm is crossed (~280px)
    if (player.dashStartX && player.x - player.dashStartX > 280) {
      player.isDashing = false;
    }
    return;
  }

  // ── 2. Wave Mode (45° Zig-Zag Dart) ─────────────────────────
  if (mode === 'wave') {
    // In wave mode: holding jump moves diagonally UP at 45°, releasing moves DOWN at 45°
    const waveSpeed = effectiveSpeed; // 45° means vertical speed equals horizontal speed!
    if (isHoldingJump) {
      player.vy = -waveSpeed * grav;
      player.angle = grav === 1 ? -Math.PI / 4 : Math.PI / 4; // -45 deg
    } else {
      player.vy = waveSpeed * grav;
      player.angle = grav === 1 ? Math.PI / 4 : -Math.PI / 4; // +45 deg
    }
    player.y += player.vy * dt;
    player.onGround = false;
    return;
  }

  // ── 3. Ship Mode (Rocket Flight with smooth thrusters) ───────
  if (mode === 'ship') {
    const thrust = -0.92 * grav;
    const shipGravity = 0.65 * grav;

    if (isHoldingJump) {
      player.vy += thrust * dt;
    } else {
      player.vy += shipGravity * dt;
    }

    // Ship terminal velocity
    const shipMaxVy = 13.5;
    if (player.vy > shipMaxVy) player.vy = shipMaxVy;
    if (player.vy < -shipMaxVy) player.vy = -shipMaxVy;

    player.y += player.vy * dt;

    // Enforce ceiling & upper bounds so ship cannot fly off-screen into void
    const minShipY = 52;
    if (player.y < minShipY) {
      player.y = minShipY;
      if (player.vy < 0) player.vy = 0;
    }

    // Smooth ship tilt based on current vertical velocity
    const targetAngle = Math.max(-0.6, Math.min(0.6, (player.vy / 14) * 0.7));
    player.angle += (targetAngle - player.angle) * 0.25 * dt;
    return;
  }

  // ── 4. Standard Cube Mode ────────────────────────────────────
  player.vy += GRAVITY * grav * dt;
  const maxVy = 26;
  if (player.vy > maxVy) player.vy = maxVy;
  if (player.vy < -maxVy) player.vy = -maxVy;

  player.y += player.vy * dt;

  // 360° airborne rotation per jump
  if (!player.onGround) {
    const rotSpeed = ((Math.PI * 2) / 24) * grav;
    player.angle += rotSpeed * dt;
  }
}

/**
 * Snaps player angle to nearest 90-degree increment
 */
export function snapAngle(angle) {
  const halfPi = Math.PI / 2;
  return Math.round(angle / halfPi) * halfPi;
}

/**
 * Resolves solid block collisions across all modes
 */
export function resolveBlockCollisions(player, tiles) {
  const wasOnGround = player.onGround;
  player.onGround = false;

  const mode = player.mode || 'cube';
  const grav = player.gravityDir || 1;
  const px1 = player.x + (mode === 'wave' ? 8 : 5);
  const px2 = player.x + player.w - (mode === 'wave' ? 8 : 5);
  const py1 = player.y + (mode === 'wave' ? 4 : 0);
  const py2 = player.y + player.h - (mode === 'wave' ? 4 : 0);

  for (const tile of tiles) {
    if (tile.type === 'pit') continue;

    const tx1 = tile.x;
    const tx2 = tile.x + tile.w;
    const ty1 = tile.y;
    const ty2 = tile.y + tile.h;

    const hOverlap = px2 > tx1 && px1 < tx2;
    if (!hOverlap) continue;

    // In Wave mode: hitting ANY solid block surface is fatal!
    if (mode === 'wave') {
      const vOverlap = py2 > ty1 && py1 < ty2;
      if (vOverlap) {
        return { crashed: true, reason: 'wave_crash', tile };
      }
      continue;
    }

    // ── SHIP MODE: Smooth sliding on floor & ceiling ──────────
    if (mode === 'ship') {
      const prevBottom = player.prevY + player.h;
      const currBottom = py2;
      const prevTop = player.prevY;
      const currTop = py1;

      // 1. Sliding along floor or flat top of blocks:
      // When descending or resting on a surface (vy >= 0): clamp to surface.
      // NEVER snap down when thrusting upwards (vy < 0)!
      if (currBottom >= ty1 && (prevBottom <= ty1 + 16 || player.onGround) && player.vy >= 0) {
        player.y = ty1 - player.h;
        player.vy = 0;
        player.onGround = true;
        continue;
      }

      // 2. Sliding along solid ceiling or underside of hanging blocks:
      if (currTop <= ty2 && prevTop >= ty2 - 16 && player.vy <= 0) {
        player.y = ty2;
        player.vy = 0;
        continue;
      }

      // 3. Side wall crash: hit the vertical front face of an elevated block/pillar
      const vOverlap = py2 > ty1 + 14 && py1 < ty2 - 14;
      if (vOverlap) {
        return { crashed: true, reason: 'wall', tile };
      }
      continue;
    }

    // ── CUBE MODE: Standard Geometry Dash Cube Physics ────────
    if (grav === 1) {
      const prevBottom = player.prevY + player.h;
      const currBottom = py2;

      // 1. Landing on top of block:
      // If player's feet reached or passed the block top (currBottom >= ty1)
      // and they entered from above or within 20px of the top edge:
      const enteredFromTop = prevBottom <= ty1 + 20;
      const isAboveLedge = currBottom <= ty1 + 20;

      if (currBottom >= ty1 && (enteredFromTop || isAboveLedge || player.isDashing)) {
        player.y = ty1 - player.h;
        player.vy = 0;
        player.onGround = true;
        player.isDashing = false; // Landing safely exits dash mode
        player.angle = snapAngle(player.angle);
        continue;
      }

      // Hitting side wall of block: ONLY fatal if feet are genuinely below the 20px ledge tolerance!
      const vOverlap = py2 > ty1 + 20 && py1 < ty2 - 4;
      if (vOverlap) {
        return { crashed: true, reason: 'wall', tile };
      }
    } else {
      // Inverted ceiling gravity for Cube:
      const prevTop = player.prevY;
      const currTop = py1;

      const enteredFromBottom = prevTop >= ty2 - 20;
      const isBelowLedge = currTop >= ty2 - 20;

      if (currTop <= ty2 && (enteredFromBottom || isBelowLedge)) {
        player.y = ty2;
        player.vy = 0;
        player.onGround = true;
        player.angle = snapAngle(player.angle);
        continue;
      }

      const vOverlap = py2 > ty1 + 4 && py1 < ty2 - 20;
      if (vOverlap) {
        return { crashed: true, reason: 'wall', tile };
      }
    }
  }

  const justLanded = !wasOnGround && player.onGround;
  return { crashed: false, justLanded };
}

/**
 * Checks interaction with Jump Pads
 */
export function checkPadCollisions(player, pads) {
  if (player.mode === 'wave') return null; // Wave passes orbs/pads differently

  const px1 = player.x + 6;
  const px2 = player.x + player.w - 6;
  const py1 = player.y;
  const py2 = player.y + player.h;

  for (const pad of pads) {
    if (pad.used) continue;
    const hOverlap = px2 > pad.x && px1 < pad.x + pad.w;
    const vOverlap = py2 >= pad.y - 12 && py1 <= pad.y + pad.h + 8;

    if (hOverlap && vOverlap) {
      pad.used = true;
      const grav = player.gravityDir || 1;

      if (pad.padType === 'pink') {
        player.vy = PAD_PINK_VY * grav;
      } else {
        player.vy = PAD_YELLOW_VY * grav;
      }
      player.onGround = false;
      return pad;
    }
  }
  return null;
}

/**
 * Checks Jump Orbs & Green Dash Orbs
 */
export function checkOrbInteractions(player, orbs) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const radius = 52;

  for (const orb of orbs) {
    if (orb.activated) continue;
    const ox = orb.x + orb.w / 2;
    const oy = orb.y + orb.h / 2;
    const distSq = (cx - ox) * (cx - ox) + (cy - oy) * (cy - oy);

    if (distSq <= radius * radius) {
      orb.activated = true;
      const grav = player.gravityDir || 1;

      if (orb.orbType === 'dash_green') {
        // Green Dash Orb: shoot horizontally through the air!
        player.isDashing = true;
        player.vy = 0;
        player.angle = 0;
        // Lock player Y to exact orb centerline so trajectory is laser-precise
        player.y = (orb.y + orb.h / 2) - player.h / 2;
        player.dashStartX = player.x;
      } else if (orb.orbType === 'blue') {
        player.gravityDir = grav === 1 ? -1 : 1;
        player.vy = (grav === 1 ? 11 : -11);
      } else if (orb.orbType === 'pink') {
        player.vy = ORB_PINK_VY * grav;
      } else {
        player.vy = ORB_YELLOW_VY * grav;
      }
      player.onGround = false;
      return orb;
    }
  }
  return null;
}

/**
 * Checks Mode Portals (Wave, Ship, Cube) & Gravity Portals
 */
export function checkPortalCollisions(player, portals) {
  const px1 = player.x;
  const px2 = player.x + player.w;
  const py1 = player.y;
  const py2 = player.y + player.h;

  for (const portal of portals) {
    if (portal.used) continue;

    // Mode, gravity, and speed portals span the full vertical corridor
    // so players cannot accidentally or exploitatively fly over or under them!
    const isCorridorGate =
      portal.portalType.startsWith('mode_') ||
      portal.portalType.startsWith('gravity_') ||
      portal.portalType.startsWith('speed_');

    const hOverlap = px2 > portal.x && px1 < portal.x + portal.w;
    const vOverlap = isCorridorGate ? true : (py2 > portal.y && py1 < portal.y + portal.h);

    if (hOverlap && vOverlap) {
      portal.used = true;

      // Mode Transformation Portals
      if (portal.portalType === 'mode_wave') {
        player.mode = 'wave';
        player.onGround = false;
      } else if (portal.portalType === 'mode_ship') {
        player.mode = 'ship';
        player.angle = 0;
        player.onGround = false;
        // Level flight: soften downward momentum so the ship glides forward smoothly
        if (player.vy > 1.5) player.vy = 1.5;
        if (player.vy < -6) player.vy = -6;
      } else if (portal.portalType === 'mode_cube') {
        player.mode = 'cube';
        player.isDashing = false;
      }

      // Gravity Portals
      if (portal.portalType === 'gravity_flip') {
        player.gravityDir = -1;
      } else if (portal.portalType === 'gravity_normal') {
        player.gravityDir = 1;
      }

      // Speed Gate Modifiers
      if (portal.portalType === 'speed_2x') {
        player.speedMult = 1.4;
      } else if (portal.portalType === 'speed_1x') {
        player.speedMult = 1.0;
      }

      return portal;
    }
  }
  return null;
}

/**
 * Checks lethal hazards (spikes and saws)
 */
export function checkHazardCollisions(player, hazards) {
  const mode = player.mode || 'cube';
  const inset = mode === 'wave' ? 12 : 8; // Wave has a needle-sharp hitbox
  const px1 = player.x + inset;
  const px2 = player.x + player.w - inset;
  const py1 = player.y + inset;
  const py2 = player.y + player.h - inset;

  for (const h of hazards) {
    if (h.type === 'saw') {
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      const sx = h.x + h.w / 2;
      const sy = h.y + h.h / 2;
      const radius = (h.w / 2) * (mode === 'wave' ? 0.68 : 0.74);
      const distSq = (cx - sx) * (cx - sx) + (cy - sy) * (cy - sy);
      if (distSq < radius * radius) {
        return h;
      }
    } else {
      const hx1 = h.x + h.w * 0.22;
      const hx2 = h.x + h.w * 0.78;
      const hy1 = h.y + h.h * 0.22;
      const hy2 = h.y + h.h * 0.88;

      if (px2 > hx1 && px1 < hx2 && py2 > hy1 && py1 < hy2) {
        return h;
      }
    }
  }
  return null;
}
