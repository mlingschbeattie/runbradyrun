// build_sheet.js — Composites assets/ frames into brady_sheet.png
// Run from WSL: node build_sheet.js
import sharp from 'sharp';
import path  from 'path';
import fs    from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS    = path.join(__dirname, 'assets');
const OUT       = path.join(__dirname, 'specialist_sheet.png');

const CELL = 128;   // px per cell
const COLS = 8;
const ROWS = 3;
const W    = COLS * CELL;  // 1024
const H    = ROWS * CELL;  // 384

// Layout: row 0 = run (8 frames), row 1 = jump (2), row 2 = fall (2)
const FRAMES = [
  // ── Run cycle ──────────────────────────────────────────────
  { file: 'R_foot_fwd.png',  row: 0, col: 0 },
  { file: 'neutral.png',     row: 0, col: 1 },
  { file: 'L_foot_fwd.png',  row: 0, col: 2 },
  { file: 'L_foot_pass.png', row: 0, col: 3 },
  { file: 'landing.png',     row: 0, col: 4 },
  { file: 'L_foot_down.png', row: 0, col: 5 },
  { file: 'R_foot_down.png', row: 0, col: 6 },
  { file: 'in_between.png',  row: 0, col: 7 },
  // ── Jump (ascending) ────────────────────────────────────────
  { file: 'jump_start.png',  row: 1, col: 0 },
  { file: 'apex.png',        row: 1, col: 1 },
  // ── Fall (descending) ───────────────────────────────────────
  { file: 'falling.png',     row: 2, col: 0 },
  { file: 'decemt.png',      row: 2, col: 1 },
];

// Remove white/near-white background from raw RGBA buffer
function dewhite(buf) {
  const THRESHOLD = 230;
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    if (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD) {
      const brightness = (r + g + b) / 3;
      // Linearly fade to transparent as brightness approaches 255
      buf[i + 3] = Math.max(0, Math.round((1 - (brightness - THRESHOLD) / (255 - THRESHOLD)) * 255));
    }
  }
}

async function processFrame(file) {
  const src = path.join(ASSETS, file);
  const { data, info } = await sharp(fs.readFileSync(src))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf = Buffer.from(data);
  dewhite(buf);

  // Fit inside CELL×CELL with transparent letterboxing
  return sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(CELL, CELL, {
      fit:        'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel:     sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function build() {
  console.log(`Building ${OUT} (${W}×${H}, ${COLS}×${ROWS} cells @ ${CELL}px)…`);

  const composites = [];
  for (const { file, row, col } of FRAMES) {
    process.stdout.write(`  [${row},${col}] ${file}… `);
    composites.push({ input: await processFrame(file), left: col * CELL, top: row * CELL });
    console.log('ok');
  }

  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toFile(OUT);

  console.log(`\n✓ Written → ${OUT}`);
  console.log('  Update player.js Admin config to type: grid, totalCols: 8, totalRows: 3');
  console.log('  run: {row:0, frames:8}  jump: {row:1, frames:2}  fall: {row:2, frames:2}');
}

build().catch(err => { console.error(err); process.exit(1); });
