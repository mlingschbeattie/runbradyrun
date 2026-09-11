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

export const LEVEL_GOAL_DISTANCE = 48000;

export const PATTERNS = [
  // ── 1. Cube: Triple Spike Progression & Elevated Ledge ───────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Single spike with overhead guide packet
    hazards.push(createSpike(startX + BLOCK_SIZE * 2, gy, 'malware'));
    packets.push(createPacket(startX + BLOCK_SIZE * 2, gy - BLOCK_SIZE * 2.2));

    // Double spike
    hazards.push(createSpike(startX + BLOCK_SIZE * 6, gy, 'trojan'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 7, gy, 'trojan'));
    packets.push(createPacket(startX + BLOCK_SIZE * 6.5, gy - BLOCK_SIZE * 2.3));

    // Telegraphed Yellow Jump Pad right before the firewall platform
    pads.push(createPad(startX + BLOCK_SIZE * 11, gy, 'yellow'));

    // Elevated platform FW_01: 5 blocks wide with packet trail
    blocks.push(createBlock(startX + BLOCK_SIZE * 13, gy - BLOCK_SIZE, BLOCK_SIZE * 5, BLOCK_SIZE, 'FW_01'));
    packets.push(createPacket(startX + BLOCK_SIZE * 14, gy - BLOCK_SIZE * 2.0));
    packets.push(createPacket(startX + BLOCK_SIZE * 15.5, gy - BLOCK_SIZE * 2.0));
    packets.push(createPacket(startX + BLOCK_SIZE * 17, gy - BLOCK_SIZE * 2.0));

    // Floor spikes beneath and trailing platform
    hazards.push(createSpike(startX + BLOCK_SIZE * 14.5, gy, 'firewall'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 19.5, gy, 'firewall'));

    return { length: BLOCK_SIZE * 21, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 2. Cube: Yellow Pad Launch onto Server Towers ────────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    pads.push(createPad(startX + BLOCK_SIZE * 2, gy, 'yellow'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 4, gy, 'firewall'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 5, gy, 'firewall'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 6, gy, 'firewall'));

    // Server platform tower
    blocks.push(createBlock(startX + BLOCK_SIZE * 8, gy - BLOCK_SIZE * 2, BLOCK_SIZE * 4, BLOCK_SIZE * 2, 'SRV_ALPHA'));
    packets.push(createPacket(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 3.8));
    packets.push(createPacket(startX + BLOCK_SIZE * 9, gy - BLOCK_SIZE * 3.0));
    packets.push(createPacket(startX + BLOCK_SIZE * 11, gy - BLOCK_SIZE * 3.0));

    // Clear landing strip after tower
    return { length: BLOCK_SIZE * 18, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 3. PHASE 2: SHIP MODE PORTAL & ROCKET CAVERN ───────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Real Geometry Dash Ship Entry:
    // 1. Launch pad on ground vaults the cube into mid-air
    pads.push(createPad(startX + BLOCK_SIZE * 3, gy, 'yellow'));
    packets.push(createPacket(startX + BLOCK_SIZE * 4.5, gy - BLOCK_SIZE * 2.0));

    // 2. Mid-air Magenta Ship Portal at apex of jump arc
    portals.push(createPortal(startX + BLOCK_SIZE * 6, gy - BLOCK_SIZE * 1.5, 'mode_ship'));

    // 3. Wide-open introductory flight corridor: NO spikes for 12 blocks!
    // Centered packet trail lets player feel thruster controls
    packets.push(createPacket(startX + BLOCK_SIZE * 9, gy - BLOCK_SIZE * 2.8));
    packets.push(createPacket(startX + BLOCK_SIZE * 12, gy - BLOCK_SIZE * 2.8));
    packets.push(createPacket(startX + BLOCK_SIZE * 15, gy - BLOCK_SIZE * 2.8));

    // 4. Obstacle 1: Low Server Pillar (thrust up to clear)
    blocks.push(createBlock(startX + BLOCK_SIZE * 18, gy - BLOCK_SIZE * 2, BLOCK_SIZE * 2.5, BLOCK_SIZE * 2, 'NET_PILLAR'));
    packets.push(createPacket(startX + BLOCK_SIZE * 19.2, gy - BLOCK_SIZE * 3.8));

    // 5. Obstacle 2: Hanging Ceiling Conduit (release to glide under)
    blocks.push(createBlock(startX + BLOCK_SIZE * 25, cy, BLOCK_SIZE * 2.5, BLOCK_SIZE * 2.2, 'TOP_PIPE'));
    packets.push(createPacket(startX + BLOCK_SIZE * 26.2, gy - BLOCK_SIZE * 1.6));

    // 6. Obstacle 3: Central Sawblade (choice of high or low route)
    hazards.push(createSaw(startX + BLOCK_SIZE * 32, gy - BLOCK_SIZE * 2.7, 26));
    packets.push(createPacket(startX + BLOCK_SIZE * 32, gy - BLOCK_SIZE * 4.2));
    packets.push(createPacket(startX + BLOCK_SIZE * 32, gy - BLOCK_SIZE * 1.4));

    // 7. Exit: Green Cube Portal in mid-air
    portals.push(createPortal(startX + BLOCK_SIZE * 38, gy - BLOCK_SIZE * 1.5, 'mode_cube'));

    return { length: BLOCK_SIZE * 42, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 4. GREEN DASH ORB SUPER-STREAK ──────────────────────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Safe entry runway for cube landing from 0 to 4
    // Green Dash Orb in mid-air: Hold jump to streak straight across!
    orbs.push(createOrb(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 2, 'dash_green'));

    // Giant chasm with 5 spikes on the floor under the dash
    for (let i = 6; i <= 10; i++) {
      hazards.push(createSpike(startX + BLOCK_SIZE * i, gy, 'trojan'));
    }

    packets.push(createPacket(startX + BLOCK_SIZE * 7, gy - BLOCK_SIZE * 2));
    packets.push(createPacket(startX + BLOCK_SIZE * 9, gy - BLOCK_SIZE * 2));

    // Landing block platform
    blocks.push(createBlock(startX + BLOCK_SIZE * 12, gy - BLOCK_SIZE, BLOCK_SIZE * 4, BLOCK_SIZE, 'DASH_END'));

    return { length: BLOCK_SIZE * 19, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 5. PHASE 3: SPEED GATE (2X OVERDRIVE) & ORB CHAIN ──────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // 2x Speed Gate!
    portals.push(createPortal(startX + BLOCK_SIZE * 2, gy, 'speed_2x'));

    // Sawblade hazard with yellow orb
    hazards.push(createSaw(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 0.8, 30));
    orbs.push(createOrb(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 2.5, 'yellow'));

    // Pink orb in rapid sequence
    hazards.push(createSpike(startX + BLOCK_SIZE * 9, gy, 'trojan'));
    hazards.push(createSpike(startX + BLOCK_SIZE * 10, gy, 'trojan'));
    orbs.push(createOrb(startX + BLOCK_SIZE * 9.5, gy - BLOCK_SIZE * 2.2, 'pink'));

    // Elevated landing
    blocks.push(createBlock(startX + BLOCK_SIZE * 13, gy - BLOCK_SIZE * 1.5, BLOCK_SIZE * 4, BLOCK_SIZE * 1.5, 'SPEED_HUB'));
    packets.push(createPacket(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 3.2));
    packets.push(createPacket(startX + BLOCK_SIZE * 9.5, gy - BLOCK_SIZE * 3.0));

    return { length: BLOCK_SIZE * 19, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 6. PHASE 4: THE WAVE (DART ZIG-ZAG CORRIDOR) ────────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Transform into The Wave! (Cyan Portal)
    portals.push(createPortal(startX + BLOCK_SIZE * 2, gy, 'mode_wave'));

    // High & Low corridor blocks designed for 45° zigzagging!
    // Zigzag up
    blocks.push(createBlock(startX + BLOCK_SIZE * 5, gy - BLOCK_SIZE * 1.5, BLOCK_SIZE * 3, BLOCK_SIZE * 1.5, 'WAVE_BOT_1'));
    packets.push(createPacket(startX + BLOCK_SIZE * 7, gy - BLOCK_SIZE * 3.2));

    // Zigzag down
    blocks.push(createBlock(startX + BLOCK_SIZE * 9, cy, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'WAVE_TOP_1'));
    hazards.push(createSaw(startX + BLOCK_SIZE * 11, gy - BLOCK_SIZE * 1.2, 26));

    // Zigzag up again
    blocks.push(createBlock(startX + BLOCK_SIZE * 14, gy - BLOCK_SIZE * 2, BLOCK_SIZE * 3, BLOCK_SIZE * 2, 'WAVE_BOT_2'));
    packets.push(createPacket(startX + BLOCK_SIZE * 15, gy - BLOCK_SIZE * 3.8));

    // Exit back to Cube mode
    portals.push(createPortal(startX + BLOCK_SIZE * 19, gy, 'mode_cube'));
    portals.push(createPortal(startX + BLOCK_SIZE * 19, gy, 'speed_1x'));

    return { length: BLOCK_SIZE * 23, hazards, blocks, pads, orbs, packets, portals };
  },

  // ── 7. PHASE 5: QUANTUM GRAVITY INVERSION TUNNEL ───────────
  (startX, gy, cy) => {
    const hazards = [];
    const blocks = [];
    const pads = [];
    const orbs = [];
    const packets = [];
    const portals = [];

    // Blue Gravity Portal (Inverts to ceiling!)
    portals.push(createPortal(startX + BLOCK_SIZE * 2, gy, 'gravity_flip'));

    // Ceiling spikes & blocks
    hazards.push(createSpike(startX + BLOCK_SIZE * 6, cy, 'malware', -1));
    blocks.push(createBlock(startX + BLOCK_SIZE * 9, cy, BLOCK_SIZE * 3, BLOCK_SIZE, 'CEIL_CORE'));

    // Mid-air Blue Orb on ceiling flips back down!
    orbs.push(createOrb(startX + BLOCK_SIZE * 13, cy + BLOCK_SIZE * 2.2, 'blue'));

    // Orange portal restoring normal floor gravity
    portals.push(createPortal(startX + BLOCK_SIZE * 16, cy + 90, 'gravity_normal'));

    return { length: BLOCK_SIZE * 19, hazards, blocks, pads, orbs, packets, portals };
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
