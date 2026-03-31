// ============================================================
// powerups.js — Powerup spawning, collision, and rendering
// ============================================================

// ── Shield powerup ───────────────────────────────────────────
// Spawns an Antivirus Shield at a height reachable by a single jump

export function spawnPowerup(powerups, CANVAS_W, GROUND_Y) {
  powerups.push({
    type:  'shield',
    x:     CANVAS_W + 10,
    y:     GROUND_Y - 90,   // mid-jump height — reachable with one jump
    w:     24,
    h:     24,
    color: '#4ade80',
  });
}

// ── Scrolling ────────────────────────────────────────────────
export function scrollPowerups(powerups, dt, speed) {
  for (const p of powerups) {
    p.x -= speed * dt;
  }
  return powerups.filter(p => p.x + p.w > 0);
}

// ── Collision ────────────────────────────────────────────────
/**
 * Checks AABB collision between the player and all powerups.
 * Collected powerups are removed from the array and their effect applied.
 * Returns true if a shield was collected this frame.
 */
export function checkPowerupCollisions(player, powerups) {
  let shieldCollected = false;

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p  = powerups[i];
    const px1 = player.x,          py1 = player.y;
    const px2 = player.x + player.w, py2 = player.y + player.h;
    const ox1 = p.x,               oy1 = p.y;
    const ox2 = p.x + p.w,         oy2 = p.y + p.h;

    if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
      if (p.type === 'shield') {
        player.hasShield  = true;
        shieldCollected   = true;
      }
      powerups.splice(i, 1);
    }
  }

  return shieldCollected;
}

// ── Rendering ────────────────────────────────────────────────
export function drawPowerups(ctx, powerups) {
  for (const p of powerups) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const r  = p.w / 2;

    // Glowing green circle
    ctx.save();
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur  = 10;
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Cross / shield icon inside
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(cx - 2, cy - r * 0.55, 4, r * 1.1);  // vertical bar
    ctx.fillRect(cx - r * 0.55, cy - 2, r * 1.1, 4);  // horizontal bar
    ctx.restore();
  }
}
