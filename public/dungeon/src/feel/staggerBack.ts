import Phaser from 'phaser';

export const STAGGER_PX = 12;
export const STAGGER_KNOCK_MS = 120;
export const STAGGER_RECOVER_MS = 200;

interface FeelTargets { heroSprite: Phaser.GameObjects.Image; bossSprite: Phaser.GameObjects.Image; }

function stagger(scene: Phaser.Scene, target: Phaser.GameObjects.Image, direction: 'left' | 'right'): void {
  const origX = target.x;
  // Cancel any in-flight stagger tween; snap to origin to prevent drift.
  const existing = (target as any).__staggerOrigX as number | undefined;
  const baseX = existing ?? origX;
  (target as any).__staggerOrigX = baseX;
  scene.tweens.killTweensOf(target);
  target.x = baseX;
  const offset = direction === 'left' ? -STAGGER_PX : STAGGER_PX;
  scene.tweens.add({
    targets: target,
    x: baseX + offset,
    duration: STAGGER_KNOCK_MS,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: target,
        x: baseX,
        duration: STAGGER_RECOVER_MS,
        ease: 'Cubic.easeIn',
        onComplete: () => { delete (target as any).__staggerOrigX; },
      });
    },
  });
}

export function installStaggerBack(scene: Phaser.Scene, targets: FeelTargets): () => void {
  // Layout: hero at x=120 (left), boss at x=840 (right). Knocked "away from attacker":
  // boss moves right (+12), hero moves left (-12). This matches the existing shipped
  // behaviour before Step 5.5 removes the inline shake code.
  const onCorrect = () => stagger(scene, targets.bossSprite, 'right');
  const onWrong = () => stagger(scene, targets.heroSprite, 'left');
  scene.events.on('answer-correct', onCorrect);
  scene.events.on('answer-wrong', onWrong);
  return () => {
    scene.events.off('answer-correct', onCorrect);
    scene.events.off('answer-wrong', onWrong);
  };
}
