// Hover-feedback helpers. Phaser emits pointerover/pointerout on any
// interactive game object; these two functions wire up the color swaps
// we want for our two button flavors:
//   - Rectangle buttons (options, debug row, Begin Quest): fill + stroke
//     brighten; return to base on pointerout.
//   - Text buttons that use backgroundColor for their panel (spellbook):
//     bg + text color brighten; return to base on pointerout. An optional
//     `active` predicate lets unavailable spells skip the hover effect so
//     dim buttons don't pretend to be clickable.

import Phaser from 'phaser';

export interface RectHoverStyle {
  fill: number;
  stroke: number;
}

/** Attach hover feedback to a Phaser Rectangle button. */
export function attachRectHover(
  rect: Phaser.GameObjects.Rectangle,
  base: RectHoverStyle,
  hover: RectHoverStyle,
  strokeWidth = 2,
): void {
  rect.on('pointerover', () => {
    rect.setFillStyle(hover.fill);
    rect.setStrokeStyle(strokeWidth, hover.stroke);
  });
  rect.on('pointerout', () => {
    rect.setFillStyle(base.fill);
    rect.setStrokeStyle(strokeWidth, base.stroke);
  });
}

export interface TextHoverStyle {
  bg: string;
  color: string;
}

/**
 * Attach hover feedback to a Phaser Text button that uses `backgroundColor`
 * for its panel. Pass `active` if the button can be disabled (e.g. zero-
 * charge spell) \u2014 when it returns false, pointerover is a no-op so the
 * disabled state reads as truly uninteractive.
 */
export function attachTextHover(
  txt: Phaser.GameObjects.Text,
  base: TextHoverStyle,
  hover: TextHoverStyle,
  active?: () => boolean,
): void {
  txt.on('pointerover', () => {
    if (active && !active()) return;
    txt.setBackgroundColor(hover.bg);
    txt.setColor(hover.color);
  });
  txt.on('pointerout', () => {
    // Always snap back to base on pointer-out \u2014 even if `active` flipped
    // mid-hover, we want the button to read its current visual state.
    txt.setBackgroundColor(base.bg);
    txt.setColor(active && !active() ? '#5a5a6a' : base.color);
  });
}
