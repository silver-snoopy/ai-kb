import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { BossFightScene } from './scenes/BossFightScene';
import { InterstitialScene } from './scenes/InterstitialScene';
import { CampaignCompleteScene } from './scenes/CampaignCompleteScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 720,
  backgroundColor: '#0a0a14',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HubScene, BossFightScene, InterstitialScene, CampaignCompleteScene],
};

const game = new Phaser.Game(config);

// Dev-only expose for Playwright smoke tests; tree-shaken in production builds.
if (import.meta.env.DEV) {
  (window as unknown as { __STC_GAME__: Phaser.Game }).__STC_GAME__ = game;
}
