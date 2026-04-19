import Phaser from 'phaser';

export function computeHitStopMs(damage: number): number {
  const raw = Math.sqrt(Math.max(0, damage)) * 25;
  return Math.max(40, Math.min(150, raw));
}

export function installHitStop(scene: Phaser.Scene): () => void {
  const onCorrect = (payload: { damage: number }) => {
    const ms = computeHitStopMs(payload.damage);
    scene.tweens.pauseAll();
    scene.time.delayedCall(ms, () => scene.tweens.resumeAll());
  };
  const onWrong = () => {
    const ms = computeHitStopMs(1);
    scene.tweens.pauseAll();
    scene.time.delayedCall(ms, () => scene.tweens.resumeAll());
  };
  scene.events.on('answer-correct', onCorrect);
  scene.events.on('answer-wrong', onWrong);
  return () => {
    scene.events.off('answer-correct', onCorrect);
    scene.events.off('answer-wrong', onWrong);
  };
}
