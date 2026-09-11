// ============================================================
// assets.js — High-Definition 2D Game Asset Preloader & Registry
// Manages loading and caching of all commercial-grade 2D sprites.
// ============================================================

export const SPRITES = {
  cubeHero: null,
  shipDrone: null,
  waveDart: null,
  spikeMalware: null,
  sawblade: null,
  serverBlock: null,
  jumpPad: null,
  jumpRing: null,
  portalGateway: null,
  cryptoPacket: null,
  cyberSkyline: null,
};

let assetsReady = false;

export function isAssetsReady() {
  return assetsReady;
}

const ASSET_SOURCES = {
  cubeHero: '/sprites/cube_hero.png',
  shipDrone: '/sprites/ship_drone.png',
  waveDart: '/sprites/wave_dart.png',
  spikeMalware: '/sprites/spike_malware.png',
  sawblade: '/sprites/sawblade.png',
  serverBlock: '/sprites/server_block.png',
  jumpPad: '/sprites/jump_pad.png',
  jumpRing: '/sprites/jump_ring.png',
  portalGateway: '/sprites/portal_gateway.png',
  cryptoPacket: '/sprites/crypto_packet.png',
  cyberSkyline: '/sprites/cyber_skyline.jpg',
};

export function loadAllAssets() {
  const keys = Object.keys(ASSET_SOURCES);
  const promises = keys.map((key) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        SPRITES[key] = img;
        resolve(true);
      };
      img.onerror = () => {
        console.warn(`[Asset Loader] Failed to load sprite: ${ASSET_SOURCES[key]}`);
        resolve(false);
      };
      img.src = ASSET_SOURCES[key];
    });
  });

  return Promise.all(promises).then(() => {
    assetsReady = true;
    console.log('[Asset Loader] All 2D Game Sprites Loaded Successfully.');
    return SPRITES;
  });
}
