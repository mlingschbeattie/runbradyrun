// ============================================================
// render.js — High-End Cyber Rhythm Visuals & VFX
// High-end metallic bevels, glowing cyber conduits, razor spikes,
// sci-fi wormhole portals with holographic icons, floating popups.
// ============================================================

import { BLOCK_SIZE } from './physics.js';
import { SPRITES } from './assets.js';

// Floating text popups (e.g. "+10 PACKETS", "SHIP MODE", "SHIELD ACTIVE")
export const floatingTexts = [];

export function addFloatingText(text, x, y, color = '#00ff88') {
  floatingTexts.push({
    text,
    x,
    y,
    color,
    alpha: 1.0,
    vy: -1.8,
    life: 1.0,
  });
}

export function updateFloatingTexts(dt) {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life -= 0.025 * dt;
    ft.alpha = Math.max(0, ft.life);
  }
  return floatingTexts.filter(ft => ft.life > 0);
}

export function drawFloatingTexts(ctx) {
  for (const ft of floatingTexts) {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.font = '900 13px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

/**
 * High-End Cyber Floor & Ceiling with hazard trim & conduits
 */
export function drawFloorAndCeiling(ctx, CANVAS_W, CANVAS_H, GROUND_Y, CEILING_Y, scrollOffset) {
  const floorH = CANVAS_H - GROUND_Y;

  // 1. FLOOR
  // Deep dark metal gradient
  const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
  floorGrad.addColorStop(0, '#0a1024');
  floorGrad.addColorStop(0.3, '#060a17');
  floorGrad.addColorStop(1, '#03050c');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, floorH);

  // Sub-surface glowing conduit cable (8px down)
  ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.fillRect(0, GROUND_Y + 16, CANVAS_W, 4);

  // Hazard Caution Bar along the top rim (alternating diagonal neon stripes)
  const barH = 14;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, GROUND_Y + 3, CANVAS_W, barH);

  // Diagonal hazard stripes
  const stripeW = 24;
  const stripeShift = (scrollOffset * 0.8) % (stripeW * 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, GROUND_Y + 3, CANVAS_W, barH);
  ctx.clip();
  ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
  for (let x = -stripeShift - stripeW; x <= CANVAS_W + stripeW * 2; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 3);
    ctx.lineTo(x + stripeW * 0.6, GROUND_Y + 3);
    ctx.lineTo(x + stripeW * 0.6 - barH, GROUND_Y + 3 + barH);
    ctx.lineTo(x - barH, GROUND_Y + 3 + barH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Scrolling industrial panel divider seams
  const seamSpacing = 72;
  const seamShift = (scrollOffset % seamSpacing);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  for (let x = -seamShift; x <= CANVAS_W + seamSpacing; x += seamSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + barH + 3);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();

    // Rivet bolts on seams
    ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.fillRect(x - 2, GROUND_Y + 24, 4, 4);
    ctx.fillRect(x - 2, GROUND_Y + 54, 4, 4);
  }

  // Top Glowing Laser Rail
  ctx.save();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_W, GROUND_Y);
  ctx.stroke();
  ctx.restore();

  // 2. CEILING (for gravity inversion)
  const ceilGrad = ctx.createLinearGradient(0, CEILING_Y, 0, 0);
  ceilGrad.addColorStop(0, '#0a1024');
  ceilGrad.addColorStop(1, '#03050c');
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(0, 0, CANVAS_W, CEILING_Y);

  ctx.save();
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#a855f7';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(0, CEILING_Y);
  ctx.lineTo(CANVAS_W, CEILING_Y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Commercial-Grade Cyber Solid Blocks with Circuitry & Metallic Chassis
 */
export function drawBlocks(ctx, blocks) {
  for (const b of blocks) {
    ctx.save();

    if (SPRITES.serverBlock && SPRITES.serverBlock.complete && SPRITES.serverBlock.naturalWidth > 0) {
      // High-Definition Mainframe Server Chassis Block
      ctx.drawImage(SPRITES.serverBlock, b.x, b.y, b.w, b.h);

      // Block ID / Server Label
      if (b.label) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.font = '700 11px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
      }
    } else {
      // 1. Dark gunmetal metal body with subtle gradient
      const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      blockGrad.addColorStop(0, '#0f1c3f');
      blockGrad.addColorStop(1, '#080d1e');
      ctx.fillStyle = blockGrad;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // 2. Glowing Outer Neon Rim
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;

      // 3. Inner Beveled Tech Inset
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 5, b.y + 5, b.w - 10, b.h - 10);

      // 4. Circuit Traces & Corner Studs
      const boltSize = 4;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(b.x + 7, b.y + 7, boltSize, boltSize);
      ctx.fillRect(b.x + b.w - 11, b.y + 7, boltSize, boltSize);
      ctx.fillRect(b.x + 7, b.y + b.h - 11, boltSize, boltSize);
      ctx.fillRect(b.x + b.w - 11, b.y + b.h - 11, boltSize, boltSize);

      // Circuit trace line across center
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x + 12, b.y + b.h / 2);
      ctx.lineTo(b.x + b.w - 12, b.y + b.h / 2);
      ctx.stroke();

      // Central Data Core Light
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Block ID / Server Label
      if (b.label) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '700 11px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 - 8);
      }
    }

    ctx.restore();
  }
}

/**
 * Commercial-Grade Razor Spikes with Metallic Brackets & Neon Core
 */
export function drawSpikes(ctx, spikes) {
  for (const s of spikes) {
    ctx.save();
    const isUp = s.direction === 1;
    const tipX = s.x + s.w / 2;
    const tipY = isUp ? s.y : s.y + s.h;
    const baseLeftX = s.x;
    const baseLeftY = isUp ? s.y + s.h : s.y;
    const baseRightX = s.x + s.w;
    const baseRightY = isUp ? s.y + s.h : s.y;

    const mainColor = s.variant === 'trojan' ? '#ff0055'
      : s.variant === 'firewall' ? '#ff7700'
      : '#a855f7'; // malware neon violet

    if (SPRITES.spikeMalware && SPRITES.spikeMalware.complete && SPRITES.spikeMalware.naturalWidth > 0) {
      // High-Definition Crystalline Malware Spike
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 14;

      if (isUp) {
        ctx.drawImage(SPRITES.spikeMalware, s.x, s.y, s.w, s.h);
      } else {
        // Ceiling spike: flip vertically
        ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
        ctx.scale(1, -1);
        ctx.drawImage(SPRITES.spikeMalware, -s.w / 2, -s.h / 2, s.w, s.h);
      }
    } else {
      // 1. Steel body gradient with 3D bevel (Left side darker, right side lighter)
      ctx.fillStyle = '#10172a';
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX, baseLeftY);
      ctx.lineTo(baseLeftX, baseLeftY);
      ctx.closePath();
      ctx.fill();

      // Right half triangle (metallic highlight)
      const rightGrad = ctx.createLinearGradient(tipX, tipY, baseRightX, baseRightY);
      rightGrad.addColorStop(0, mainColor);
      rightGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = rightGrad;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseRightX, baseRightY);
      ctx.lineTo(tipX, baseLeftY);
      ctx.closePath();
      ctx.fill();

      // 2. Intense Razor Outline with Neon Bloom
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(baseRightX, baseRightY);
      ctx.lineTo(baseLeftX, baseLeftY);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Central Razor Spine Highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY + (isUp ? 2 : -2));
      ctx.lineTo(tipX, baseLeftY - (isUp ? 4 : -4));
      ctx.stroke();

      // 4. Industrial Metal Base Bracket with Bolts
      const bracketH = 5;
      const bracketY = isUp ? s.y + s.h - bracketH : s.y;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(s.x, bracketY, s.w, bracketH);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x, bracketY, s.w, bracketH);

      // Hazard Base Bolts
      ctx.fillStyle = mainColor;
      ctx.fillRect(s.x + 3, bracketY + 1, 3, 3);
      ctx.fillRect(s.x + s.w - 6, bracketY + 1, 3, 3);
    }

    ctx.restore();
  }
}

/**
 * Menacing Industrial Sawblades
 */
export function drawSaws(ctx, saws) {
  for (const s of saws) {
    ctx.save();
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;

    ctx.translate(cx, cy);
    ctx.rotate(s.angle);

    const r = s.radius;

    if (SPRITES.sawblade && SPRITES.sawblade.complete && SPRITES.sawblade.naturalWidth > 0) {
      // High-Definition 12-Tooth Industrial Sawblade
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 18;
      ctx.drawImage(SPRITES.sawblade, -r, -r, r * 2, r * 2);
    } else {
      const teeth = 12;

      // Outer razor teeth with intense red/pink glow
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i * Math.PI) / teeth;
        const dist = (i % 2 === 0) ? r : r * 0.7;
        const tx = Math.cos(a) * dist;
        const ty = Math.sin(a) * dist;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.fill();

      // Inner gunmetal disc
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0a0510';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center warning crosshair
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-3, -r * 0.38, 6, r * 0.76);
      ctx.fillRect(-r * 0.38, -3, r * 0.76, 6);
    }

    ctx.restore();
  }
}

/**
 * Springboard Jump Pads with pulsing upward beam and label
 */
export function drawPads(ctx, pads) {
  for (const p of pads) {
    ctx.save();
    const isYellow = p.padType === 'yellow';
    const color = isYellow ? '#ffd000' : '#ff00aa';

    // Upward beam aura
    const auraH = 45;
    const beamGrad = ctx.createLinearGradient(0, p.y, 0, p.y - auraH);
    beamGrad.addColorStop(0, isYellow ? 'rgba(255, 208, 0, 0.35)' : 'rgba(255, 0, 170, 0.35)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(p.x, p.y - auraH, p.w, auraH);

    if (SPRITES.jumpPad && SPRITES.jumpPad.complete && SPRITES.jumpPad.naturalWidth > 0) {
      // High-Definition Hydraulic Launch Springboard
      const bounceOffset = Math.sin(p.pulse * 4) * 2;
      const pw = p.w * 1.15;
      const ph = p.h * 1.35;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.drawImage(SPRITES.jumpPad, p.x - (pw - p.w) / 2, p.y - (ph - p.h) + bounceOffset, pw, ph);
    } else {
      // Beveled metallic pad body
      ctx.fillStyle = '#0a1020';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;

      const x = p.x;
      const y = p.y;
      const w = p.w;
      const h = p.h;

      ctx.beginPath();
      ctx.moveTo(x + 5, y);
      ctx.lineTo(x + w - 5, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pulsing Upward Chevron Lasers
      const pulseOffset = Math.sin(p.pulse * 4) * 3;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 2; i++) {
        const cy = y + h / 2 - 2 + i * 5 + pulseOffset;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, cy - 4);
        ctx.lineTo(x + w / 2 + 8, cy + 2);
        ctx.lineTo(x + w / 2 - 8, cy + 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/**
 * Orbital Jump Rings & Green Dash Rings
 */
export function drawOrbs(ctx, orbs) {
  for (const orb of orbs) {
    if (orb.activated) continue;
    ctx.save();

    const cx = orb.x + orb.w / 2;
    const cy = orb.y + orb.h / 2;
    const isDash = orb.orbType === 'dash_green';
    const isBlue = orb.orbType === 'blue';
    const isPink = orb.orbType === 'pink';
    const color = isDash ? '#00ff88' : isBlue ? '#00f0ff' : isPink ? '#ff00aa' : '#ffd000';

    ctx.translate(cx, cy);

    // Concentric Energy Pulse Ring
    const pulseScale = 1.0 + Math.sin(orb.pulse * 3) * 0.12;
    ctx.scale(pulseScale, pulseScale);

    if (SPRITES.jumpRing && SPRITES.jumpRing.complete && SPRITES.jumpRing.naturalWidth > 0) {
      // High-Definition Quantum Cipher Jump Ring
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      const size = orb.w * 1.35;
      ctx.drawImage(SPRITES.jumpRing, -size / 2, -size / 2, size, size);

      if (isDash) {
        // Green Dash Ring: Rightward Laser Arrows inside
        ctx.fillStyle = '#ffffff';
        for (let i = -1; i <= 1; i++) {
          const ax = i * 7;
          ctx.beginPath();
          ctx.moveTo(ax + 5, 0);
          ctx.lineTo(ax - 4, -6);
          ctx.lineTo(ax - 4, 6);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Concentric Glowing Core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, orb.w * 0.28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, orb.w * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Outer rotating dotted ring
      ctx.rotate(orb.pulse * 1.1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.setLineDash(isDash ? [8, 4] : [6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, orb.w / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isDash) {
        // Green Dash Ring: Rightward Laser Arrows inside
        ctx.fillStyle = '#ffffff';
        for (let i = -1; i <= 1; i++) {
          const ax = i * 8;
          ctx.beginPath();
          ctx.moveTo(ax + 5, 0);
          ctx.lineTo(ax - 4, -7);
          ctx.lineTo(ax - 4, 7);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Concentric Glowing Energy Orb
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, orb.w / 2 - 4, 0, Math.PI * 2);
        ctx.fill();

        // White Hot Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, (orb.w / 2 - 4) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/**
 * Sci-Fi Quantum Portals with Holographic Icons & Vortex
 */
export function drawPortals(ctx, portals) {
  for (const port of portals) {
    ctx.save();
    const type = port.portalType;
    let color = '#00f0ff';
    let label = 'WAVE';
    let sublabel = 'HOLD TO DART';

    if (type === 'mode_wave') {
      color = '#00f0ff';
      label = 'WAVE';
      sublabel = 'HOLD TO DART';
    } else if (type === 'mode_ship') {
      color = '#ff00aa';
      label = 'SHIP';
      sublabel = 'HOLD TO FLY';
    } else if (type === 'mode_cube') {
      color = '#00ff88';
      label = 'CUBE';
      sublabel = 'JUMP RUN';
    } else if (type === 'gravity_flip') {
      color = '#38bdf8';
      label = 'GRAV';
      sublabel = 'CEILING FLIP';
    } else if (type === 'gravity_normal') {
      color = '#ff7700';
      label = 'NORM';
      sublabel = 'FLOOR FLIP';
    } else if (type === 'speed_2x') {
      color = '#ffd000';
      label = '2X SPEED';
      sublabel = 'OVERDRIVE';
    }

    // Full-Corridor Quantum Gateway Laser Beam (signals full vertical threshold)
    ctx.save();
    const beamGrad = ctx.createLinearGradient(port.x, 0, port.x + port.w, 0);
    beamGrad.addColorStop(0, 'rgba(0,0,0,0)');
    beamGrad.addColorStop(0.5, color === '#ff00aa' ? 'rgba(255, 0, 170, 0.22)' : color === '#00ff88' ? 'rgba(0, 255, 136, 0.22)' : 'rgba(0, 240, 255, 0.22)');
    beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(port.x - 10, 0, port.w + 20, 1200);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(port.x + port.w / 2, 0);
    ctx.lineTo(port.x + port.w / 2, 1200);
    ctx.stroke();
    ctx.restore();

    const cx = port.x + port.w / 2;
    const cy = port.y + port.h / 2;
    ctx.translate(cx, cy);

    if (SPRITES.portalGateway && SPRITES.portalGateway.complete && SPRITES.portalGateway.naturalWidth > 0) {
      // High-Definition Quantum Gateway Portal
      const pw = port.w * 1.35;
      const ph = port.h * 1.2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.drawImage(SPRITES.portalGateway, -pw / 2, -ph / 2, pw, ph);

      // Swirling inner vortex effect
      ctx.save();
      ctx.rotate(port.pulse * 2.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, port.w * 0.32, port.h * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // 1. Swirling Wormhole / Vortex Core
      ctx.save();
      ctx.rotate(port.pulse * 2.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(0, 0, port.w / 2 - 4, port.h / 2 - 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Heavy Sci-Fi Gateway Frame
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, port.w / 2 + 2, port.h / 2 + 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Dark gate backdrop
      ctx.fillStyle = 'rgba(6, 9, 24, 0.75)';
      ctx.fill();
    }

    // 3. Central Holographic Icon
    ctx.shadowBlur = 0;
    if (type === 'mode_wave') {
      // Dart chevron icon
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, -12);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 12);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'mode_ship') {
      // Rocket ship icon
      ctx.fillStyle = '#ff00aa';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'mode_cube') {
      // Cube square icon
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -4, 4, 4);
    } else if (type === 'speed_2x') {
      // Double chevron
      ctx.fillStyle = '#ffd000';
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i * 6 + 5, 0);
        ctx.lineTo(i * 6 - 4, -9);
        ctx.lineTo(i * 6 - 4, 9);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 4. Glowing Nameplate Label above portal
    ctx.fillStyle = color;
    ctx.font = '900 13px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(`[ ${label} ]`, 0, -port.h / 2 - 8);

    // Hint sublabel
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 9px "Chakra Petch", monospace';
    ctx.fillText(sublabel, 0, -port.h / 2 + 4);

    ctx.restore();
  }
}

/**
 * 3D Holographic Crypto Packets
 */
export function drawPackets(ctx, packets) {
  for (const p of packets) {
    if (p.collected) continue;
    ctx.save();
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2 + Math.sin(p.pulse * 3) * 4;

    ctx.translate(cx, cy);
    ctx.rotate(p.pulse);

    if (SPRITES.cryptoPacket && SPRITES.cryptoPacket.complete && SPRITES.cryptoPacket.naturalWidth > 0) {
      // High-Definition Cryptographic Data Packet Gem
      const size = p.w * 1.25;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 16;
      ctx.drawImage(SPRITES.cryptoPacket, -size / 2, -size / 2, size, size);
    } else {
      // Glowing Crypto Diamond
      ctx.fillStyle = '#00ff88';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 14;

      const size = p.w / 2;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center microchip stud
      ctx.fillStyle = '#0a1a0f';
      ctx.fillRect(-3, -3, 6, 6);
    }

    ctx.restore();
  }
}

/**
 * Edge Speed Lines during 2x / Dash
 */
export function drawSpeedVFX(ctx, CANVAS_W, CANVAS_H, speedMult, isDashing) {
  if (speedMult <= 1.0 && !isDashing) return;

  ctx.save();
  ctx.strokeStyle = isDashing ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 240, 255, 0.3)';
  ctx.lineWidth = 2;

  const count = 16;
  for (let i = 0; i < count; i++) {
    const y1 = Math.random() * 90;
    const y2 = CANVAS_H - Math.random() * 90;
    const x = Math.random() * CANVAS_W;
    const len = 90 + Math.random() * 140;

    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x + len, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y2);
    ctx.lineTo(x + len, y2);
    ctx.stroke();
  }
  ctx.restore();
}
