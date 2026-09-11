// ============================================================
// level.js — Cyber Infiltration Multi-Phase Campaign
// Phases: Cube Ingress -> Ship Cavern -> Dash Overdrive ->
// The Wave Dart Zig-Zag -> Quantum Core Inversion.
// ============================================================

import { BLOCK_SIZE } from './physics.js';
import {
  createSpike, createBlock, createPad, createOrb,
  createSaw, createPortal, createPacket
} from './obstacles.js';

export const LEVEL_GOAL_DISTANCE = 16000;

export const PATTERNS = [
  // ── 1. Cube: Perimeter Ingress (Introductory Rhythm) ─────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Single spike 1 with guide packet above
    hazards.push(createSpike(startX + BLOCK_SIZE * 3, gy, 'malware'));
    packets.push(createPacket(startX + BLOCK_SIZE * 3, gy - BLOCK_SIZE * 2.2));

    // Single spike 2
    hazards.push(createSpike(startX + BLOCK_SIZE * 8, gy, 'malware'));
    packets.push(createPacket(startX + BLOCK_SIZE * 8, gy - BLOCK_SIZE * 2.2));

    // Double spike 3 & 4
    hazards.push(createSpike(startX + BLOCK_SIZE * 13, gy, 'trojan'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 14, gy, 'trojan'));
    packets.push(createPacket(startX + BLOCK_SIZE * 13.5, gy - BLOCK_SIZE * 2.4));

    // First safe elevated platform (FW_01) - 4 blocks wide, 1 block high
    // Ample runway from double spike (14) to platform (18) = 4 blocks!
    blocks.push(createBlock(startX + BLOCK_SIZE * 18, gy - BLOCK_SIZE, BLOCK_SIZE * 4, BLOCK_SIZE, 'FW_01'));
    packets.push(createPacket(startX + BLOCK_SIZE * 19, gy - BLOCK_SIZE * 2.0));
    packets.push(createPacket(startX + BLOCK_SIZE * 20.5, gy - BLOCK_SIZE * 2.0));

    // Clean runway after dropping off platform
    return { length: BLOCK_SIZE * 25, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 2. Cube: Stepped Towers (Staircase Rhythm) ───────────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Single spike on the floor
    hazards.push(createSpike(startX + BLOCK_SIZE * 3, gy, 'malware'));
    packets.push(createPacket(startX + BLOCK_SIZE * 3, gy - BLOCK_SIZE * 2.2));

    // Step 1: 1 block high (width 3)
    blocks.push(createBlock(startX + BLOCK_SIZE * 6, gy - BLOCK_SIZE, BLOCK_SIZE * 3, BLOCK_SIZE, 'STEP_1'));
    packets.push(createPacket(startX + BLOCK_SIZE * 7.5, gy - BLOCK_SIZE * 2.0));

    // Step 2: 2 blocks high (width 3) - hop from Step 1!
    blocks.push(createBlock(startX + BLOCK_SIZE * 10, gy - BLOCK_SIZE * 2, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'STEP_2'));
    packets.push(createPacket(startX + BLOCK_SIZE * 11.5, gy - BLOCK_SIZE * 3.0));

    // Step 3: 1 block high (width 3) - hop down from Step 2!
    blocks.push(createBlock(startX + BLOCK_SIZE * 14, gy - BLOCK_SIZE, BLOCK_SIZE * 3, BLOCK_SIZE, 'STEP_3'));
    packets.push(createPacket(startX + BLOCK_SIZE * 15.5, gy - BLOCK_SIZE * 2.0));

    // Drop down to floor, single spike at 19
    hazards.push(createSpike(startX + BLOCK_SIZE * 19, gy, 'firewall'));

    return { length: BLOCK_SIZE * 23, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 3. Cube: Yellow Pad High Launch ─────────────────────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Yellow Jump Pad on the ground
    pads.push(createPad(startX + BLOCK_SIZE * 3, gy, 'yellow'));

    // Triple spike hazard on floor under the arc
    hazards.push(createSpike(startX + BLOCK_SIZE * 5, gy, 'trojan'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 6, gy, 'trojan'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 7, gy, 'trojan'));
    packets.push(createPacket(startX + BLOCK_SIZE * 5.5, gy - BLOCK_SIZE * 3.2));

    // Pad launches cleanly over the 3 spikes, lands on floor at 9
    // Elevated cache platform at 11 (height 1 block, width 4)
    blocks.push(createBlock(startX + BLOCK_SIZE * 11, gy - BLOCK_SIZE, BLOCK_SIZE * 4, BLOCK_SIZE, 'CACHE_01'));
    packets.push(createPacket(startX + BLOCK_SIZE * 12.5, gy - BLOCK_SIZE * 2.0));

    return { length: BLOCK_SIZE * 18, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 4. PHASE 2: SHIP MODE PORTAL & ROCKET CAVERN ───────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Vault into mid-air with yellow jump pad
    pads.push(createPad(startX + BLOCK_SIZE * 3, gy, 'yellow'));

    // Magenta Ship Portal in mid-air at apex
    portals.push(createPortal(startX + BLOCK_SIZE * 6, gy - BLOCK_SIZE * 2.0, 'mode_ship'));

    // 12 blocks of clear open cavern! Zero spikes on floor or ceiling!
    packets.push(createPacket(startX + BLOCK_SIZE * 9, gy - BLOCK_SIZE * 2.8));
    packets.push(createPacket(startX + BLOCK_SIZE * 12, gy - BLOCK_SIZE * 2.8));
    packets.push(createPacket(startX + BLOCK_SIZE * 15, gy - BLOCK_SIZE * 2.8));

    // Low obstacle: gentle 1.2-block server pillar (plenty of flight headroom)
    blocks.push(createBlock(startX + BLOCK_SIZE * 18, gy - BLOCK_SIZE * 1.2, BLOCK_SIZE * 2.5, BLOCK_SIZE * 1.2, 'NET_PILLAR'));
    packets.push(createPacket(startX + BLOCK_SIZE * 19.2, gy - BLOCK_SIZE * 2.8));

    // High obstacle: gentle ceiling conduit (plenty of floor clearance)
    blocks.push(createBlock(startX + BLOCK_SIZE * 25, cy, BLOCK_SIZE * 2.5, BLOCK_SIZE * 1.2, 'TOP_PIPE'));
    packets.push(createPacket(startX + BLOCK_SIZE * 26.2, gy - BLOCK_SIZE * 2.0));

    // Floating sawblade (mid route choice)
    hazards.push(createSaw(startX + BLOCK_SIZE * 32, gy - BLOCK_SIZE * 2.7, 24));
    packets.push(createPacket(startX + BLOCK_SIZE * 32, gy - BLOCK_SIZE * 4.2));
    packets.push(createPacket(startX + BLOCK_SIZE * 32, gy - BLOCK_SIZE * 1.4));

    // Exit portal back to Cube
    portals.push(createPortal(startX + BLOCK_SIZE * 38, gy - BLOCK_SIZE * 2.0, 'mode_cube'));

    return { length: BLOCK_SIZE * 42, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 5. GREEN DASH ORB CHASM ─────────────────────────────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Safe entry runway from 0 to 3
    // Green Dash Orb in mid-air at 3.5: Jump & hold to streak straight across the chasm!
    orbs.push(createOrb(startX + BLOCK_SIZE * 3.5, gy - BLOCK_SIZE * 2.0, 'dash_green'));

    // Chasm of 4 spikes on the floor under the laser dash (from 4.5 to 7.5)
    for (let i = 4.5; i <= 7.5; i += 1.0) {
      hazards.push(createSpike(startX + BLOCK_SIZE * i, gy, 'trojan'));
    }

    // Floating data packets along the laser beam
    packets.push(createPacket(startX + BLOCK_SIZE * 5.0, gy - BLOCK_SIZE * 2.0));
    packets.push(createPacket(startX + BLOCK_SIZE * 7.0, gy - BLOCK_SIZE * 2.0));

    // Safe open runway on floor from 8.5 onwards
    // Cache platform at 11 with plenty of run-up and landing space
    blocks.push(createBlock(startX + BLOCK_SIZE * 11, gy - BLOCK_SIZE, BLOCK_SIZE * 4, BLOCK_SIZE, 'DASH_CACHE'));
    packets.push(createPacket(startX + BLOCK_SIZE * 12.5, gy - BLOCK_SIZE * 2.2));

    return { length: BLOCK_SIZE * 18, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 6. PHASE 3: SPEED GATE (2X OVERDRIVE) & ORB CHAIN ──────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // 2x Speed Gate
    portals.push(createPortal(startX + BLOCK_SIZE * 2, gy, 'speed_2x'));

    // Yellow orb over single spike
    hazards.push(createSpike(startX + BLOCK_SIZE * 5, gy, 'firewall'));
    orbs.push(createOrb(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 2.2, 'yellow'));
    packets.push(createPacket(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 3.2));

    // Pink orb over single spike
    hazards.push(createSpike(startX + BLOCK_SIZE * 9, gy, 'trojan'));
    orbs.push(createOrb(startX + BLOCK_SIZE * 9, gy - BLOCK_SIZE * 2.0, 'pink'));
    packets.push(createPacket(startX + BLOCK_SIZE * 9, gy - BLOCK_SIZE * 3.0));

    // Elevated landing hub
    blocks.push(createBlock(startX + BLOCK_SIZE * 12, gy - BLOCK_SIZE, BLOCK_SIZE * 4, BLOCK_SIZE, 'SPEED_HUB'));

    return { length: BLOCK_SIZE * 18, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 7. PHASE 4: THE WAVE (DART ZIG-ZAG CORRIDOR) ────────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    portals.push(createPortal(startX + BLOCK_SIZE * 2, gy, 'mode_wave'));

    // Wave Zigzag corridor:
    blocks.push(createBlock(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 1.5, BLOCK_SIZE * 3, BLOCK_SIZE * 1.5, 'WAVE_BOT_1'));
    packets.push(createPacket(startX + BLOCK_SIZE * 7, gy - BLOCK_SIZE * 3.0));

    blocks.push(createBlock(startX + BLOCK_SIZE * 9, cy, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'WAVE_TOP_1'));
    packets.push(createPacket(startX + BLOCK_SIZE * 11, gy - BLOCK_SIZE * 1.8));

    blocks.push(createBlock(startX + BLOCK_SIZE * 13, gy - BLOCK_SIZE * 1.5, BLOCK_SIZE * 3, BLOCK_SIZE * 1.5, 'WAVE_BOT_2'));
    packets.push(createPacket(startX + BLOCK_SIZE * 15, gy - BLOCK_SIZE * 3.0));

    // Exit portal
    portals.push(createPortal(startX + BLOCK_SIZE * 18, gy, 'mode_cube'));
    portals.push(createPortal(startX + BLOCK_SIZE * 18, gy, 'speed_1x'));

    return { length: BLOCK_SIZE * 22, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 8. PHASE 5: QUANTUM GRAVITY INVERSION TUNNEL ───────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Blue Gravity Portal (flips to ceiling)
    portals.push(createPortal(startX + BLOCK_SIZE * 2, gy, 'gravity_flip'));

    // Ceiling runway from 2 to 6
    // Ceiling block
    blocks.push(createBlock(startX + BLOCK_SIZE * 6, cy, BLOCK_SIZE * 3, BLOCK_SIZE, 'CEIL_CORE'));
    packets.push(createPacket(startX + BLOCK_SIZE * 7.5, cy + BLOCK_SIZE * 1.8));

    // Blue Orb flips back to floor
    orbs.push(createOrb(startX + BLOCK_SIZE * 11, cy + BLOCK_SIZE * 2.2, 'blue'));

    // Orange portal restoring normal floor gravity
    portals.push(createPortal(startX + BLOCK_SIZE * 14, gy, 'gravity_normal'));

    return { length: BLOCK_SIZE * 18, hazards, blocks, pads, orbs, packets, portals };
  }
];

export class LevelManager {
  constructor(CANVAS_W, GROUND_Y, CEILING_Y) {
    this.canvasW = CANVAS_W;
    this.groundY = GROUND_Y;
    this.ceilingY = CEILING_Y;
    this.nextSpawnX = CANVAS_W + 50;
    this.patternIndex = 0;
    this.totalSpawnedDistance = 0;
  }

  reset(CANVAS_W, GROUND_Y, CEILING_Y) {
    this.canvasW = CANVAS_W;
    this.groundY = GROUND_Y;
    this.ceilingY = CEILING_Y;
    this.nextSpawnX = CANVAS_W + 50;
    this.patternIndex = 0;
    this.totalSpawnedDistance = 0;
  }

  scroll(shift) {
    this.nextSpawnX -= shift;
  }

  spawnNextChunks(hazards, blocks, pads, orbs, packets, portals) {
    while (this.nextSpawnX < this.canvasW + 1200) {
      const patternFn = PATTERNS[this.patternIndex % PATTERNS.length];
      const chunk = patternFn(this.nextSpawnX, this.groundY, this.ceilingY);

      if (chunk.hazards) hazards.push(...chunk.hazards);
      if (chunk.blocks) blocks.push(...chunk.blocks);
      if (chunk.pads) pads.push(...chunk.pads);
      if (chunk.orbs) orbs.push(...chunk.orbs);
      if (chunk.packets) packets.push(...chunk.packets);
      if (chunk.portals) portals.push(...chunk.portals);

      this.nextSpawnX += chunk.length;
      this.totalSpawnedDistance += chunk.length;
      this.patternIndex++;
    }
  }
}
