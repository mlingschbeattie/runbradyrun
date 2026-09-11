// ============================================================
// leaderboard.js — Persistent Student Leaderboard & Identity Engine
// Seamlessly integrates with beattietech.local student sessions,
// dual-tier persistence (Supabase + localStorage), and rank algorithms.
// ============================================================

const STORAGE_PROFILE_KEY = 'runbradyrun_student_profile';
const STORAGE_LEADERBOARD_KEY = 'runbradyrun_leaderboard_v1';

// Seed Operatives for initial leaderboard engagement
const DEFAULT_LEADERBOARD = [
  {
    id: 'seed_1',
    studentName: 'Admin_Zero',
    score: 420,
    percent: 100,
    attempts: 1,
    character: 'Admin',
    completed: true,
    badge: 'S-RANK',
    timestamp: Date.now() - 86400000 * 3
  },
  {
    id: 'seed_2',
    studentName: 'Packet_Ninja',
    score: 380,
    percent: 100,
    attempts: 3,
    character: 'Specialist',
    completed: true,
    badge: 'A-RANK',
    timestamp: Date.now() - 86400000 * 2
  },
  {
    id: 'seed_3',
    studentName: 'Cipher_Ghost',
    score: 310,
    percent: 88,
    attempts: 5,
    character: 'Admin',
    completed: false,
    badge: 'STAGE 5',
    timestamp: Date.now() - 86400000
  },
  {
    id: 'seed_4',
    studentName: 'ByteMaster_10',
    score: 250,
    percent: 74,
    attempts: 7,
    character: 'Specialist',
    completed: false,
    badge: 'STAGE 4',
    timestamp: Date.now() - 3600000 * 8
  },
  {
    id: 'seed_5',
    studentName: 'Subnet_Surfer',
    score: 180,
    percent: 52,
    attempts: 4,
    character: 'Admin',
    completed: false,
    badge: 'STAGE 3',
    timestamp: Date.now() - 3600000 * 2
  }
];

// Current resolved student name
let currentStudentName = 'Student_Operative';

/**
 * Resolves student identity from beattietech.local query params,
 * iframe postMessage events, or persisted local storage.
 */
export function initStudentIdentity() {
  // 1. Check URL parameters (e.g. ?student=Brady or ?user=Tommy)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get('student') || params.get('user') || params.get('callsign') || params.get('name');
    if (urlUser && urlUser.trim()) {
      currentStudentName = sanitizeName(urlUser);
      localStorage.setItem(STORAGE_PROFILE_KEY, currentStudentName);
      return currentStudentName;
    }
  } catch (err) {
    console.warn('URL params check failed:', err);
  }

  // 2. Check localStorage
  const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
  if (saved && saved.trim()) {
    currentStudentName = sanitizeName(saved);
    return currentStudentName;
  }

  // 3. Fallback default callsign
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  currentStudentName = `Operative_${randomSuffix}`;
  localStorage.setItem(STORAGE_PROFILE_KEY, currentStudentName);

  // 4. Listen for postMessage handshakes if embedded on beattietech.local
  window.addEventListener('message', (e) => {
    if (e.data && (e.data.student || e.data.username || e.data.user)) {
      const incoming = e.data.student || e.data.username || e.data.user;
      setStudentName(incoming);
    }
  });

  return currentStudentName;
}

function sanitizeName(str) {
  return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 18) || 'Operative';
}

export function getStudentName() {
  return currentStudentName;
}

export function setStudentName(name) {
  const clean = sanitizeName(name);
  if (clean) {
    currentStudentName = clean;
    localStorage.setItem(STORAGE_PROFILE_KEY, clean);
  }
  return currentStudentName;
}

/**
 * Calculates thematic cybersecurity clearance badge based on performance
 */
export function calculateRankBadge(attempts, completed, percent) {
  if (completed) {
    if (attempts <= 2) return 'S-RANK'; // Zero-Day Phantom
    if (attempts <= 5) return 'A-RANK'; // Cyber Specialist
    if (attempts <= 9) return 'B-RANK'; // Penetration Tester
    return 'C-RANK';                    // Script Operative
  }
  if (percent >= 80) return 'STAGE 5';
  if (percent >= 60) return 'STAGE 4';
  if (percent >= 40) return 'STAGE 3';
  if (percent >= 20) return 'STAGE 2';
  return 'STAGE 1';
}

/**
 * Retrieves the sorted leaderboard records
 */
export function getLeaderboard() {
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_LEADERBOARD_KEY);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse local leaderboard:', err);
  }

  if (!Array.isArray(list) || list.length === 0) {
    list = [...DEFAULT_LEADERBOARD];
    saveLocalLeaderboard(list);
  }

  return sortLeaderboard(list);
}

function saveLocalLeaderboard(list) {
  try {
    localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to write local leaderboard:', err);
  }
}

function sortLeaderboard(list) {
  return [...list].sort((a, b) => {
    // 1. Completion status (100% wins prioritized)
    if (a.completed !== b.completed) {
      return a.completed ? -1 : 1;
    }
    // 2. Highest percentage reached
    if (b.percent !== a.percent) {
      return b.percent - a.percent;
    }
    // 3. Highest packet score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // 4. Lowest attempts
    return a.attempts - b.attempts;
  });
}

/**
 * Submits a completed or crashed run score.
 * Updates local persistence immediately and syncs with Supabase if available.
 */
export async function submitRunScore({ score, percent, attempts, character, completed }) {
  const badge = calculateRankBadge(attempts, completed, percent);
  const entry = {
    id: `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    studentName: getStudentName(),
    score: Math.max(0, Math.floor(score)),
    percent: Math.min(100, Math.max(0, Math.floor(percent))),
    attempts: Math.max(1, Math.floor(attempts)),
    character: character || 'Admin',
    completed: !!completed,
    badge,
    timestamp: Date.now()
  };

  // 1. Update local storage
  let currentList = getLeaderboard();
  currentList.push(entry);
  const sorted = sortLeaderboard(currentList).slice(0, 30); // Keep top 30
  saveLocalLeaderboard(sorted);

  // Determine user rank in sorted leaderboard
  const rankIndex = sorted.findIndex(r => r.id === entry.id);
  const finalRank = rankIndex >= 0 ? rankIndex + 1 : null;

  // 2. Async Cloud / Supabase / beattietech.local sync
  syncWithCloud(entry).catch(() => {});

  return { entry, rank: finalRank };
}

async function syncWithCloud(entry) {
  // Optional integration if Supabase or central API is active
  try {
    const SUPABASE_URL = 'https://kvrmqkidkyupoczvprep.supabase.co';
    // Check if anon key or custom portal token is present
    if (typeof window !== 'undefined' && window.__BEATTIE_API_KEY__) {
      await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: window.__BEATTIE_API_KEY__,
          Authorization: `Bearer ${window.__BEATTIE_API_KEY__}`
        },
        body: JSON.stringify(entry)
      });
    }
  } catch (e) {
    // Silent failover to local storage
  }
}
