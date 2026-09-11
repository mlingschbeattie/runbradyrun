// ============================================================
// environment.js — AAA Cyber Parallax, Audio Visualizer & Stage Atmosphere
// Smooth perspective grid, rhythmic equalizer spectrum, floating motes,
// and dynamic stage color evolution (Cyan -> Violet -> Emerald -> Crimson).
// ============================================================

import { SPRITES } from './assets.js';
import { getAudioFrequencies } from './audio.js';

export function initEnvironment(CANVAS_W, CANVAS_H) {
  // 1. Floating data sparks / motes
  const motes = [];
  for (let i = 0; i < 60; i++) {
    motes.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: 1.5 + Math.random() * 3,
      speedX: 0.3 + Math.random() * 1.2,
      alpha: 0.2 + Math.random() * 0.7,
      color: Math.random() > 0.5 ? '#00f0ff' : '#a855f7',
    });
  }

  // 2. Distant Vertical Matrix Data Code Columns
  const streams = [];
  const HEX_CHARS = ['0', '1', 'F', 'A', 'X', '7', 'C', '9', 'E', 'B', '4', 'D'];
  for (let i = 0; i < 22; i++) {
    streams.push({
      x: (i * (CANVAS_W / 22)) + (Math.random() - 0.5) * 20,
      y: Math.random() * CANVAS_H,
      speedY: 0.8 + Math.random() * 1.8,
      chars: Array.from({ length: 7 }, () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]),
      alpha: 0.15 + Math.random() * 0.2,
    });
  }

  // 3. Audio Visualizer Spectrum Bars along horizon
  const spectrumBars = [];
  const barCount = 36;
  for (let i = 0; i < barCount; i++) {
    spectrumBars.push({
      height: 10 + Math.random() * 30,
      targetHeight: 15,
      decaySpeed: 0.08 + Math.random() * 0.04,
    });
  }

  return {
    offset: 0,
    beatPulse: 0,
    motes,
    streams,
    spectrumBars,
  };
}

export function updateEnvironment(env, dt, speed, CANVAS_W, CANVAS_H) {
  env.offset += speed * dt;

  if (env.beatPulse > 0) {
    env.beatPulse = Math.max(0, env.beatPulse - 0.06 * dt);
  }

  // Live music frequency spectrum tracking
  const freqs = getAudioFrequencies();
  if (freqs && freqs.length > 0) {
    const step = Math.max(1, Math.floor(freqs.length / env.spectrumBars.length));
    for (let i = 0; i < env.spectrumBars.length; i++) {
      const idx = Math.min(freqs.length - 1, i * step);
      const val = freqs[idx] / 255;
      env.spectrumBars[i].targetHeight = 8 + val * 68;
      env.spectrumBars[i].height += (env.spectrumBars[i].targetHeight - env.spectrumBars[i].height) * 0.28 * dt;
    }
  } else {
    // Animate spectrum bars smooth decay
    for (let i = 0; i < env.spectrumBars.length; i++) {
      const bar = env.spectrumBars[i];
      bar.height += (bar.targetHeight - bar.height) * 0.15 * dt;
      bar.targetHeight = Math.max(8, bar.targetHeight - bar.decaySpeed * 40 * dt);
    }
  }

  for (const m of env.motes) {
    m.x -= m.speedX * (speed / 8) * dt;
    if (m.x < 0) {
      m.x = CANVAS_W + Math.random() * 60;
      m.y = Math.random() * CANVAS_H;
    }
  }

  // Matrix streams drift downward slowly
  for (const s of env.streams) {
    s.y += s.speedY * dt;
    s.x -= (speed * 0.1) * dt;
    if (s.y > CANVAS_H + 120) s.y = -100;
    if (s.x < -40) s.x = CANVAS_W + 20;
  }
}

export function triggerBeatPulse(env) {
  env.beatPulse = 1.0;

  // Pump spectrum bars on beat
  if (env.spectrumBars) {
    for (let i = 0; i < env.spectrumBars.length; i++) {
      const bar = env.spectrumBars[i];
      // Wave shape across spectrum
      const wave = Math.sin((i / env.spectrumBars.length) * Math.PI) * 45;
      const jitter = Math.random() * 25;
      bar.targetHeight = 20 + wave + jitter;
    }
  }
}

export function drawEnvironment(ctx, env, CANVAS_W, CANVAS_H, GROUND_Y, CEILING_Y, percent = 0) {
  // Theme palette based on stage completion percentage
  let themeColor = '#00f0ff';
  let accentColor = '#a855f7';
  let baseR = 10, baseG = 14, baseB = 30; // Ingress Cyan

  if (percent > 75) {
    baseR = 32; baseG = 8; baseB = 22; // Hyper Red Core
    themeColor = '#ff0055';
    accentColor = '#ff7700';
  } else if (percent > 50) {
    baseR = 8; baseG = 30; baseB = 20; // Acid Green Infiltration
    themeColor = '#00ff88';
    accentColor = '#00f0ff';
  } else if (percent > 25) {
    baseR = 24; baseG = 8; baseB = 36; // Laser Violet Firewall
    themeColor = '#a855f7';
    accentColor = '#ff00aa';
  }

  const pulse = env.beatPulse || 0;

  // 1. Smooth, Deep Cyber Gradient Sky with Horizon Glow
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  const topR = Math.floor(baseR * 0.6 + pulse * 14);
  const topG = Math.floor(baseG * 0.6 + pulse * 14);
  const topB = Math.floor(baseB * 0.6 + pulse * 22);
  const botR = Math.floor(baseR + pulse * 25);
  const botG = Math.floor(baseG + pulse * 25);
  const botB = Math.floor(baseB + pulse * 35);

  skyGrad.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
  skyGrad.addColorStop(0.85, `rgb(${botR}, ${botG}, ${botB})`);
  skyGrad.addColorStop(1, `rgb(${Math.min(255, botR + 15)}, ${Math.min(255, botG + 20)}, ${Math.min(255, botB + 30)})`);

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 1.5. Deep Parallax Cyber Skyline Backdrop
  if (SPRITES.cyberSkyline && SPRITES.cyberSkyline.complete && SPRITES.cyberSkyline.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.52 + pulse * 0.14;
    const img = SPRITES.cyberSkyline;
    const targetH = GROUND_Y;
    const scale = targetH / img.height;
    const targetW = img.width * scale;
    const shift = (env.offset * 0.12) % targetW;

    for (let sx = -shift; sx < CANVAS_W + targetW; sx += targetW) {
      ctx.drawImage(img, sx, 0, targetW, targetH);
    }
    ctx.restore();
  }

  // 2. Distant Horizon Glow Line
  ctx.save();
  const horizGrad = ctx.createLinearGradient(0, GROUND_Y - 80, 0, GROUND_Y);
  horizGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  horizGrad.addColorStop(1, themeColor === '#00f0ff' ? 'rgba(0, 240, 255, 0.12)'
    : themeColor === '#a855f7' ? 'rgba(168, 85, 247, 0.14)'
    : themeColor === '#00ff88' ? 'rgba(0, 255, 136, 0.12)'
    : 'rgba(255, 0, 85, 0.15)');
  ctx.fillStyle = horizGrad;
  ctx.fillRect(0, GROUND_Y - 80, CANVAS_W, 80);
  ctx.restore();

  // 3. Audio Visualizer Spectrum Bars along bottom horizon
  if (env.spectrumBars) {
    const barW = CANVAS_W / env.spectrumBars.length;
    for (let i = 0; i < env.spectrumBars.length; i++) {
      const bar = env.spectrumBars[i];
      const h = bar.height;
      const bx = i * barW;
      const by = GROUND_Y - h;

      ctx.save();
      const barGrad = ctx.createLinearGradient(bx, by, bx, GROUND_Y);
      barGrad.addColorStop(0, themeColor);
      barGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = barGrad;
      ctx.globalAlpha = 0.18 + pulse * 0.15;
      ctx.fillRect(bx + 1, by, barW - 2, h);
      ctx.restore();
    }
  }

  // 4. Distant Matrix Data Streams (Hex Columns with glowing leader)
  ctx.font = '700 11px monospace';
  ctx.textAlign = 'center';
  for (const s of env.streams) {
    ctx.save();
    ctx.globalAlpha = s.alpha;
    for (let c = 0; c < s.chars.length; c++) {
      if (c === s.chars.length - 1) {
        // Bright white glowing leader char
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = themeColor;
        ctx.shadowBlur = 0;
      }
      ctx.fillText(s.chars[c], s.x, s.y + c * 16);
    }
    ctx.restore();
  }

  // 5. Smooth Cyber Parallax Grid (No jitter!)
  const gridSpacing = 88;
  const gridShift = (env.offset * 0.22) % gridSpacing;
  const gridAlpha = 0.08 + pulse * 0.06;

  ctx.save();
  ctx.strokeStyle = themeColor;
  ctx.globalAlpha = gridAlpha;
  ctx.lineWidth = 1;

  for (let x = -gridShift; x <= CANVAS_W + gridSpacing; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }

  for (let y = 0; y <= CANVAS_H; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Floating Cyber Dust Motes
  for (const m of env.motes) {
    ctx.save();
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = m.color;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(m.x, m.y, m.size, m.size);
    ctx.restore();
  }

  // 7. Ambient Edge Vignette (focuses player eye on center action)
  const vig = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.38,
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.72
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(3, 5, 12, 0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}