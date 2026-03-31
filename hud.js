// ============================================================
// hud.js — HUD rendering: state messages, score, death tips
// ============================================================

/**
 * Draws the death tip overlay with obstacle-specific educational content.
 * 
 * @param {CanvasRenderingContext2D} ctx - the 2D drawing context
 * @param {Object} obstacle - the obstacle that caused death (has tips, tipIndex, color, type)
 * @param {number} CANVAS_W - canvas width
 * @param {number} CANVAS_H - canvas height
 */
export function drawDeathTip(ctx, obstacle, CANVAS_W, CANVAS_H) {
  if (!obstacle || !obstacle.tips) return;
  
  const overlayHeight = CANVAS_H / 4;
  const overlayY = CANVAS_H - overlayHeight;
  
  // Semi-transparent dark overlay
  ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
  ctx.fillRect(0, overlayY, CANVAS_W, overlayHeight);
  
  // Top border accent
  ctx.fillStyle = obstacle.color || '#7ecfff';
  ctx.fillRect(0, overlayY, CANVAS_W, 2);
  
  // Obstacle type label
  const label = `[ ${getObstacleLabel(obstacle.type)} ]`;
  ctx.fillStyle = obstacle.color || '#7ecfff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, CANVAS_W / 2, overlayY + 8);
  
  // Tip text (wrapped)
  const tipText = obstacle.tips[obstacle.tipIndex] || 'Network threat detected';
  const wrappedLines = wrapText(tipText, CANVAS_W - 40, ctx, '12px monospace');
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  
  const lineHeight = 16;
  const startY = overlayY + 28;
  
  wrappedLines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, startY + i * lineHeight);
  });
}

// Option bounds populated by drawQuizOverlay — read by game.js for click hit-testing
export const quizOptionBounds = [];

export function drawHUD(ctx, state, score, attempts, CANVAS_W, CANVAS_H, currentQuiz) {
  if (state === 'waiting') {
    drawWaitingScreen(ctx, CANVAS_W, CANVAS_H);
  } else if (state === 'playing') {
    drawPlayingHUD(ctx, score, attempts, CANVAS_W);
  } else if (state === 'dead') {
    drawDeadScreen(ctx, CANVAS_W, CANVAS_H);
  } else if (state === 'quiz') {
    drawQuizOverlay(ctx, currentQuiz, CANVAS_W, CANVAS_H);
  }
  // 'feedback' state is rendered by drawQuizFeedback — called directly from game.js
}

/**
 * Full-screen feedback overlay shown after each answer.
 * isCorrect — whether the player chose the right option.
 * quiz      — the question object (needs .answer and optionally .explanation)
 */
export function drawQuizFeedback(ctx, quiz, isCorrect, CANVAS_W, CANVAS_H) {
  ctx.fillStyle = 'rgba(10, 15, 30, 0.98)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const themeColor = isCorrect ? '#4ade80' : '#f87171';

  ctx.fillStyle    = themeColor;
  ctx.font         = 'bold 24px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isCorrect ? 'CORRECT!' : 'INCORRECT', CANVAS_W / 2, CANVAS_H / 2 - 80);

  if (quiz) {
    if (!isCorrect) {
      ctx.fillStyle = '#ffffff';
      ctx.font      = '16px monospace';
      ctx.fillText(`Correct Answer: ${quiz.answer}`, CANVAS_W / 2, CANVAS_H / 2 - 40);
    }

    const explanation = quiz.explanation || 'CompTIA Tip: Review this concept in your study notes.';
    const lines = wrapText(explanation, CANVAS_W - 100, ctx, '13px monospace');
    ctx.font      = '13px monospace';
    ctx.fillStyle = '#94a3b8';
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, CANVAS_H / 2 + i * 22);
    });
  }

  ctx.fillStyle = themeColor;
  ctx.font      = '13px monospace';
  ctx.fillText('CLICK OR PRESS SPACE TO CONTINUE', CANVAS_W / 2, CANVAS_H - 60);
}

function drawQuizOverlay(ctx, quiz, CANVAS_W, CANVAS_H) {
  if (!quiz) {
    // Still loading — show spinner text
    ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#7ecfff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOADING QUESTION…', CANVAS_W / 2, CANVAS_H / 2);
    return;
  }

  // Full-screen overlay
  ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Header
  ctx.fillStyle = '#7ecfff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('REVIVE QUIZ — ANSWER TO RECONNECT', CANVAS_W / 2, 40);

  // Question (wrapped)
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  const lines = wrapText(quiz.question, CANVAS_W - 80, ctx, '14px monospace');
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 90 + i * 22));

  // Answer options
  const optionStartY = 90 + lines.length * 22 + 20;
  quizOptionBounds.length = 0;  // clear and repopulate each frame
  quiz.options.forEach((opt, i) => {
    const x = CANVAS_W / 2 - 220;
    const y = optionStartY + i * 44;
    quizOptionBounds.push({ x, y, w: 440, h: 34, index: i });
    ctx.fillStyle = 'rgba(126, 207, 255, 0.12)';
    ctx.fillRect(x, y, 440, 34);
    ctx.strokeStyle = 'rgba(126, 207, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 440, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}.  ${opt}`, CANVAS_W / 2, y + 17);
  });

  // Footer hint
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '11px monospace';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Press 1 – 4 or click to answer', CANVAS_W / 2, CANVAS_H - 16);
}

// ── Internal rendering functions ─────────────────────────────

function drawWaitingScreen(ctx, CANVAS_W, CANVAS_H) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRESS SPACE OR CLICK TO START', CANVAS_W / 2, CANVAS_H / 2 - 20);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '13px monospace';
  ctx.fillText('double jump supported', CANVAS_W / 2, CANVAS_H / 2 + 8);
}

function drawPlayingHUD(ctx, score, attempts, CANVAS_W) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Score (top-left)
  ctx.fillStyle = '#7ecfff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`PACKETS: ${score}`, 10, 10);
  
  // Attempts (top-right)
  ctx.textAlign = 'right';
  ctx.fillText(`ATTEMPTS: ${attempts}`, CANVAS_W - 10, 10);
}

function drawDeadScreen(ctx, CANVAS_W, CANVAS_H) {
  ctx.fillStyle = 'rgba(224, 82, 82, 0.95)';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CONNECTION LOST', CANVAS_W / 2, CANVAS_H / 2 - 25);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '13px monospace';
  ctx.fillText('press space or click to reconnect', CANVAS_W / 2, CANVAS_H / 2 + 10);
}

// ── Helper functions ─────────────────────────────────────────

function getObstacleLabel(type) {
  const labels = {
    'FW': 'FIREWALL',
    'IDS': 'IDS SENSOR',
    'M': 'MALWARE'
  };
  return labels[type] || 'THREAT';
}

/**
 * Wraps text into multiple lines based on max width.
 * 
 * @param {string} text - the text to wrap
 * @param {number} maxWidth - maximum width in pixels
 * @param {CanvasRenderingContext2D} ctx - context for measuring text
 * @param {string} font - font to use for measurement
 * @returns {Array<string>} - array of wrapped lines
 */
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
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
