// ============================================================
// hud.js — Authentic Commercial-Grade UI, HUD, & Intel Modal
// Real Geometry Dash 5-button main menu, clean progress bar,
// Threat Intel on crash, Leaderboard, and Victory Screens.
// ============================================================

import { SPRITES } from './assets.js';
import { getCurrentTrackName, getMuted } from './audio.js';
import { getStudentName } from './leaderboard.js';

export const quizOptionBounds = [];
export const hudClickTargets = [];

/**
 * Top Center Geometry Dash Progress Bar
 */
export function drawProgressBar(ctx, percent, CANVAS_W) {
  const barW = Math.min(460, CANVAS_W * 0.48);
  const barH = 10;
  const barX = CANVAS_W / 2 - barW / 2;
  const barY = 16;

  ctx.save();

  // Dark metallic track
  ctx.fillStyle = '#0a1024';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.shadowBlur = 0;

  // Glowing neon fill
  const fillW = Math.max(0, Math.min(barW, (barW * percent) / 100));
  if (fillW > 0) {
    const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#00ff88');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 12;
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.shadowBlur = 0;

    // Glowing white tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX + fillW - 2, barY - 1, 3, barH + 2);
  }

  // Percentage & Phase Readout
  let phaseName = 'PHASE 1: PERIMETER INGRESS';
  if (percent >= 90) phaseName = 'FINAL GATE: MAINFRAME EXTRACTION';
  else if (percent >= 75) phaseName = 'PHASE 5: QUANTUM INVERSION';
  else if (percent >= 55) phaseName = 'PHASE 4: 45° DART WAVE';
  else if (percent >= 35) phaseName = 'PHASE 3: LASER OVERDRIVE';
  else if (percent >= 15) phaseName = 'PHASE 2: SHIP CAVERN';

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText(`${percent}%`, CANVAS_W / 2, barY + barH + 6);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#00f0ff';
  ctx.font = '700 10px "Chakra Petch", monospace';
  ctx.fillText(`// ${phaseName} //`, CANVAS_W / 2, barY + barH + 24);

  ctx.restore();
}

/**
 * In-Game Playing HUD (Score, Active Vehicle, Shield, Attempts)
 */
export function drawPlayingHUD(ctx, score, attempts, CANVAS_W, isMuted, player) {
  ctx.save();
  ctx.font = '900 13px "Orbitron", monospace';

  // 1. Packets (Top Left)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 8;
  ctx.fillText(`◆ PACKETS: ${score}`, 20, 16);
  ctx.shadowBlur = 0;

  // 2. Active Vehicle Badge
  const mode = player.mode || 'cube';
  let modeColor = '#00ff88';
  let modeLabel = 'CUBE';
  let modeHint = 'HOLD/TAP TO HOP';

  if (mode === 'ship') {
    modeColor = '#ff00aa';
    modeLabel = 'SHIP';
    modeHint = 'HOLD TO FLY UP';
  } else if (mode === 'wave') {
    modeColor = '#00f0ff';
    modeLabel = 'WAVE';
    modeHint = 'HOLD UP 45° / RELEASE DOWN 45°';
  }

  ctx.fillStyle = modeColor;
  ctx.font = '900 11px "Orbitron", sans-serif';
  ctx.fillText(`[ VEHICLE: ${modeLabel} ]`, 20, 36);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 9px "Chakra Petch", monospace';
  ctx.fillText(modeHint, 20, 52);

  // 3. Shield Status Badge
  if (player.hasShield) {
    ctx.fillStyle = '#00ff88';
    ctx.font = '900 11px "Orbitron", sans-serif';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillText('🛡️ SHIELD: ACTIVE (1 HIT)', 20, 68);
    ctx.shadowBlur = 0;
  }

  // 4. Attempts (Top Right)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 13px "Orbitron", monospace';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.fillText(`ATTEMPT ${attempts}`, CANVAS_W - 60, 16);
  ctx.shadowBlur = 0;

  // 5. Audio Toggle Button
  const muteX = CANVAS_W - 38;
  const muteY = 12;
  hudClickTargets.push({ id: 'mute_toggle', x: muteX - 5, y: muteY - 2, w: 32, h: 26 });
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.strokeRect(muteX - 5, muteY - 2, 32, 26);
  ctx.fillRect(muteX - 5, muteY - 2, 32, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isMuted ? '🔇' : '🔊', muteX + 11, muteY + 11);

  ctx.restore();
}

/**
 * Authentic Geometry Dash Main Menu
 * Title, Giant Circular Play Button, Operators Button, and Field Intel Button
 */
export function drawMenu(ctx, CANVAS_W, CANVAS_H, player) {
  ctx.save();
  hudClickTargets.length = 0;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Electric Title Header
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 52px "Orbitron", sans-serif';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 26;
  ctx.fillText('RUN BRADY RUN', CANVAS_W / 2, CANVAS_H * 0.26);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = '#ff0055';
  ctx.font = '900 18px "Orbitron", sans-serif';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 10;
  ctx.fillText('// CYBER INFILTRATION //', CANVAS_W / 2, CANVAS_H * 0.33);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px "Chakra Petch", monospace';
  ctx.fillText('CompTIA Network+ & Security+ Rhythm Arcade', CANVAS_W / 2, CANVAS_H * 0.38);

  // Active Operative Callsign Badge
  const studentName = getStudentName();
  const tagText = `[ OPERATIVE: ${studentName.toUpperCase()} ✏️ ]`;
  ctx.font = '700 12px "Orbitron", monospace';
  const tagW = ctx.measureText(tagText).width + 24;
  const tagH = 26;
  const tagX = CANVAS_W / 2 - tagW / 2;
  const tagY = CANVAS_H * 0.43;

  hudClickTargets.push({ id: 'btn_edit_callsign', x: tagX, y: tagY, w: tagW, h: tagH });
  ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
  ctx.fillRect(tagX, tagY, tagW, tagH);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(tagX, tagY, tagW, tagH);

  ctx.fillStyle = '#00f0ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, CANVAS_W / 2, tagY + tagH / 2);

  // 2. Geometry Dash Style 5-Button Center Hub
  const centerY = CANVAS_H * 0.60;
  const pulse = Math.sin(Date.now() / 320) * 0.08 + 1.0;

  // A. CENTER: GIANT PLAY BUTTON
  const playR = 54 * pulse;
  const playX = CANVAS_W / 2;
  hudClickTargets.push({ id: 'btn_play', x: playX - playR, y: centerY - playR, w: playR * 2, h: playR * 2 });

  // Outer glow
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 25 * pulse;
  ctx.beginPath();
  ctx.arc(playX, centerY, playR, 0, Math.PI * 2);
  ctx.fill();

  // Dark inner circle
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#05180f';
  ctx.beginPath();
  ctx.arc(playX, centerY, playR - 6, 0, Math.PI * 2);
  ctx.fill();

  // Green border ring
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Big White Play Triangle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(playX - playR * 0.22, centerY - playR * 0.38);
  ctx.lineTo(playX + playR * 0.42, centerY);
  ctx.lineTo(playX - playR * 0.22, centerY + playR * 0.38);
  ctx.closePath();
  ctx.fill();

  // B. LEFT INNER BUTTON: OPERATORS (Cyan Cube)
  const leftInnerX = CANVAS_W / 2 - 120;
  const sideR = 36;
  hudClickTargets.push({ id: 'btn_operators', x: leftInnerX - sideR, y: centerY - sideR, w: sideR * 2, h: sideR * 2 });

  ctx.fillStyle = '#0a1a36';
  ctx.beginPath();
  ctx.arc(leftInnerX, centerY, sideR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Mini Cube Icon inside
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(leftInnerX - 12, centerY - 12, 24, 24);
  ctx.fillStyle = '#061022';
  ctx.fillRect(leftInnerX - 9, centerY - 9, 18, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(leftInnerX - 6, centerY - 6, 4, 4);
  ctx.fillRect(leftInnerX + 2, centerY - 6, 4, 4);

  // Label under button
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 11px "Orbitron", sans-serif';
  ctx.fillText('OPERATORS', leftInnerX, centerY + sideR + 18);

  // C. LEFT OUTER BUTTON: FIELD INTEL (Amber Shield)
  const leftOuterX = CANVAS_W / 2 - 230;
  const outerR = 33;
  hudClickTargets.push({ id: 'btn_intel', x: leftOuterX - outerR, y: centerY - outerR, w: outerR * 2, h: outerR * 2 });

  ctx.fillStyle = '#221504';
  ctx.beginPath();
  ctx.arc(leftOuterX, centerY, outerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffb703';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = '#ffb703';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffb703';
  ctx.font = '900 22px sans-serif';
  ctx.fillText('🛡️', leftOuterX, centerY + 2);

  ctx.fillStyle = '#ffb703';
  ctx.font = '900 10px "Orbitron", sans-serif';
  ctx.fillText('FIELD INTEL', leftOuterX, centerY + outerR + 18);

  // D. RIGHT INNER BUTTON: LEADERBOARD (Gold Trophy)
  const rightInnerX = CANVAS_W / 2 + 120;
  hudClickTargets.push({ id: 'btn_leaderboard', x: rightInnerX - sideR, y: centerY - sideR, w: sideR * 2, h: sideR * 2 });

  ctx.fillStyle = '#261b05';
  ctx.beginPath();
  ctx.arc(rightInnerX, centerY, sideR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd000';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ffd000';
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffd000';
  ctx.font = '900 22px sans-serif';
  ctx.fillText('🏆', rightInnerX, centerY + 2);

  ctx.fillStyle = '#ffd000';
  ctx.font = '900 11px "Orbitron", sans-serif';
  ctx.fillText('LEADERBOARD', rightInnerX, centerY + sideR + 18);

  // E. RIGHT OUTER BUTTON: CALLSIGN (Purple Profile)
  const rightOuterX = CANVAS_W / 2 + 230;
  hudClickTargets.push({ id: 'btn_edit_callsign', x: rightOuterX - outerR, y: centerY - outerR, w: outerR * 2, h: outerR * 2 });

  ctx.fillStyle = '#1c0e2d';
  ctx.beginPath();
  ctx.arc(rightOuterX, centerY, outerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d946ef';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = '#d946ef';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#d946ef';
  ctx.font = '900 22px sans-serif';
  ctx.fillText('👤', rightOuterX, centerY + 2);

  ctx.fillStyle = '#d946ef';
  ctx.font = '900 10px "Orbitron", sans-serif';
  ctx.fillText('CALLSIGN', rightOuterX, centerY + outerR + 18);

  // 3. Audio Toggle Button
  const muteX = CANVAS_W - 38;
  const muteY = 16;
  hudClickTargets.push({ id: 'mute_toggle', x: muteX - 5, y: muteY - 2, w: 32, h: 26 });
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.strokeRect(muteX - 5, muteY - 2, 32, 26);
  ctx.fillRect(muteX - 5, muteY - 2, 32, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  ctx.fillText(getMuted() ? '🔇' : '🔊', muteX + 11, muteY + 11);

  // 4. Soundtrack Selector Badge
  const trackName = getCurrentTrackName();
  const trackBtnW = 380;
  const trackBtnH = 30;
  const trackBtnX = CANVAS_W / 2 - trackBtnW / 2;
  const trackBtnY = CANVAS_H - 78;
  hudClickTargets.push({ id: 'btn_cycle_track', x: trackBtnX, y: trackBtnY, w: trackBtnW, h: trackBtnH });

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(trackBtnX, trackBtnY, trackBtnW, trackBtnH);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(trackBtnX, trackBtnY, trackBtnW, trackBtnH);

  ctx.fillStyle = '#00f0ff';
  ctx.font = '700 11px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🎵 TRACK: ${trackName.toUpperCase()} ↺`, CANVAS_W / 2, trackBtnY + trackBtnH / 2);

  // 5. Clean Bottom Prompt
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '700 13px "Orbitron", sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK PLAY TO START', CANVAS_W / 2, CANVAS_H - 30);

  ctx.restore();
}

/**
 * Dedicated Full-Screen Field Intel / Mechanics Manual Modal
 */
export function drawIntelModal(ctx, CANVAS_W, CANVAS_H) {
  ctx.save();
  hudClickTargets.length = 0;

  // Dark overlay
  ctx.fillStyle = 'rgba(4, 7, 16, 0.96)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const boxW = Math.min(780, CANVAS_W - 30);
  const boxH = Math.min(570, CANVAS_H - 30);
  const boxX = CANVAS_W / 2 - boxW / 2;
  const boxY = CANVAS_H / 2 - boxH / 2;

  // Tech frame
  ctx.fillStyle = 'rgba(10, 16, 32, 0.98)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 18;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.shadowBlur = 0;

  // Header
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 20px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CYBERNETIC FIELD MANUAL // HOW TO PLAY', CANVAS_W / 2, boxY + 20);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 12px "Chakra Petch", monospace';
  ctx.fillText('Cyber Rhythm Mechanics & CompTIA Defense Operations', CANVAS_W / 2, boxY + 48);

  // 8 Complete Mechanics Cards
  const cards = [
    { badge: '🟡 YELLOW PAD', title: 'Springboard', desc: 'Auto-launches high into air on surface contact (no jump press needed).', color: '#ffd000' },
    { badge: '🟡 CIPHER RING', title: 'Mid-Air Leap', desc: 'Tap or hold Jump while inside the glowing ring for a mid-air elevation hop.', color: '#ffd000' },
    { badge: '🟢 DASH RING', title: 'Laser Dash', desc: 'Tap & hold Jump to streak straight across massive chasms. Release to drop.', color: '#00ff88' },
    { badge: '🚀 ROCKET DRONE', title: 'Ship Mode', desc: 'Hold Jump to fire thrusters & fly up; release to smoothly glide downward.', color: '#ff00aa' },
    { badge: '⚡ WAVE DART', title: 'Wave Mode', desc: 'Hold Jump to dart up 45°; release to dive down 45° through narrow conduits.', color: '#00f0ff' },
    { badge: '🛡️ FIREWALL SHIELD', title: 'Bypass Protocol', desc: 'On crash, press [Q] to solve CompTIA Security+ query & deploy a 1-hit shield!', color: '#00ff88' },
    { badge: '⏩ OVERDRIVE GATE', title: '2X Speed', desc: 'Accelerates network tempo and world scroll into high-speed overdrive!', color: '#ffd000' },
    { badge: '🌀 GRAVITY PORTAL', title: 'Polarity Flip', desc: 'Inverts gravity to run along the ceiling. Up is down, down is up!', color: '#38bdf8' },
  ];

  const cardW = (boxW - 56) / 2;
  const cardH = 74;
  const startX = boxX + 22;
  const startY = boxY + 74;

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = startX + col * (cardW + 12);
    const cy = startY + row * (cardH + 8);

    // Card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(cx, cy, cardW, cardH);
    ctx.strokeStyle = card.color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx, cy, cardW, cardH);

    // Badge
    ctx.fillStyle = card.color;
    ctx.font = '900 11px "Orbitron", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(card.badge, cx + 10, cy + 10);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px "Orbitron", sans-serif';
    ctx.fillText(`— ${card.title}`, cx + 130, cy + 10);

    // Description (Wrapped cleanly)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 11px "Chakra Petch", sans-serif';
    wrapText(card.desc, cardW - 20, ctx, '11px "Chakra Petch"').forEach((line, li) => {
      ctx.fillText(line, cx + 10, cy + 30 + li * 16);
    });
  });

  // Close / Back Button
  const btnW = 240;
  const btnH = 40;
  const btnX = CANVAS_W / 2 - btnW / 2;
  const btnY = boxY + boxH - 52;
  hudClickTargets.push({ id: 'btn_close_intel', x: btnX, y: btnY, w: btnW, h: btnH });

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = '#000000';
  ctx.font = '900 14px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BACK TO MENU', CANVAS_W / 2, btnY + btnH / 2);

  ctx.restore();
}

/**
 * Crash Overlay with Threat Intel and Instant Retry / Bypass
 */
export function drawCrashScreen(ctx, lastObstacle, CANVAS_W, CANVAS_H, attempts, score = 0, percent = 0) {
  ctx.save();
  hudClickTargets.length = 0;

  ctx.fillStyle = 'rgba(4, 7, 16, 0.94)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Red accent top rail
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 18;
  ctx.fillRect(0, 0, CANVAS_W, 3);
  ctx.shadowBlur = 0;

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 38px "Orbitron", sans-serif';
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 24;
  ctx.fillText('BREACH DETECTED', CANVAS_W / 2, CANVAS_H / 2 - 135);
  ctx.shadowBlur = 0;

  ctx.font = '700 14px "Chakra Petch", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`ATTEMPT ${attempts} FAILED  •  PROGRESS: ${percent}%  •  PACKETS: ${score} ◆`, CANVAS_W / 2, CANVAS_H / 2 - 95);

  // Threat Intel Box
  if (lastObstacle && lastObstacle.tips) {
    const tipBoxW = Math.min(620, CANVAS_W - 40);
    const tipBoxH = 75;
    const tipBoxX = CANVAS_W / 2 - tipBoxW / 2;
    const tipBoxY = CANVAS_H / 2 - 70;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(tipBoxX, tipBoxY, tipBoxW, tipBoxH);
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tipBoxX, tipBoxY, tipBoxW, tipBoxH);

    ctx.fillStyle = '#ff0055';
    ctx.font = '900 11px "Orbitron", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('[ THREAT INTEL // COMPTIA SECURITY+ ]', tipBoxX + 16, tipBoxY + 16);

    const tip = lastObstacle.tips[lastObstacle.tipIndex || 0] || 'Network anomaly caused packet loss.';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 13px "Chakra Petch", monospace';
    wrapText(tip, tipBoxW - 32, ctx, '13px "Chakra Petch"').forEach((line, i) => {
      ctx.fillText(line, tipBoxX + 16, tipBoxY + 36 + i * 18);
    });
  }

  // 1. Instant Retry Button
  const retryBtnY = CANVAS_H / 2 + 25;
  hudClickTargets.push({ id: 'btn_retry', x: CANVAS_W / 2 - 190, y: retryBtnY - 18, w: 380, h: 38 });
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.fillRect(CANVAS_W / 2 - 190, retryBtnY - 18, 380, 38);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(CANVAS_W / 2 - 190, retryBtnY - 18, 380, 38);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 14px "Orbitron", sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO RETRY', CANVAS_W / 2, retryBtnY + 2);

  // 2. Bypass Protocol Quiz Button
  const quizBtnY = CANVAS_H / 2 + 75;
  hudClickTargets.push({ id: 'btn_quiz', x: CANVAS_W / 2 - 210, y: quizBtnY - 18, w: 420, h: 40 });
  ctx.fillStyle = 'rgba(0, 255, 136, 0.22)';
  ctx.fillRect(CANVAS_W / 2 - 210, quizBtnY - 18, 420, 40);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 12;
  ctx.strokeRect(CANVAS_W / 2 - 210, quizBtnY - 18, 420, 40);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#00ff88';
  ctx.font = '900 13px "Orbitron", sans-serif';
  ctx.fillText('[ Q ] BYPASS PROTOCOL (REVIVE W/ SHIELD)', CANVAS_W / 2, quizBtnY + 2);

  // 3. View Leaderboard Button
  const ldrBtnY = CANVAS_H / 2 + 125;
  hudClickTargets.push({ id: 'btn_view_leaderboard', x: CANVAS_W / 2 - 160, y: ldrBtnY - 16, w: 320, h: 34 });
  ctx.fillStyle = 'rgba(255, 208, 0, 0.18)';
  ctx.fillRect(CANVAS_W / 2 - 160, ldrBtnY - 16, 320, 34);
  ctx.strokeStyle = '#ffd000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(CANVAS_W / 2 - 160, ldrBtnY - 16, 320, 34);

  ctx.fillStyle = '#ffd000';
  ctx.font = '900 12px "Orbitron", sans-serif';
  ctx.fillText('🏆 [ L ] VIEW LEADERBOARD', CANVAS_W / 2, ldrBtnY + 2);

  // 4. Back to Menu
  const menuBtnY = CANVAS_H / 2 + 172;
  hudClickTargets.push({ id: 'btn_back_to_menu', x: CANVAS_W / 2 - 120, y: menuBtnY - 14, w: 240, h: 28 });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(CANVAS_W / 2 - 120, menuBtnY - 14, 240, 28);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_W / 2 - 120, menuBtnY - 14, 240, 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 11px "Orbitron", sans-serif';
  ctx.fillText('MAIN MENU', CANVAS_W / 2, menuBtnY + 2);

  ctx.restore();
}

/**
 * Quiz Challenge Overlay
 */
export function drawQuizOverlay(ctx, quiz, CANVAS_W, CANVAS_H) {
  ctx.save();
  quizOptionBounds.length = 0;

  ctx.fillStyle = 'rgba(6, 9, 20, 0.96)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const boxW = Math.min(680, CANVAS_W - 40);
  const boxH = Math.min(480, CANVAS_H - 40);
  const boxX = CANVAS_W / 2 - boxW / 2;
  const boxY = CANVAS_H / 2 - boxH / 2;

  ctx.fillStyle = 'rgba(12, 20, 36, 0.96)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 16;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.shadowBlur = 0;

  // Header
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 18px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FIREWALL OVERRIDE // COMPTIA SECURITY PROTOCOL', CANVAS_W / 2, boxY + 24);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px "Chakra Petch", monospace';
  ctx.fillText('Solve security challenge to deploy Firewall Shield & resume run', CANVAS_W / 2, boxY + 52);

  if (!quiz) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px "Orbitron", sans-serif';
    ctx.fillText('INITIALIZING SECURITY QUERY…', CANVAS_W / 2, boxY + 180);
    ctx.restore();
    return;
  }

  // Question Box
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px "Chakra Petch", sans-serif';
  const qLines = wrapText(quiz.question, boxW - 60, ctx, '700 15px "Chakra Petch"');
  qLines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, boxY + 90 + i * 24);
  });

  // 4 Option Cards
  const optionsStartY = boxY + 100 + qLines.length * 24 + 15;
  const optW = boxW - 60;
  const optH = 46;

  quiz.options.forEach((opt, i) => {
    const optX = CANVAS_W / 2 - optW / 2;
    const optY = optionsStartY + i * (optH + 12);
    quizOptionBounds.push({ x: optX, y: optY, w: optW, h: optH, index: i });

    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.fillRect(optX, optY, optW, optH);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(optX, optY, optW, optH);

    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(optX, optY, 38, optH);
    ctx.fillStyle = '#000000';
    ctx.font = '900 14px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, optX + 19, optY + optH / 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(opt, optX + 50, optY + optH / 2);
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '12px "Chakra Petch", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Press [1] - [4] or Click Option to submit answer', CANVAS_W / 2, boxY + boxH - 14);

  ctx.restore();
}

/**
 * Quiz Feedback Overlay
 */
export function drawQuizFeedback(ctx, quiz, isCorrect, CANVAS_W, CANVAS_H) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 9, 20, 0.97)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const themeColor = isCorrect ? '#00ff88' : '#ff0055';

  ctx.fillStyle = themeColor;
  ctx.font = '900 32px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 20;
  ctx.fillText(isCorrect ? 'ACCESS GRANTED' : 'ACCESS DENIED', CANVAS_W / 2, CANVAS_H / 2 - 80);
  ctx.shadowBlur = 0;

  ctx.font = '700 16px "Chakra Petch", monospace';
  ctx.fillText(
    isCorrect ? 'FIREWALL SHIELD DEPLOYED // RESUMING RUN' : 'SECURITY CREDENTIALS REJECTED',
    CANVAS_W / 2,
    CANVAS_H / 2 - 40
  );

  if (quiz && !isCorrect) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px "Chakra Petch", monospace';
    ctx.fillText(`Correct Protocol: ${quiz.answer}`, CANVAS_W / 2, CANVAS_H / 2 + 5);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 15px "Orbitron", sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO PROCEED', CANVAS_W / 2, CANVAS_H / 2 + 80);

  ctx.restore();
}

/**
 * Character Select Screen
 */
export function drawCharacterSelect(ctx, CANVAS_W, CANVAS_H, CHARACTERS) {
  ctx.save();
  hudClickTargets.length = 0;

  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 28px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 14;
  ctx.fillText('SELECT YOUR CYBER OPERATOR', CANVAS_W / 2, 45);
  ctx.shadowBlur = 0;

  const charKeys = Object.keys(CHARACTERS);
  const cardW = 180;
  const cardH = 220;
  const gap = 35;
  const totalW = charKeys.length * cardW + (charKeys.length - 1) * gap;
  const startX = CANVAS_W / 2 - totalW / 2;
  const cardY = CANVAS_H / 2 - cardH / 2 + 10;

  charKeys.forEach((key, i) => {
    const config = CHARACTERS[key];
    const x = startX + i * (cardW + gap);

    hudClickTargets.push({ id: `select_char_${key}`, key, x, y: cardY, w: cardW, h: cardH });

    ctx.fillStyle = 'rgba(12, 20, 36, 0.9)';
    ctx.fillRect(x, cardY, cardW, cardH);

    ctx.strokeStyle = config.glowColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = 12;
    ctx.strokeRect(x, cardY, cardW, cardH);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(config.name, x + cardW / 2, cardY + 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px "Chakra Petch", monospace';
    ctx.fillText(config.title, x + cardW / 2, cardY + 40);

    // Character preview
    const dummyAngle = Math.sin(Date.now() / 600 + i) * 0.25;
    ctx.save();
    ctx.translate(x + cardW / 2, cardY + 119);
    ctx.rotate(dummyAngle);

    if (SPRITES.cubeHero && SPRITES.cubeHero.complete && SPRITES.cubeHero.naturalWidth > 0) {
      ctx.shadowColor = config.glowColor;
      ctx.shadowBlur = 14;
      ctx.drawImage(SPRITES.cubeHero, -24, -24, 48, 48);
      if (key !== 'Admin') {
        ctx.strokeStyle = config.glowColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-22, -22, 44, 44);
      }
    } else {
      ctx.fillStyle = config.primaryColor;
      ctx.fillRect(-24, -24, 48, 48);
      ctx.fillStyle = config.secondaryColor;
      ctx.fillRect(-19, -19, 38, 38);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, -10, 8, 8);
      ctx.fillRect(2, -10, 8, 8);
    }
    ctx.restore();

    ctx.fillStyle = config.glowColor;
    ctx.fillRect(x + 20, cardY + cardH - 42, cardW - 40, 28);
    ctx.fillStyle = '#000000';
    ctx.font = '900 12px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SELECT', x + cardW / 2, cardY + cardH - 28);
  });

  // Back to menu button
  const backW = 160;
  const backH = 34;
  const backX = CANVAS_W / 2 - backW / 2;
  const backY = CANVAS_H - 55;
  hudClickTargets.push({ id: 'btn_back_to_menu', x: backX, y: backY, w: backW, h: backH });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(backX, backY, backW, backH);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 12px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BACK TO MENU', CANVAS_W / 2, backY + backH / 2);

  ctx.restore();
}

/**
 * Dedicated Student Operative Leaderboard Screen
 */
export function drawLeaderboardScreen(ctx, CANVAS_W, CANVAS_H, leaderboardData, currentStudentName) {
  ctx.save();
  hudClickTargets.length = 0;

  // Backdrop
  ctx.fillStyle = 'rgba(6, 9, 20, 0.96)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Top Title
  ctx.fillStyle = '#ffd000';
  ctx.font = '900 32px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = '#ffd000';
  ctx.shadowBlur = 18;
  ctx.fillText('BEATTIETECH // OPERATIVE LEADERBOARD', CANVAS_W / 2, 30);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px "Chakra Petch", monospace';
  ctx.fillText('CompTIA Cyber Infiltration High Scores & Network Clearances', CANVAS_W / 2, 70);

  // Active Operative Banner
  ctx.fillStyle = '#00f0ff';
  ctx.font = '700 12px "Orbitron", monospace';
  ctx.fillText(`LOGGED IN AS: ${currentStudentName.toUpperCase()}`, CANVAS_W / 2, 94);

  // Table Card
  const cardW = Math.min(860, CANVAS_W - 30);
  const cardH = Math.min(420, CANVAS_H - 180);
  const cardX = CANVAS_W / 2 - cardW / 2;
  const cardY = 118;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = 'rgba(255, 208, 0, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Table Header
  const headerH = 34;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(cardX, cardY, cardW, headerH);

  ctx.font = '900 11px "Orbitron", sans-serif';
  ctx.fillStyle = '#ffd000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const hy = cardY + headerH / 2;
  ctx.fillText('RANK', cardX + 20, hy);
  ctx.fillText('OPERATIVE', cardX + 100, hy);
  ctx.fillText('PROGRESS', cardX + 320, hy);
  ctx.fillText('PACKETS', cardX + 480, hy);
  ctx.fillText('ATTEMPTS', cardX + 600, hy);
  ctx.fillText('CLEARANCE', cardX + 710, hy);

  // Rows
  const rows = (leaderboardData || []).slice(0, 8);
  const rowH = 42;
  const startRowY = cardY + headerH;

  rows.forEach((row, i) => {
    const y = startRowY + i * rowH;
    if (y + rowH > cardY + cardH) return;

    const isCurrent = row.studentName && row.studentName.toLowerCase() === currentStudentName.toLowerCase();

    // Row background
    if (isCurrent) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.fillRect(cardX + 2, y, cardW - 4, rowH - 2);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX + 2, y, cardW - 4, rowH - 2);
    } else if (i % 2 === 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(cardX + 2, y, cardW - 4, rowH - 2);
    }

    const textY = y + rowH / 2;

    // Rank
    let rankText = `#${i + 1}`;
    if (i === 0) rankText = '🥇 1st';
    else if (i === 1) rankText = '🥈 2nd';
    else if (i === 2) rankText = '🥉 3rd';

    ctx.font = '900 12px "Orbitron", monospace';
    ctx.fillStyle = i === 0 ? '#ffd000' : i === 1 ? '#e2e8f0' : i === 2 ? '#cd7f32' : '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(rankText, cardX + 20, textY);

    // Operative Name
    ctx.fillStyle = isCurrent ? '#00ff88' : '#ffffff';
    ctx.font = '700 13px "Chakra Petch", sans-serif';
    ctx.fillText(row.studentName || 'Operative', cardX + 100, textY);

    // Progress
    const pct = row.percent || 0;
    ctx.fillStyle = row.completed ? '#00ff88' : '#00f0ff';
    ctx.font = '900 12px "Orbitron", monospace';
    ctx.fillText(`${pct}%`, cardX + 320, textY);

    // Packets
    ctx.fillStyle = '#00ff88';
    ctx.font = '700 12px "Orbitron", monospace';
    ctx.fillText(`◆ ${row.score || 0}`, cardX + 480, textY);

    // Attempts
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 12px "Orbitron", monospace';
    ctx.fillText(`${row.attempts || 1}`, cardX + 600, textY);

    // Clearance Badge
    ctx.fillStyle = row.badge === 'S-RANK' ? '#00f0ff' : row.badge === 'A-RANK' ? '#00ff88' : '#ffb703';
    ctx.font = '900 11px "Orbitron", monospace';
    ctx.fillText(row.badge || 'OPERATIVE', cardX + 710, textY);
  });

  // Buttons at bottom
  const btnY = CANVAS_H - 52;
  const btnW = 190;
  const btnH = 36;

  // 1. Change Callsign
  const callsignX = CANVAS_W / 2 - btnW - 12;
  hudClickTargets.push({ id: 'btn_edit_callsign', x: callsignX, y: btnY, w: btnW, h: btnH });
  ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
  ctx.fillRect(callsignX, btnY, btnW, btnH);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(callsignX, btnY, btnW, btnH);
  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 12px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EDIT CALLSIGN ✏️', callsignX + btnW / 2, btnY + btnH / 2);

  // 2. Back to Menu
  const backX = CANVAS_W / 2 + 12;
  hudClickTargets.push({ id: 'btn_back_to_menu', x: backX, y: btnY, w: btnW, h: btnH });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(backX, btnY, btnW, btnH);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(backX, btnY, btnW, btnH);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BACK TO MENU', backX + btnW / 2, btnY + btnH / 2);

  ctx.restore();
}

/**
 * Cyber Infiltration Victory Screen (100% Infiltration Completed)
 */
export function drawVictoryScreen(ctx, CANVAS_W, CANVAS_H, score, attempts, studentName, finalRank) {
  ctx.save();
  hudClickTargets.length = 0;

  // Semi-transparent backdrop with glowing scanlines
  ctx.fillStyle = 'rgba(4, 8, 20, 0.96)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Neon Green top accent rail
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 20;
  ctx.fillRect(0, 0, CANVAS_W, 4);
  ctx.shadowBlur = 0;

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 44px "Orbitron", sans-serif';
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 30;
  ctx.fillText('FIREWALL BREACHED', CANVAS_W / 2, CANVAS_H * 0.20);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#00f0ff';
  ctx.font = '900 17px "Orbitron", sans-serif';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.fillText('// MAINFRAME OVERRIDDEN • 100% INFILTRATION //', CANVAS_W / 2, CANVAS_H * 0.27);
  ctx.shadowBlur = 0;

  // Center Performance Card
  const cardW = Math.min(620, CANVAS_W - 40);
  const cardH = 220;
  const cardX = CANVAS_W / 2 - cardW / 2;
  const cardY = CANVAS_H * 0.33;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 18;
  ctx.strokeRect(cardX, cardY, cardW, cardH);
  ctx.shadowBlur = 0;

  // Rank Clearance Badge
  let badgeTitle = 'ZERO-DAY PHANTOM';
  let badgeRank = 'S-RANK';
  let badgeColor = '#00f0ff';
  if (attempts > 9) {
    badgeTitle = 'SCRIPT OPERATIVE';
    badgeRank = 'C-RANK';
    badgeColor = '#ffd000';
  } else if (attempts > 4) {
    badgeTitle = 'PENETRATION TESTER';
    badgeRank = 'B-RANK';
    badgeColor = '#00ff88';
  } else if (attempts > 2) {
    badgeTitle = 'CYBER SPECIALIST';
    badgeRank = 'A-RANK';
    badgeColor = '#00ff88';
  }

  ctx.fillStyle = badgeColor;
  ctx.font = '900 24px "Orbitron", sans-serif';
  ctx.fillText(`[ ${badgeRank} // ${badgeTitle} ]`, CANVAS_W / 2, cardY + 40);

  // Statistics Breakdown
  ctx.font = '700 14px "Chakra Petch", monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`OPERATIVE: ${studentName.toUpperCase()}`, CANVAS_W / 2, cardY + 85);
  ctx.fillText(`DATA PACKETS EXFILTRATED: ${score} ◆`, CANVAS_W / 2, cardY + 115);
  ctx.fillText(`SYSTEM BREACH ATTEMPTS: ${attempts}`, CANVAS_W / 2, cardY + 145);

  ctx.fillStyle = '#ffd000';
  ctx.font = '900 13px "Orbitron", monospace';
  ctx.fillText(finalRank ? `★ RANKED #${finalRank} ON BEATTIETECH LEADERBOARD ★` : '★ TELEMETRY RECORDED TO BEATTIETECH NETWORK ★', CANVAS_W / 2, cardY + 182);

  // Action Buttons
  const btnY = CANVAS_H * 0.72;
  const btnW = 190;
  const btnH = 42;

  // 1. View Leaderboard
  const ldrX = CANVAS_W / 2 - btnW - 12;
  hudClickTargets.push({ id: 'btn_view_leaderboard', x: ldrX, y: btnY, w: btnW, h: btnH });
  ctx.fillStyle = 'rgba(255, 208, 0, 0.22)';
  ctx.fillRect(ldrX, btnY, btnW, btnH);
  ctx.strokeStyle = '#ffd000';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#ffd000';
  ctx.shadowBlur = 10;
  ctx.strokeRect(ldrX, btnY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd000';
  ctx.font = '900 13px "Orbitron", sans-serif';
  ctx.fillText('🏆 LEADERBOARD', ldrX + btnW / 2, btnY + btnH / 2);

  // 2. Play Again
  const playX = CANVAS_W / 2 + 12;
  hudClickTargets.push({ id: 'btn_retry', x: playX, y: btnY, w: btnW, h: btnH });
  ctx.fillStyle = 'rgba(0, 255, 136, 0.22)';
  ctx.fillRect(playX, btnY, btnW, btnH);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 10;
  ctx.strokeRect(playX, btnY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#00ff88';
  ctx.fillText('↺ PLAY AGAIN', playX + btnW / 2, btnY + btnH / 2);

  // 3. Back to Menu
  const menuY = btnY + 56;
  const menuW = 160;
  const menuH = 34;
  const menuX = CANVAS_W / 2 - menuW / 2;
  hudClickTargets.push({ id: 'btn_back_to_menu', x: menuX, y: menuY, w: menuW, h: menuH });
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(menuX, menuY, menuW, menuH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(menuX, menuY, menuW, menuH);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 12px "Orbitron", sans-serif';
  ctx.fillText('MAIN MENU', CANVAS_W / 2, menuY + menuH / 2);

  ctx.restore();
}

function wrapText(text, maxWidth, ctx, font) {
  ctx.font = font;
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
