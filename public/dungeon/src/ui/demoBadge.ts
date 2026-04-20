import Phaser from 'phaser';

/**
 * Mount a persistent "(DEMO)" badge in the bottom-left corner if the
 * current run is a demo. Visible during BossFight and Interstitial so
 * the player never forgets they are testing against the fake pool.
 */
export function mountDemoBadgeIfActive(scene: Phaser.Scene): void {
  if (!scene.registry.get('demoRun')) return;
  scene.add.text(16, 700, '(DEMO)', {
    fontSize: '11px',
    color: '#ffca28',
    fontFamily: 'monospace',
    fontStyle: 'italic',
    backgroundColor: '#1a1a2a',
    padding: { x: 6, y: 3 },
  }).setOrigin(0, 1).setDepth(1000);
}
