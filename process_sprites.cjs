const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/mlingsch/.gemini/antigravity-ide/brain/0e6082ba-7a77-4b92-8fbc-787d42b70bad';
const OUTPUT_DIR = path.join(__dirname, 'public', 'sprites');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Flood fill transparency from image edges
async function removeOuterWhiteBackground(srcFile, destFile, options = {}) {
  const { threshold = 230, tolerance = 18 } = options;
  const image = sharp(srcFile);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels = 4 (RGBA)

  const visited = new Uint8Array(width * height);
  const queue = [];

  function isWhite(x, y) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r >= threshold && g >= threshold && b >= threshold;
  }

  // Push all 4 outer border pixels
  for (let x = 0; x < width; x++) {
    if (isWhite(x, 0)) { queue.push(x, 0); visited[0 * width + x] = 1; }
    if (isWhite(x, height - 1)) { queue.push(x, height - 1); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isWhite(0, y) && !visited[y * width + 0]) { queue.push(0, y); visited[y * width + 0] = 1; }
    if (isWhite(width - 1, y) && !visited[y * width + (width - 1)]) { queue.push(width - 1, y); visited[y * width + (width - 1)] = 1; }
  }

  // BFS
  let head = 0;
  const dirs = [
    [0, 1], [0, -1], [1, 0], [-1, 0]
  ];

  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];

    const idx = (y * width + x) * 4;
    data[idx + 3] = 0; // alpha = 0

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = ny * width + nx;
        if (!visited[nIndex]) {
          visited[nIndex] = 1;
          if (isWhite(nx, ny)) {
            queue.push(nx, ny);
          } else {
            // Edge smoothing / anti-aliasing near boundary
            const nRaw = nIndex * 4;
            const nr = data[nRaw];
            const ng = data[nRaw + 1];
            const nb = data[nRaw + 2];
            const minChannel = Math.min(nr, ng, nb);
            if (minChannel > threshold - tolerance) {
              const alphaFactor = (threshold - minChannel) / tolerance;
              data[nRaw + 3] = Math.max(0, Math.min(255, Math.floor(255 * alphaFactor)));
            }
          }
        }
      }
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .trim() // Trim transparent border
    .png()
    .toFile(destFile);

  console.log(`Saved transparent sprite: ${path.basename(destFile)}`);
}

async function run() {
  const spriteMap = [
    { src: 'cyber_cube_hero_1789065873382.jpg', dest: 'cube_hero.png', threshold: 232 },
    { src: 'player_ship_drone_1789065890437.jpg', dest: 'ship_drone.png', threshold: 230 },
    { src: 'player_wave_dart_1789065901450.jpg', dest: 'wave_dart.png', threshold: 230 },
    { src: 'hazard_spike_malware_1789065909719.jpg', dest: 'spike_malware.png', threshold: 230 },
    { src: 'hazard_sawblade_1789065922493.jpg', dest: 'sawblade.png', threshold: 230 },
    { src: 'block_server_node_1789065936289.jpg', dest: 'server_block.png', threshold: 230 },
    { src: 'prop_jump_pad_1789065949041.jpg', dest: 'jump_pad.png', threshold: 230 },
    { src: 'prop_jump_orb_1789065961504.jpg', dest: 'jump_ring.png', threshold: 230 },
    { src: 'prop_portal_gateway_1789065976559.jpg', dest: 'portal_gateway.png', threshold: 230 },
    { src: 'item_crypto_packet_1789065990111.jpg', dest: 'crypto_packet.png', threshold: 230 },
  ];

  for (const item of spriteMap) {
    const srcPath = path.join(ARTIFACTS_DIR, item.src);
    const destPath = path.join(OUTPUT_DIR, item.dest);
    try {
      await removeOuterWhiteBackground(srcPath, destPath, { threshold: item.threshold });
    } catch (err) {
      console.error(`Error processing ${item.src}:`, err);
    }
  }

  // Skyline background: convert directly to high-res PNG/JPG
  const skylineSrc = path.join(ARTIFACTS_DIR, 'bg_cyber_skyline_1789066004223.jpg');
  const skylineDest = path.join(OUTPUT_DIR, 'cyber_skyline.jpg');
  await sharp(skylineSrc).jpeg({ quality: 92 }).toFile(skylineDest);
  console.log(`Saved background: ${path.basename(skylineDest)}`);
}

run().catch(console.error);
