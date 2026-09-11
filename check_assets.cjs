const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dir = './assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
(async () => {
  for (const f of files) {
    const m = await sharp(path.join(dir, f)).metadata();
    const hasAlpha = m.channels === 4;
    const { data } = await sharp(path.join(dir, f))
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const r = data[0], g = data[1], b = data[2], a = data[3];
    console.log(
      f.padEnd(22),
      String(m.width + 'x' + m.height).padEnd(10),
      hasAlpha ? 'RGBA' : 'RGB ',
      'corner:', r, g, b, a,
      a === 0 ? 'TRANSPARENT' : 'OPAQUE'
    );
  }
})();
