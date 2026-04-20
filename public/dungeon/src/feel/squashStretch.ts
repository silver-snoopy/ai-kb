import Phaser from 'phaser';

export const SQUASH_SCALE_X = 1.15;
export const SQUASH_SCALE_Y = 0.85;
export const SQUASH_DURATION_MS = 80;

interface FeelTargets { heroSprite: Phaser.GameObjects.Image; bossSprite: Phaser.GameObjects.Image; }

function squash(scene: Phaser.Scene, target: Phaser.GameObjects.Image): void {
  scene.tweens.killTweensOf(target);  // cancel in-flight squash on same target to prevent stacking
  const origX = target.scaleX;
  const origY = target.scaleY;
  scene.tweens.add({
    targets: target,
    scaleX: origX * SQUASH_SCALE_X,
    scaleY: origY * SQUASH_SCALE_Y,
    duration: SQUASH_DURATION_MS,
    yoyo: true,
    ease: 'Back.easeOut',
    onComplete: () => { target.setScale(origX, origY); },
  });
}

export function installSquashStretch(scene: Phaser.Scene, targets: FeelTargets): () => void {
  const onCorrect = () => squash(scene, targets.bossSprite);
  const onWrong = () => squash(scene, targets.heroSprite);
  scene.events.on('answer-correct', onCorrect);
  scene.events.on('answer-wrong', onWrong);
  return () => {
    scene.events.off('answer-correct', onCorrect);
    scene.events.off('answer-wrong', onWrong);
  };
}
