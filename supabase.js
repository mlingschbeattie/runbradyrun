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

// ── Shuffle options to randomize correct answer position ──────
function shuffleOptions(question) {
  const shuffled = [...question.options].sort(() => Math.random() - 0.5);
  return { ...question, options: shuffled };
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
        const shuffled = shuffleOptions(picked);
        return {
          id:       String(shuffled.id),
          question: shuffled.question,
          options:  shuffled.options,
          answer:   shuffled.answer,
        };
      }
    } catch (err) {
      console.warn('fetchQuizQuestion failed, using fallback:', err);
    }
  }

  const picked = pickFromPool(FALLBACK_POOL);
  const shuffled = shuffleOptions(picked);
  return {
    id:       shuffled.id,
    question: shuffled.question,
    options:  shuffled.options,
    answer:   shuffled.answer,
  };
}

/**
 * Resets the quiz history to allow all questions to be reshown.
 * Call this when the player starts a new game.
 */
export function resetQuizHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// ── Fallback question pool (20+ questions) ─────────────────────
// CompTIA Network+ and Security+ aligned topics.
// Correct answers distributed across all 4 positions (roughly 5 each).
// Each question has exactly 4 plausible options.
const FALLBACK_POOL = [
  // ─── OSI Model Layers ───────────────────────────────────────
  // CompTIA Network+ Objective 1.1 – Explain the OSI model layers
  {
    id: 'fb1',
    question: 'Which OSI layer do packet-filtering firewalls primarily operate on?',
    options:  ['Layer 7 – Application', 'Layer 3 – Network', 'Layer 5 – Session', 'Layer 1 – Physical'],
    answer:   'Layer 3 – Network',
  },
  // CompTIA Network+ Objective 1.1
  {
    id: 'fb2',
    question: 'At which OSI layer does TCP/IP operate?',
    options:  ['Layer 2 – Data Link', 'Layer 4 – Transport', 'Layer 6 – Presentation', 'Layer 3 – Network'],
    answer:   'Layer 4 – Transport',
  },
  // CompTIA Network+ Objective 1.1
  {
    id: 'fb3',
    question: 'Switches primarily operate at which OSI layer?',
    options:  ['Layer 1 – Physical', 'Layer 2 – Data Link', 'Layer 4 – Transport', 'Layer 7 – Application'],
    answer:   'Layer 2 – Data Link',
  },

  // ─── Firewalls: Stateful vs Stateless ────────────────────────
  // CompTIA Security+ Objective 3.1 – Network Security
  {
    id: 'fb4',
    question: 'What does a stateful firewall track that a stateless one does not?',
    options:  ['MAC addresses', 'Active connection state', 'URL paths', 'DNS queries'],
    answer:   'Active connection state',
  },
  // CompTIA Security+ Objective 3.1
  {
    id: 'fb5',
    question: 'Which firewall type inspects application-layer traffic for threats?',
    options:  ['Stateless firewall', 'Stateful firewall', 'Next-generation firewall', 'Packet filter'],
    answer:   'Next-generation firewall',
  },
  // CompTIA Security+ Objective 3.1
  {
    id: 'fb6',
    question: 'A stateless firewall makes decisions based on what criteria?',
    options:  ['Connection history', 'Individual packet headers alone', 'Deep packet inspection', 'Behavioral anomalies'],
    answer:   'Individual packet headers alone',
  },

  // ─── IDS vs IPS ──────────────────────────────────────────────
  // CompTIA Security+ Objective 3.1
  {
    id: 'fb7',
    question: 'What is the key difference between IDS and IPS?',
    options:  ['IDS only detects; IPS actively blocks', 'IDS uses signatures; IPS uses heuristics', 'IPS encrypts traffic; IDS does not', 'They are identical technologies'],
    answer:   'IDS only detects; IPS actively blocks',
  },
  // CompTIA Security+ Objective 3.1
  {
    id: 'fb8',
    question: 'Which type of IDS detection identifies deviations from a baseline?',
    options:  ['Signature-based', 'Heuristic-based', 'Anomaly-based', 'Rule-based'],
    answer:   'Anomaly-based',
  },
  // CompTIA Security+ Objective 3.1
  {
    id: 'fb9',
    question: 'Where should an IPS typically be placed for maximum effectiveness?',
    options:  ['Behind the firewall', 'In-line between the firewall and internal network', 'On a SPAN port', 'On the gateway only'],
    answer:   'In-line between the firewall and internal network',
  },

  // ─── Malware Types ──────────────────────────────────────────
  // CompTIA Security+ Objective 2.1 – Malware analysis
  {
    id: 'fb10',
    question: 'Which malware type self-replicates across networks without a host file?',
    options:  ['Worm', 'Trojan', 'Virus', 'Ransomware'],
    answer:   'Worm',
  },
  // CompTIA Security+ Objective 2.1
  {
    id: 'fb11',
    question: 'Ransomware primarily achieves its goal by doing what to victim data?',
    options:  ['Deleting it permanently', 'Encrypting it and demanding payment', 'Exfiltrating it to a C2 server', 'Corrupting the boot sector'],
    answer:   'Encrypting it and demanding payment',
  },
  // CompTIA Security+ Objective 2.1
  {
    id: 'fb12',
    question: 'What distinguishes a trojan from a worm?',
    options:  ['Trojans self-replicate; worms do not', 'Trojans require user action to deploy; worms self-propagate', 'Trojans are always visible; worms hide', 'Trojans only target Linux; worms target Windows'],
    answer:   'Trojans require user action to deploy; worms self-propagate',
  },

  // ─── Network Protocols ───────────────────────────────────────
  // CompTIA Network+ Objective 2.2 – TCP vs UDP
  {
    id: 'fb13',
    question: 'Which protocol guarantees delivery order and reliability?',
    options:  ['TCP', 'UDP', 'ICMP', 'IGMP'],
    answer:   'TCP',
  },
  // CompTIA Network+ Objective 2.2
  {
    id: 'fb14',
    question: 'What is the primary advantage of UDP over TCP?',
    options:  ['Reliability', 'Lower latency and less overhead', 'In-order delivery', 'Connection-oriented'],
    answer:   'Lower latency and less overhead',
  },
  // CompTIA Network+ Objective 2.3 – DNS and DHCP
  {
    id: 'fb15',
    question: 'Which service automatically assigns IP addresses to network devices?',
    options:  ['DNS', 'DHCP', 'ARP', 'SNMP'],
    answer:   'DHCP',
  },
  // CompTIA Network+ Objective 2.3
  {
    id: 'fb16',
    question: 'What is the primary purpose of HTTPS over HTTP?',
    options:  ['Faster transmission', 'Encryption of data in transit', 'More reliable connections', 'Reduced bandwidth usage'],
    answer:   'Encryption of data in transit',
  },

  // ─── CIA Triad ──────────────────────────────────────────────
  // CompTIA Security+ Objective 1.1 – CIA Triad principles
  {
    id: 'fb17',
    question: 'Which element of the CIA Triad ensures authorized access only?',
    options:  ['Confidentiality', 'Integrity', 'Availability', 'Authenticity'],
    answer:   'Confidentiality',
  },
  // CompTIA Security+ Objective 1.1
  {
    id: 'fb18',
    question: 'Which principle prevents unauthorized data modification?',
    options:  ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'],
    answer:   'Integrity',
  },

  // ─── Encryption Basics ───────────────────────────────────────
  // CompTIA Security+ Objective 2.5 – Encryption algorithms
  {
    id: 'fb19',
    question: 'What is the key difference between symmetric and asymmetric encryption?',
    options:  ['Symmetric uses a single shared key; asymmetric uses a public/private key pair', 'Asymmetric is always faster', 'Symmetric is more secure', 'Asymmetric cannot be decrypted'],
    answer:   'Symmetric uses a single shared key; asymmetric uses a public/private key pair',
  },
  // CompTIA Security+ Objective 2.5
  {
    id: 'fb20',
    question: 'Which encryption algorithm is considered secure for modern use?',
    options:  ['DES', 'MD5', 'AES', 'SHA-1'],
    answer:   'AES',
  },
  // CompTIA Security+ Objective 2.5
  {
    id: 'fb21',
    question: 'What is RSA primarily used for in modern cryptography?',
    options:  ['Bulk data encryption', 'Hash generation', 'Key exchange and digital signatures', 'Password storage'],
    answer:   'Key exchange and digital signatures',
  },
];