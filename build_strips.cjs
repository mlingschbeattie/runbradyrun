const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const ASSETS = path.join(__dirname, 'assets');
const OUT    = __dirname;
const CELL   = 128;

const STRIPS = [
  {
    name: 'specialist_run.png',
    frames: [
      'R_foot_fwd.png', 'neutral.png', 'L_foot_fwd.png', 'L_foot_pass.png',
      'landing.png', 'L_foot_down.png', 'R_foot_down.png', 'in_between.png',
    ],
  },
  {
    name: 'specialist_jump.png',
    frames: ['jump_start.png', 'apex.png'],
  },
  {
    name: 'specialist_fall.png',
    frames: ['falling.png', 'decemt.png'],
  },
];

async function buildStrip({ name, frames }) {
  const w = frames.length * CELL;
  const h = CELL;
  const composites = [];

  for (let i = 0; i < frames.length; i++) {
    const src = path.join(ASSETS, frames[i]);
    const buf = await sharp(src)
      .resize(CELL, CELL, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();
    composites.push({ input: buf, left: i * CELL, top: 0 });
  }

  const outPath = path.join(OUT, name);
  await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  console.log(`✓ ${name} (${w}x${h}, ${frames.length} frames @ ${CELL}px)`);
}

(async () => {
  for (const strip of STRIPS) {
    await buildStrip(strip);
  }
  console.log('\nDone. All strips generated.');
})().catch(e => { console.error(e); process.exit(1); });
