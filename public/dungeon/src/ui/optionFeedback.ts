import Phaser from 'phaser';

type Letter = 'A' | 'B' | 'C' | 'D';

const LETTERS: Letter[] = ['A', 'B', 'C', 'D'];

const DEFAULT_PANEL = { fill: 0x1a1a2a, stroke: 0x4a4a6a } as const;
const CORRECT_PANEL = { fill: 0x1a4a1a, stroke: 0x8bc34a } as const;
const WRONG_PANEL   = { fill: 0x4a1a1a, stroke: 0xe57373 } as const;

const DEFAULT_TEXT_COLOR = '#d0d0da';
const CORRECT_TEXT_COLOR = '#c8f0b0';
const WRONG_TEXT_COLOR   = '#f0c8c8';

/**
 * Recolor the 4 option panels to show the outcome of an answered question.
 * Chosen wrong option → red fill + "✗ " prefix; correct option → green fill +
 * "✓ " prefix; the other two stay default. Safe when correct === chosen
 * (answered correctly) — that option gets the green treatment.
 */
export function paintOptionFeedback(
  panels: Phaser.GameObjects.Rectangle[],
  texts: Phaser.GameObjects.Text[],
  correct: Letter,
  chosen: Letter,
): void {
  LETTERS.forEach((letter, i) => {
    const panel = panels[i];
    const txt = texts[i];
    if (!panel || !txt) return;
    const current = txt.text.replace(/^[\u2713\u2717]\s*/, '');
    if (letter === correct) {
      panel.setFillStyle(CORRECT_PANEL.fill);
      panel.setStrokeStyle(2, CORRECT_PANEL.stroke);
      txt.setColor(CORRECT_TEXT_COLOR);
      txt.setText(`\u2713 ${current}`);
    } else if (letter === chosen) {
      panel.setFillStyle(WRONG_PANEL.fill);
      panel.setStrokeStyle(2, WRONG_PANEL.stroke);
      txt.setColor(WRONG_TEXT_COLOR);
      txt.setText(`\u2717 ${current}`);
    } else {
      panel.setFillStyle(DEFAULT_PANEL.fill);
      panel.setStrokeStyle(2, DEFAULT_PANEL.stroke);
      txt.setColor(DEFAULT_TEXT_COLOR);
      txt.setText(current);
    }
  });
}

/**
 * Extract a compact summary of an explanation — the correct-answer
 * paragraph if the explanation follows the "A: ... B: ... C: ..." per-option
 * structure common in CCA-F, otherwise a simple length-truncated slice.
 * Caller uses this for inline post-answer feedback where vertical space is
 * tight; the full text is shown in the post-boss mistakes-review.
 */
export function summarizeExplanation(
  explanation: string,
  correct: Letter,
  maxChars: number = 300,
): string {
  const perOption = /(^|\n)([ABCD]):\s*([^\n]+(?:\n(?![ABCD]:)[^\n]*)*)/g;
  const matches: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = perOption.exec(explanation)) !== null) {
    matches[m[2]!] = m[3]!.trim();
  }
  const hit = matches[correct];
  if (hit) {
    return `${correct}) ${hit.length <= maxChars ? hit : hit.slice(0, maxChars - 1) + '\u2026'}`;
  }
  const trimmed = explanation.trim();
  return trimmed.length <= maxChars ? trimmed : trimmed.slice(0, maxChars - 1) + '\u2026';
}

/**
 * Restore the 4 option panels + texts to their default navy look and strip
 * any ✓/✗ prefix from the text. Called before rendering a new question.
 */
export function resetOptionFeedback(
  panels: Phaser.GameObjects.Rectangle[],
  texts: Phaser.GameObjects.Text[],
): void {
  panels.forEach(p => {
    p.setFillStyle(DEFAULT_PANEL.fill);
    p.setStrokeStyle(2, DEFAULT_PANEL.stroke);
  });
  texts.forEach(t => {
    t.setColor(DEFAULT_TEXT_COLOR);
    t.setText(t.text.replace(/^[\u2713\u2717]\s*/, ''));
  });
}
