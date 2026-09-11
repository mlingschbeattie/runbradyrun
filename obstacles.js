// ============================================================
// obstacles.js — Cyber Infiltration Obstacles & Gateways
// Spikes, Blocks, Pads, Orbs, Green Dash Rings,
// Mode Portals: Wave, Ship, Cube, Gravity & Speed Gates.
// ============================================================

import { BLOCK_SIZE } from './physics.js';

export const SECURITY_TIPS = {
  FIREWALL: [
    'Firewalls filter packets based on rules to block unauthorized network access',
    'Stateful firewalls track connection state, stateless only inspect individual headers',
    'Next-Gen Firewalls (NGFW) combine deep packet inspection with application awareness',
  ],
  MALWARE: [
    'Viruses require a host file, worms self-replicate autonomously across networks',
    'Trojans disguise as benign software to deliver malicious secondary payloads',
    'Ransomware encrypts victim data using asymmetric/symmetric ciphers and demands ransom',
  ],
  ENCRYPTION: [
    'AES-256 is the symmetric gold standard for encrypting data at rest',
    'Public-key cryptography uses key pairs: public to encrypt, private to decrypt',
    'TLS 1.3 establishes encrypted tunnels for secure HTTPS communication',
  ],
};

export function createSpike(x, y, variant = 'malware', direction = 1) {
  const tips = variant === 'firewall' ? SECURITY_TIPS.FIREWALL : SECURITY_TIPS.MALWARE;
  return {
    type: 'spike',
    variant,
    x,
    y: direction === 1 ? y - BLOCK_SIZE : y,
    w: BLOCK_SIZE,
    h: BLOCK_SIZE,
    direction,
    tips,
    tipIndex: Math.floor(Math.random() * tips.length),
  };
}

export function createSaw(x, y, radius = 28) {
  return {
    type: 'saw',
    x: x - radius,
    y: y - radius,
    w: radius * 2,
    h: radius * 2,
    radius,
    angle: 0,
    tips: SECURITY_TIPS.MALWARE,
    tipIndex: Math.floor(Math.random() * SECURITY_TIPS.MALWARE.length),
  };
}

export function createPad(x, y, padType = 'yellow', direction = 1) {
  return {
    type: 'pad',
    padType,
    x,
    y: direction === 1 ? y - 14 : y,
    w: BLOCK_SIZE,
    h: 14,
    direction,
    pulse: 0,
  };
}

export function createOrb(x, y, orbType = 'yellow') {
  return {
    type: 'orb',
    orbType, // 'yellow' | 'pink' | 'blue' | 'dash_green'
    x,
    y,
    w: 42,
    h: 42,
    pulse: 0,
    activated: false,
  };
}

// ── Mode & Speed Portals ──────────────────────────────────────
export function createPortal(x, y, portalType = 'mode_wave') {
  // portalType:
  // 'mode_wave' (Cyan) | 'mode_ship' (Magenta) | 'mode_cube' (Green) |
  // 'gravity_flip' (Blue) | 'gravity_normal' (Orange) | 'speed_2x' (Yellow arrows)
  return {
    type: 'portal',
    portalType,
    x,
    y: y - 100,
    w: 44,
    h: 100,
    used: false,
    pulse: 0,
  };
}

export function createPacket(x, y) {
  return {
    type: 'packet',
    x,
    y,
    w: 22,
    h: 22,
    pulse: 0,
    collected: false,
  };
}

export function createBlock(x, y, w = BLOCK_SIZE, h = BLOCK_SIZE, label = 'ENC') {
  return {
    type: 'block',
    x,
    y,
    w,
    h,
    label,
    tips: SECURITY_TIPS.ENCRYPTION,
    tipIndex: Math.floor(Math.random() * SECURITY_TIPS.ENCRYPTION.length),
  };
}

export function scrollObjects(list, dt, speed) {
  const shift = speed * dt;
  for (let i = list.length - 1; i >= 0; i--) {
    const obj = list[i];
    obj.x -= shift;

    if (obj.type === 'saw') {
      obj.angle += 0.14 * dt;
    }
    if (obj.type === 'orb' || obj.type === 'pad' || obj.type === 'packet' || obj.type === 'portal') {
      obj.pulse = (obj.pulse || 0) + 0.08 * dt;
    }
  }
  return list.filter(obj => obj.x + (obj.w || 70) > -120);
}
