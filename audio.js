// ============================================================
// audio.js — Studio-Grade Cyberpunk EDM & SFX Audio Engine
// Real electronic dance tracks, pre-decoded zero-latency SFX,
// Web Audio AnalyserNode spectrum analysis, and dynamic ducking.
// ============================================================

let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let bgmGain = null;
let bgmSource = null;
let bgmAudio = null;
let analyserNode = null;
let freqDataArray = null;

let isMuted = false;
let isPlayingMusic = false;
let onBeatCallback = null;
let beatInterval = null;

// Available Cyberpunk EDM Soundtracks
export const TRACKS = {
  cyberInfil: {
    id: 'cyberInfil',
    name: 'Cyber Celeste // Infiltration',
    artist: 'GLORYTOTHEMACHINE',
    bpm: 128,
    src: '/audio/bgm_cyber_infil.mp3'
  },
  vengeance: {
    id: 'vengeance',
    name: 'Vengeance Electro',
    artist: 'Of Far Different Nature',
    bpm: 130,
    src: '/audio/bgm_vengeance.ogg'
  },
  synthwave: {
    id: 'synthwave',
    name: 'Synthwave House',
    artist: 'Fupi',
    bpm: 120,
    src: '/audio/bgm_synthwave.ogg'
  }
};

let currentTrackKey = 'cyberInfil';

// Pre-decoded Audio Buffers Cache for 0ms Latency SFX
const SFX_FILES = {
  jump: '/audio/sfx/jump.ogg',
  pad: '/audio/sfx/pad.ogg',
  orb: '/audio/sfx/orb.ogg',
  dash: '/audio/sfx/dash.ogg',
  portal: '/audio/sfx/portal.ogg',
  crash: '/audio/sfx/crash.ogg',
  shield: '/audio/sfx/shield.ogg',
  packet: '/audio/sfx/packet.ogg',
  quizPass: '/audio/sfx/quiz_pass.ogg',
  quizFail: '/audio/sfx/quiz_fail.ogg',
};

const sfxBuffers = {};
let sfxLoadingPromise = null;

/**
 * Initializes and unlocks the Web Audio Context
 */
export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();

      // Master dynamics compressor (prevents clipping, adds punchy EDM loudness)
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, audioCtx.currentTime);
      compressor.knee.setValueAtTime(18, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(6, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.18, audioCtx.currentTime);
      compressor.connect(audioCtx.destination);

      // Master Gain
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : 1.0, audioCtx.currentTime);
      masterGain.connect(compressor);

      // Dedicated SFX bus
      sfxGain = audioCtx.createGain();
      sfxGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
      sfxGain.connect(masterGain);

      // Music Gain & Analyser
      bgmGain = audioCtx.createGain();
      bgmGain.gain.setValueAtTime(0.70, audioCtx.currentTime);

      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64; // 32 frequency bins
      analyserNode.smoothingTimeConstant = 0.8;
      freqDataArray = new Uint8Array(analyserNode.frequencyBinCount);

      bgmGain.connect(analyserNode);
      analyserNode.connect(masterGain);

      // Preload all SFX buffers
      preloadAllSFX();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Pre-decodes all sound effects into memory for true 0-latency playback
 */
export function preloadAllSFX() {
  if (sfxLoadingPromise) return sfxLoadingPromise;
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve();

  const keys = Object.keys(SFX_FILES);
  const promises = keys.map(key => {
    return fetch(SFX_FILES[key])
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(ab => ctx.decodeAudioData(ab))
      .then(decodedBuffer => {
        sfxBuffers[key] = decodedBuffer;
      })
      .catch(err => {
        console.warn(`[Audio] Failed to preload SFX ${key}:`, err);
      });
  });

  sfxLoadingPromise = Promise.all(promises);
  return sfxLoadingPromise;
}

/**
 * Plays a pre-decoded audio buffer with optional volume and micro-pitch jitter
 */
function playDecodedBuffer(bufferKey, volume = 1.0, pitchVariation = 0.04) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const buffer = sfxBuffers[bufferKey];
  if (buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Organic micro-pitch jitter prevents repetitive sounds from sounding stale
    if (pitchVariation > 0) {
      source.playbackRate.value = 1.0 + (Math.random() * 2 - 1) * pitchVariation;
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gain);
    gain.connect(sfxGain);

    source.start(0);
    return;
  }

  // Polished procedural fallback if buffer still decoding
  playProceduralFallback(bufferKey);
}

/**
 * Modern polished procedural fallback (warm sines & noise clicks, NEVER doot-doot square waves)
 */
function playProceduralFallback(type) {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;

  if (type === 'jump') {
    // Warm filtered chirp
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'pad') {
    // Deep launch kick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'crash') {
    // Sub bass drop + noise
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.35);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

// ── Master Audio API Controls ─────────────────────────────────

export function toggleMute() {
  isMuted = !isMuted;
  const ctx = getAudioContext();
  if (masterGain && ctx) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(isMuted ? 0 : 1.0, ctx.currentTime);
  }
  if (bgmAudio) {
    bgmAudio.muted = isMuted;
  }
  return isMuted;
}

export function getMuted() {
  return isMuted;
}

export function setOnBeatCallback(cb) {
  onBeatCallback = cb;
}

/**
 * Returns real-time frequency analysis data from the active music track
 */
export function getAudioFrequencies() {
  if (!analyserNode || isMuted || !isPlayingMusic) return null;
  analyserNode.getByteFrequencyData(freqDataArray);
  return freqDataArray;
}

export function getCurrentTrackName() {
  return TRACKS[currentTrackKey]?.name || 'Cyber Infiltration';
}

export function switchMusicTrack(trackKey) {
  if (!TRACKS[trackKey]) return;
  currentTrackKey = trackKey;
  if (isPlayingMusic) {
    startBackgroundMusic(true);
  }
}

// ── High-Quality Sound Effects Triggers ────────────────────────

export function playJumpSound() {
  playDecodedBuffer('jump', 0.75, 0.05);
}

export function playPadSound() {
  playDecodedBuffer('pad', 0.95, 0.03);
}

export function playOrbSound() {
  playDecodedBuffer('orb', 0.85, 0.04);
}

export function playDashSound() {
  playDecodedBuffer('dash', 0.90, 0.02);
}

export function playPortalSound() {
  playDecodedBuffer('portal', 0.80, 0.03);
}

export function playGravitySound() {
  playDecodedBuffer('portal', 0.80, 0.04);
}

export function playCrashSound() {
  playDecodedBuffer('crash', 1.0, 0.02);
  pauseBackgroundMusic(true);
}

export function playShieldSound() {
  playDecodedBuffer('shield', 0.90, 0.04);
}

export function playPacketSound() {
  playDecodedBuffer('packet', 0.85, 0.06);
}

export function playQuizSuccessSound() {
  playDecodedBuffer('quizPass', 0.90, 0.0);
}

export function playQuizFailSound() {
  playDecodedBuffer('quizFail', 0.90, 0.0);
}

export function playVictorySound() {
  // Play quizPass high bell buffer
  playDecodedBuffer('quizPass', 1.0, 0.0);

  // Layer celebratory cyber arpeggio
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.09);
    gain.gain.setValueAtTime(0.001, now + idx * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.35, now + idx * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now + idx * 0.09);
    osc.stop(now + idx * 0.09 + 0.5);
  });
}

// ── High-Octane Background Music Engine ───────────────────────

export function startBackgroundMusic(forceRestart = false) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const track = TRACKS[currentTrackKey] || TRACKS.cyberInfil;

  if (!bgmAudio) {
    bgmAudio = new Audio();
    bgmAudio.crossOrigin = 'anonymous';
    bgmAudio.loop = true;

    try {
      bgmSource = ctx.createMediaElementSource(bgmAudio);
      bgmSource.connect(bgmGain);
    } catch (e) {
      console.warn('[Audio] MediaElementSource creation notice:', e);
    }
  }

  // Set or update track source
  if (bgmAudio.src !== window.location.origin + track.src && !bgmAudio.src.endsWith(track.src)) {
    bgmAudio.src = track.src;
    bgmAudio.load();
    forceRestart = true;
  }

  if (forceRestart) {
    bgmAudio.currentTime = 0;
  }

  if (bgmGain) {
    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.setValueAtTime(0.70, ctx.currentTime);
  }

  bgmAudio.muted = isMuted;

  const playPromise = bgmAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isPlayingMusic = true;
        startBeatSynchronizer(track.bpm);
      })
      .catch(err => {
        // Autoplay may be deferred until first user click/touch
        console.log('[Audio] Music waiting for user gesture:', err.message);
      });
  }
}

export function resumeBackgroundMusic() {
  if (!bgmAudio) {
    startBackgroundMusic(false);
    return;
  }
  const ctx = getAudioContext();
  if (bgmGain && ctx) {
    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.setValueAtTime(0.70, ctx.currentTime);
  }
  bgmAudio.play().then(() => {
    isPlayingMusic = true;
  }).catch(() => {});
}

export function pauseBackgroundMusic(duck = false) {
  if (!bgmAudio) return;
  const ctx = getAudioContext();

  if (duck && bgmGain && ctx) {
    // Quick duck rather than abrupt cut
    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, ctx.currentTime);
    bgmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    setTimeout(() => {
      if (bgmAudio) bgmAudio.pause();
      isPlayingMusic = false;
    }, 160);
  } else {
    bgmAudio.pause();
    isPlayingMusic = false;
  }

  if (beatInterval) {
    clearInterval(beatInterval);
    beatInterval = null;
  }
}

export function stopBackgroundMusic() {
  pauseBackgroundMusic(false);
  if (bgmAudio) {
    bgmAudio.currentTime = 0;
  }
}

/**
 * Synchronizes beat pulses with the track BPM for rhythmic camera and visualizer pumps
 */
function startBeatSynchronizer(bpm = 128) {
  if (beatInterval) clearInterval(beatInterval);
  const msPerBeat = (60 / bpm) * 1000;

  beatInterval = setInterval(() => {
    if (!isPlayingMusic || isMuted) return;
    if (onBeatCallback) {
      try {
        onBeatCallback();
      } catch (_) {}
    }
  }, msPerBeat);
}
