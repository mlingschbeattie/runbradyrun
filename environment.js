// ============================================================
// environment.js — Parallax backgrounds and scenery
// ============================================================

/**
 * Creates a set of parallax layers. 
 * Each layer has: images (or shapes), speed multiplier, and offset.
 */
export function initEnvironment(CANVAS_H) {
  return [
    { 
      color: '#0f172a', // Distant mountains/buildings
      speedMult: 0.1, 
      height: 120, 
      y: CANVAS_H * 0.6, 
      offset: 0 
    },
    { 
      color: '#1e293b', // Closer hills
      speedMult: 0.3, 
      height: 80, 
      y: CANVAS_H * 0.7, 
      offset: 0 
    }
  ];
}

export function updateEnvironment(layers, dt, SPEED) {
  for (const layer of layers) {
    layer.offset -= SPEED * layer.speedMult * dt;
    // Reset offset to loop seamlessly
    if (Math.abs(layer.offset) > 200) {
      layer.offset = 0;
    }
  }
}

export function drawEnvironment(ctx, layers, CANVAS_W) {
  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    // Draw repeating "peaks" or blocks for the background
    for (let x = layer.offset - 200; x < CANVAS_W + 200; x += 200) {
      ctx.beginPath();
      ctx.moveTo(x, layer.y);
      ctx.lineTo(x + 100, layer.y - layer.height);
      ctx.lineTo(x + 200, layer.y);
      ctx.fill();
    }
  }
}