// ============================================================
// supabase.js — Quiz fetcher with localStorage shuffle-bag
// ============================================================
// Tracks seen question IDs in localStorage so every question in
// the pool is shown before any repeats occur.
//
// Expected Supabase table: quiz_questions
//   id       : int  (primary key)
//   question : text
//   options  : jsonb  (string[])
//   answer   : text   (must match an element in options exactly)

const SUPABASE_URL      = 'https://kvrmqkidkyupoczvprep.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // ← replace with your project's anon key

const HISTORY_KEY = 'runbradyrun_quiz_history';

// ── Shuffle-bag picker ────────────────────────────────────────
function pickFromPool(questions) {
  const seenIds = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

  let available = questions.filter(q => !seenIds.includes(q.id));
  if (available.length === 0) {
    // Full cycle complete — reset history
    localStorage.setItem(HISTORY_KEY, '[]');
    available = questions;
  }

  const picked = available[Math.floor(Math.random() * available.length)];
  localStorage.setItem(HISTORY_KEY, JSON.stringify([...seenIds, picked.id]));
  return picked;
}

/**
 * Fetches a non-repeating quiz question.
 * Uses Supabase when the anon key is configured, falls back to
 * the local pool otherwise.
 * @returns {Promise<{ id: string, question: string, options: string[], answer: string }>}
 */
export async function fetchQuizQuestion() {
  if (SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE') {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/quiz_questions?select=*`,
        {
          headers: {
            apikey:        SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);

      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const picked = pickFromPool(rows);
        return {
          id:       String(picked.id),
          question: picked.question,
          options:  picked.options,
          answer:   picked.answer,
        };
      }
    } catch (err) {
      console.warn('fetchQuizQuestion failed, using fallback:', err);
    }
  }

  return pickFromPool(FALLBACK_POOL);
}

// ── Fallback question pool ────────────────────────────────────
// Each entry needs a stable string id for history tracking.
const FALLBACK_POOL = [
  {
    id: 'fb1',
    question: 'Which OSI layer do packet-filtering firewalls primarily operate on?',
    options:  ['Layer 1 – Physical', 'Layer 3 – Network', 'Layer 5 – Session', 'Layer 7 – Application'],
    answer:   'Layer 3 – Network',
  },
  {
    id: 'fb2',
    question: 'What is the key difference between IDS and IPS?',
    options:  ['IDS encrypts traffic; IPS does not', 'IDS only detects; IPS actively blocks', 'IPS uses signatures; IDS uses anomaly', 'They are identical technologies'],
    answer:   'IDS only detects; IPS actively blocks',
  },
  {
    id: 'fb3',
    question: 'Which malware type self-replicates across networks without a host file?',
    options:  ['Virus', 'Trojan', 'Worm', 'Ransomware'],
    answer:   'Worm',
  },
  {
    id: 'fb4',
    question: 'What does a stateful firewall track that a stateless one does not?',
    options:  ['MAC addresses', 'Active connection state', 'URL paths', 'DNS queries'],
    answer:   'Active connection state',
  },
  {
    id: 'fb5',
    question: 'Which type of IDS detection identifies deviations from a baseline?',
    options:  ['Signature-based', 'Heuristic-based', 'Anomaly-based', 'Rule-based'],
    answer:   'Anomaly-based',
  },
  {
    id: 'fb6',
    question: 'Ransomware primarily achieves its goal by doing what to victim data?',
    options:  ['Deleting it permanently', 'Encrypting it and demanding payment', 'Exfiltrating it to a C2 server', 'Corrupting the MBR'],
    answer:   'Encrypting it and demanding payment',
  },
];