import Phaser from 'phaser';

export function computeShakeIntensity(damage: number, bossMaxHp: number): number {
  const ratio = Math.max(0, damage) / Math.max(1, bossMaxHp);
  const raw = ratio * 0.04;
  return Math.max(0.004, Math.min(0.025, raw));
}

export function computeShakeDuration(damage: number): number {
  const raw = Math.max(0, damage) * 30;
  return Math.max(80, Math.min(240, raw));
}

export function installShakeGrading(scene: Phaser.Scene): () => void {
  const onCorrect = (p: { damage: number; bossMaxHp: number }) => {
    scene.cameras.main.shake(computeShakeDuration(p.damage), computeShakeIntensity(p.damage, p.bossMaxHp));
  };
  const onWrong = () => {
    scene.cameras.main.shake(120, 0.008);
  };
  scene.events.on('answer-correct', onCorrect);
  scene.events.on('answer-wrong', onWrong);
  return () => {
    scene.events.off('answer-correct', onCorrect);
    scene.events.off('answer-wrong', onWrong);
  };
}
