// ============================================================
// obstacles.js — Obstacle types, spawning, collision, rendering
// ============================================================

// ── Obstacle Type Definitions ───────────────────────────────
// Each type defines: w, h, color, label, and tip pool

export const FIREWALL = {
  w: 18,
  h: 44,
  color: '#e05252',
  label: 'FW',
  tips: [
    'Firewalls filter packets based on rules to block unauthorized access',
    'Stateful firewalls track connection state, stateless only inspect individual packets',
    'Next-gen firewalls include IPS, application awareness, and deep packet inspection'
  ],
  // Sits on the ground
  getY: (GROUND_Y) => GROUND_Y - 44,
};

export const IDS_SENSOR = {
  w: 22,
  h: 30,
  color: '#e09a30',
  label: 'IDS',
  tips: [
    'IDS detects threats and alerts, IPS detects and actively blocks them',
    'Signature-based IDS matches known attack patterns, anomaly-based detects deviations',
    'Out-of-band IDS monitors via network tap or port mirror without inline latency'
  ],
  getY: (GROUND_Y) => GROUND_Y - 30,
};

export const MALWARE_BLOCK = {
  w: 20,
  h: 20,
  color: '#a855f7',
  label: 'M',
  tips: [
    'Viruses attach to files, worms self-replicate across networks without host files',
    'Trojans masquerade as legitimate software to deliver malicious payloads',
    'Ransomware encrypts victim data and demands payment for restoration'
  ],
  // Floats at random height
  getY: (GROUND_Y) => {
    const minHeight = 30;
    const maxHeight = 80;
    return GROUND_Y - (minHeight + Math.random() * (maxHeight - minHeight));
  },
};

export const PHISHING_HOOK = {
  w: 14,
  h: 26,
  color: '#38bdf8',
  label: 'PH',
  tips: [
    'Phishing uses deceptive emails or links to steal credentials and sensitive data',
    'Spear-phishing targets specific individuals using personalised social engineering',
    'Check email sender domains carefully — lookalike domains are a common trick'
  ],
  // Drops from near the top of double jump range (aerial hazard)
  getY: (GROUND_Y) => GROUND_Y - 140,
};

export const ENCRYPTED_BLOCK = {
  w: 40,
  h: 80,
  color: '#f59e0b',
  label: 'ENC',
  tips: [
    'AES-256 is the standard for symmetric encryption used in modern security tools',
    'Public-key cryptography uses a key pair: public to encrypt, private to decrypt',
    'TLS/SSL encrypts data in transit to prevent man-in-the-middle interception'
  ],
  getY: (GROUND_Y) => GROUND_Y - 80,
};

// Pool of all types for random selection
const OBSTACLE_TYPES = [FIREWALL, IDS_SENSOR, MALWARE_BLOCK, PHISHING_HOOK, ENCRYPTED_BLOCK];

// ── Spawning ─────────────────────────────────────────────────
/**
 * Spawns a random obstacle off the right edge of the canvas
 * and pushes it onto the obstacles array.
 * 
 * @param {Array} obstacles - the array to push the new obstacle into
 * @param {number} CANVAS_W - canvas width (spawn position)
 * @param {number} GROUND_Y - ground surface y-coordinate
 */
export function spawnObstacle(obstacles, CANVAS_W, GROUND_Y, CANVAS_H) {
  const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  
  const obstacle = {
    type:     type.label,
    x:        CANVAS_W + 10,
    y:        type.getY(GROUND_Y, CANVAS_H),
    w:        type.w,
    h:        type.h,
    color:    type.color,
    tips:     type.tips,
    tipIndex: Math.floor(Math.random() * type.tips.length)  // rotate tip per instance
  };
  
  obstacles.push(obstacle);
}

// ── Scrolling ────────────────────────────────────────────────
/**
 * Scrolls all obstacles left by SPEED * dt and removes any that 
 * have scrolled fully off the left edge.
 * 
 * @param {Array} obstacles - array of obstacle objects
 * @param {number} dt - delta time (1.0 = one frame at 60fps)
 * @param {number} SPEED - horizontal scroll speed (px/frame)
 * @returns {Array} - filtered array with off-screen obstacles removed
 */
export function scrollObstacles(obstacles, dt, SPEED) {
  for (const obs of obstacles) {
    obs.x -= SPEED * dt;
  }
  
  // Remove obstacles that have scrolled fully off the left edge
  return obstacles.filter(obs => obs.x + obs.w > 0);
}

// ── Collision Detection ──────────────────────────────────────
/**
 * Checks AABB collision between the player and all obstacles.
 * Returns the first obstacle that collides, or null if none.
 * 
 * @param {Object} player - player object with x, y, w, h
 * @param {Array} obstacles - array of obstacle objects
 * @returns {Object|null} - the colliding obstacle, or null
 */
export function checkCollisions(player, obstacles) {
  const px1 = player.x;
  const py1 = player.y;
  const px2 = player.x + player.w;
  const py2 = player.y + player.h;
  
  for (const obs of obstacles) {
    const ox1 = obs.x;
    const oy1 = obs.y;
    const ox2 = obs.x + obs.w;
    const oy2 = obs.y + obs.h;
    
    // AABB collision check
    if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
      return obs;
    }
  }
  
  return null;
}

// ── Rendering ────────────────────────────────────────────────
/**
 * Draws all obstacles with a filled rectangle, 1px lighter stroke,
 * and a short label centered in the top portion.
 * 
 * @param {CanvasRenderingContext2D} ctx - the 2D drawing context
 * @param {Array} obstacles - array of obstacle objects
 */
export function drawObstacles(ctx, obstacles) {
  for (const obs of obstacles) {
    // Fill main body
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    
    // Lighter stroke border
    ctx.strokeStyle = lighten(obs.color, 20);
    ctx.lineWidth = 1;
    ctx.strokeRect(obs.x + 0.5, obs.y + 0.5, obs.w - 1, obs.h - 1);
    
    // Label text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(obs.type, obs.x + obs.w / 2, obs.y + 3);
  }
}

// ── Helper: lighten a hex color by amount (0-100) ────────────
function lighten(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
