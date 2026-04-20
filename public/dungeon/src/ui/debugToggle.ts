import Phaser from 'phaser';

const LS_KEY = 'stc:debug-visible';

export function isDebugEnabled(search: string = window.location.search): boolean {
  const params = new URLSearchParams(search);
  return params.has('debug');
}

export function loadDebugVisible(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveDebugVisible(visible: boolean): void {
  try {
    localStorage.setItem(LS_KEY, visible ? '1' : '0');
  } catch {
    // localStorage unavailable — fail silent; toggle reverts to session-local
  }
}

/**
 * Mounts a bug-icon toggle in the top-left of a scene and calls onToggle
 * with the current visible state on every click (and once synchronously
 * with the persisted state, so the caller can seed the initial render).
 */
export function mountDebugToggle(
  scene: Phaser.Scene,
  onToggle: (visible: boolean) => void,
): void {
  let visible = loadDebugVisible();
  const label = () => (visible ? '\uD83D\uDC1B on' : '\uD83D\uDC1B off');
  const color = () => (visible ? '#ffca28' : '#5a5a6a');

  const btn = scene.add.text(16, 16, label(), {
    fontSize: '14px',
    color: color(),
    fontFamily: 'monospace',
    backgroundColor: '#1a1a2a',
    padding: { x: 8, y: 4 },
  }).setInteractive({ useHandCursor: true });

  btn.on('pointerdown', () => {
    visible = !visible;
    saveDebugVisible(visible);
    btn.setText(label());
    btn.setColor(color());
    onToggle(visible);
  });

  btn.on('pointerover', () => {
    btn.setBackgroundColor('#2a2a3a');
  });
  btn.on('pointerout', () => {
    btn.setBackgroundColor('#1a1a2a');
  });

  onToggle(visible);
}
