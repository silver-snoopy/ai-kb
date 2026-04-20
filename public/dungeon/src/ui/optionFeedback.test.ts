import { describe, it, expect } from 'vitest';
import { paintOptionFeedback, resetOptionFeedback, summarizeExplanation } from './optionFeedback';

// Minimal fakes — paintOptionFeedback only calls setFillStyle / setStrokeStyle
// on panels and setColor / setText / .text on texts. We capture the last-set
// values so the assertions stay readable.
function makePanelFake() {
  const state = { fill: 0x000000, strokeWidth: 0, strokeColor: 0x000000 };
  return {
    state,
    setFillStyle(fill: number) { state.fill = fill; return this; },
    setStrokeStyle(w: number, color: number) { state.strokeWidth = w; state.strokeColor = color; return this; },
  };
}

function makeTextFake(initial: string) {
  let text = initial;
  let color = '#d0d0da';
  return {
    get text() { return text; },
    setText(v: string) { text = v; return this; },
    setColor(v: string) { color = v; return this; },
    getColor() { return color; },
  };
}

describe('paintOptionFeedback', () => {
  it('marks correct option green with ✓ and chosen-wrong option red with ✗', () => {
    const panels = [makePanelFake(), makePanelFake(), makePanelFake(), makePanelFake()];
    const texts = [
      makeTextFake('A) foo'),
      makeTextFake('B) bar'),
      makeTextFake('C) baz'),
      makeTextFake('D) qux'),
    ];
    // User picked A; correct was C.
    paintOptionFeedback(panels as unknown as Phaser.GameObjects.Rectangle[], texts as unknown as Phaser.GameObjects.Text[], 'C', 'A');

    expect(panels[0]!.state.fill).toBe(0x4a1a1a);  // A wrong — red
    expect(texts[0]!.text).toBe('\u2717 A) foo');
    expect(panels[2]!.state.fill).toBe(0x1a4a1a);  // C correct — green
    expect(texts[2]!.text).toBe('\u2713 C) baz');
    expect(panels[1]!.state.fill).toBe(0x1a1a2a);  // B untouched — default navy
    expect(panels[3]!.state.fill).toBe(0x1a1a2a);  // D untouched
    expect(texts[1]!.text).toBe('B) bar');          // no prefix
  });

  it('when chosen === correct only the correct gets painted (both checkmark)', () => {
    const panels = [makePanelFake(), makePanelFake(), makePanelFake(), makePanelFake()];
    const texts = [
      makeTextFake('A) foo'),
      makeTextFake('B) bar'),
      makeTextFake('C) baz'),
      makeTextFake('D) qux'),
    ];
    paintOptionFeedback(panels as unknown as Phaser.GameObjects.Rectangle[], texts as unknown as Phaser.GameObjects.Text[], 'B', 'B');

    expect(panels[1]!.state.fill).toBe(0x1a4a1a);  // B correct path wins
    expect(texts[1]!.text).toBe('\u2713 B) bar');
    expect(panels[0]!.state.fill).toBe(0x1a1a2a);
    expect(panels[2]!.state.fill).toBe(0x1a1a2a);
  });

  it('strips existing prefix before re-applying (idempotent on repainted options)', () => {
    const panels = [makePanelFake(), makePanelFake(), makePanelFake(), makePanelFake()];
    const texts = [
      makeTextFake('\u2717 A) foo'),  // previously painted as wrong
      makeTextFake('B) bar'),
      makeTextFake('C) baz'),
      makeTextFake('D) qux'),
    ];
    // Now correct is A, chosen is B. Previously-wrong A should get flipped to ✓.
    paintOptionFeedback(panels as unknown as Phaser.GameObjects.Rectangle[], texts as unknown as Phaser.GameObjects.Text[], 'A', 'B');
    expect(texts[0]!.text).toBe('\u2713 A) foo');  // not "✓ ✗ A) foo"
  });
});

describe('summarizeExplanation', () => {
  it('extracts the correct-letter paragraph from a per-option explanation', () => {
    const exp = `A: Wrong because reasons.
B: Right because parallelism is achieved via concurrent tool calls in a single output generation.
C: Wrong, fork-based is overkill.
D: Wrong, no such ParallelTask tool exists.`;
    expect(summarizeExplanation(exp, 'B')).toBe(
      'B) Right because parallelism is achieved via concurrent tool calls in a single output generation.',
    );
  });

  it('falls back to length-truncation when no per-option structure', () => {
    const exp = 'Plain prose explanation without letter markers that is short.';
    expect(summarizeExplanation(exp, 'A')).toBe('Plain prose explanation without letter markers that is short.');
  });

  it('truncates overly long unstructured explanations with ellipsis', () => {
    const exp = 'x'.repeat(500);
    const out = summarizeExplanation(exp, 'A', 100);
    expect(out.length).toBe(100);
    expect(out.endsWith('\u2026')).toBe(true);
  });

  it('truncates overly long per-option paragraph with ellipsis', () => {
    const big = 'y'.repeat(500);
    const exp = `A: short\nB: ${big}\nC: short\nD: short`;
    const out = summarizeExplanation(exp, 'B', 120);
    expect(out.startsWith('B) yyy')).toBe(true);
    expect(out.endsWith('\u2026')).toBe(true);
  });

  it('handles multi-line per-option paragraphs', () => {
    const exp = `A: first line of A\n   and a continuation of A\nB: B is correct\nC: c stuff`;
    expect(summarizeExplanation(exp, 'A')).toContain('first line of A');
    expect(summarizeExplanation(exp, 'A')).toContain('continuation of A');
  });
});

describe('resetOptionFeedback', () => {
  it('restores default panel colors and strips ✓/✗ prefixes', () => {
    const panels = [makePanelFake(), makePanelFake(), makePanelFake(), makePanelFake()];
    const texts = [
      makeTextFake('\u2713 A) foo'),
      makeTextFake('\u2717 B) bar'),
      makeTextFake('C) baz'),
      makeTextFake('D) qux'),
    ];
    // Pre-paint to dirty state
    panels.forEach(p => p.setFillStyle(0xff0000));

    resetOptionFeedback(panels as unknown as Phaser.GameObjects.Rectangle[], texts as unknown as Phaser.GameObjects.Text[]);

    panels.forEach(p => expect(p.state.fill).toBe(0x1a1a2a));
    expect(texts[0]!.text).toBe('A) foo');
    expect(texts[1]!.text).toBe('B) bar');
    expect(texts[2]!.text).toBe('C) baz');
  });
});
