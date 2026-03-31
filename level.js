// ============================================================
// level.js — Level geometry, platforms, and pits
// ============================================================

export function generateLevelSegment(lastX, CANVAS_W, GROUND_Y) {
  const type = Math.random();

  if (type < 0.6) {
    // Standard Flat Ground
    return { x: lastX, y: GROUND_Y, w: 200, h: 40, type: 'ground' };
  } else if (type < 0.8) {
    // A Pit (Empty space — player falls through)
    return { x: lastX, y: GROUND_Y, w: 120, h: 0, type: 'pit' };
  } else {
    // A Floating Platform
    return { x: lastX, y: GROUND_Y - 60, w: 150, h: 15, type: 'platform' };
  }
}

/**
 * Checks if the player has fallen below the canvas floor.
 */
export function checkFallDeath(player, CANVAS_H) {
  return player.y > CANVAS_H + 50;
}
