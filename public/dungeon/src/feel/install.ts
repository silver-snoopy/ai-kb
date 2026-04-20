import Phaser from 'phaser';
import { installHitStop } from './hitStop';
import { installShakeGrading } from './shakeGrading';
import { installSquashStretch } from './squashStretch';
import { installStaggerBack } from './staggerBack';
import { installAmbientDust } from './ambientDust';

interface FeelTargets {
  heroSprite: Phaser.GameObjects.Image;
  bossSprite: Phaser.GameObjects.Image;
}

export function installFeelPack(scene: Phaser.Scene, targets: FeelTargets): () => void {
  const disposers = [
    installHitStop(scene),
    installShakeGrading(scene),
    installSquashStretch(scene, targets),
    installStaggerBack(scene, targets),
    installAmbientDust(scene),
  ];
  const disposeAll = () => disposers.forEach(d => d());
  scene.events.once('shutdown', disposeAll);
  return disposeAll;
}
