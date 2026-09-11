// ============================================================
// input.js — Keyboard and Pointer Input Wiring
// Buffer jumping (hold-to-jump), fast retry, quiz shortcuts, audio toggle
// ============================================================

import { quizOptionBounds, hudClickTargets } from './hud.js';

export function setupInput(canvas, handlers) {
  const {
    getState,
    onJumpPress,
    onJumpRelease,
    onQuizAnswer,
    onQuizTrigger,
    onRetry,
    onFeedbackAdvance,
    onMenuClick,
    onMuteToggle,
    onCycleTrack,
  } = handlers;

  // ── Keyboard Listeners ───────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Prevent default scrolling for game keys
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
      e.preventDefault();
    }

    const state = getState();

    // 1. Crash screen shortcuts
    if (state === 'crashed') {
      if (e.code === 'KeyQ') {
        onQuizTrigger();
        return;
      }
      if (e.code === 'KeyL') {
        onMenuClick('open_leaderboard');
        return;
      }
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        onRetry();
        return;
      }
    }

    // 1b. Victory screen shortcuts
    if (state === 'victory') {
      if (e.code === 'KeyL') {
        onMenuClick('open_leaderboard');
        return;
      }
      if (['Space', 'Enter'].includes(e.code)) {
        onRetry();
        return;
      }
      if (e.code === 'Escape') {
        onMenuClick('back_to_menu');
        return;
      }
    }

    // 1c. Leaderboard, Intel, and Character Select modal navigation
    if (state === 'leaderboard' || state === 'intel' || state === 'char_select') {
      if (['Escape', 'Space', 'Enter'].includes(e.code)) {
        onMenuClick('back_to_menu');
        return;
      }
      if (state === 'leaderboard' && e.code === 'KeyE') {
        onMenuClick('edit_callsign');
        return;
      }
    }

    // 1d. Main Menu hotkeys (I for Intel, C/O for Operators, L for Leaderboard, E for Edit Callsign)
    if (state === 'menu') {
      if (e.code === 'KeyI') {
        onMenuClick('open_intel');
        return;
      }
      if (e.code === 'KeyC' || e.code === 'KeyO') {
        onMenuClick('open_operators');
        return;
      }
      if (e.code === 'KeyL') {
        onMenuClick('open_leaderboard');
        return;
      }
      if (e.code === 'KeyE') {
        onMenuClick('edit_callsign');
        return;
      }
    }

    // 2. Feedback screen advance
    if (state === 'feedback') {
      if (['Space', 'Enter'].includes(e.code)) {
        onFeedbackAdvance();
      }
      return;
    }

    // 3. Quiz answer shortcuts (1, 2, 3, 4)
    if (state === 'quiz') {
      const choice = parseInt(e.key, 10) - 1;
      if (Number.isInteger(choice) && choice >= 0 && choice < 4) {
        onQuizAnswer(choice);
      }
      return;
    }

    // 4. Playing / Buffer jumping
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
      if (!e.repeat) {
        onJumpPress();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
      onJumpRelease();
    }
  });

  // ── Pointer / Mouse / Touch Listeners ────────────────────────
  function handlePointerDown(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const state = getState();

    // Check HUD click targets (Play, Operators, Intel, Mute, Retry, Quiz Revive, Char Select)
    for (const target of hudClickTargets) {
      if (mx >= target.x && mx <= target.x + target.w && my >= target.y && my <= target.y + target.h) {
        if (target.id === 'btn_play') {
          onJumpPress();
          return;
        }
        if (target.id === 'btn_operators') {
          onMenuClick('open_operators');
          return;
        }
        if (target.id === 'btn_intel') {
          onMenuClick('open_intel');
          return;
        }
        if (target.id === 'btn_close_intel' || target.id === 'btn_back_to_menu') {
          onMenuClick('back_to_menu');
          return;
        }
        if (target.id === 'mute_toggle') {
          onMuteToggle();
          return;
        }
        if (target.id === 'btn_cycle_track') {
          if (onCycleTrack) onCycleTrack();
          return;
        }
        if (target.id === 'btn_retry') {
          onRetry();
          return;
        }
        if (target.id === 'btn_quiz') {
          onQuizTrigger();
          return;
        }
        if (target.id === 'btn_leaderboard' || target.id === 'btn_view_leaderboard') {
          onMenuClick('open_leaderboard');
          return;
        }
        if (target.id === 'btn_edit_callsign') {
          onMenuClick('edit_callsign');
          return;
        }
        if (target.id && target.id.startsWith('select_char_')) {
          onMenuClick(target.key);
          return;
        }
      }
    }

    if (state === 'menu') {
      onJumpPress(); // Clicking anywhere on menu starts game!
      return;
    }

    if (state === 'intel' || state === 'leaderboard') {
      onMenuClick('back_to_menu');
      return;
    }

    if (state === 'char_select') {
      return; // handled by hudClickTargets above
    }

    if (state === 'victory') {
      onRetry();
      return;
    }

    if (state === 'crashed') {
      onRetry();
      return;
    }

    if (state === 'feedback') {
      onFeedbackAdvance();
      return;
    }

    if (state === 'quiz') {
      for (const b of quizOptionBounds) {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          onQuizAnswer(b.index);
          return;
        }
      }
      return;
    }

    if (state === 'playing') {
      onJumpPress();
    }
  }

  function handlePointerUp() {
    onJumpRelease();
  }

  canvas.addEventListener('mousedown', (e) => {
    handlePointerDown(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', () => {
    handlePointerUp();
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    e.preventDefault();
    handlePointerUp();
  }, { passive: false });
}
