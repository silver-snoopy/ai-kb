import type Phaser from 'phaser';
import type { Campaign } from '../game/dungeon';
import type { BossDefinition } from '../types';
import { mountAudioToggles } from './audioToggles';
import { mountMenuButton } from './inFightNav';

const BAR_HEIGHT = 44;
const BAR_DARKEN = 0.5; // bar fill = boss color × this factor (darker)
const BAR_BORDER_DARKEN = 0.9; // bottom border = boss color × this; lighter than the fill

// The only Campaign fields the HUD needs. A type-only Pick keeps this UI module
// decoupled from game logic while still breaking if those fields ever rename.
type CampaignRunInfo = Pick<Campaign, 'floorsCleared' | 'bossOrder'>;

/**
 * Multiply each RGB channel of a hex color by `factor` (clamped to 0–255).
 * factor < 1 darkens; used to derive the HUD bar shade from a boss's
 * environmentColor.
 */
export function darken(color: number, factor: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((color >> 16) & 0xff) * factor);
  const g = clamp(((color >> 8) & 0xff) * factor);
  const b = clamp((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/**
 * Left-side HUD run label. With a campaign: "Floor <n>/<total> · <domain>"
 * (n is 1-indexed). Without one (isolated/debug fight): just the domain.
 */
export function formatRunLabel(campaign: CampaignRunInfo | undefined, domainShort: string): string {
  if (!campaign) return domainShort;
  return `Floor ${campaign.floorsCleared + 1}/${campaign.bossOrder.length} · ${domainShort}`;
}

export interface BossHudOptions {
  boss: BossDefinition;
  campaign: CampaignRunInfo | undefined;
  onExit: () => void;
  onBgmToggle: (muted: boolean) => void;
}

/**
 * Mount the boss-fight HUD: a themed top bar (darkened boss color) holding the
 * back-to-menu door + "Floor N/M · <domain>" on the left and icon-only
 * SFX/BGM on the right. Reuses mountMenuButton + mountAudioToggles so their
 * behavior/persistence is unchanged.
 */
export function mountBossHud(scene: Phaser.Scene, opts: BossHudOptions): void {
  const { boss, campaign, onExit, onBgmToggle } = opts;
  const midY = BAR_HEIGHT / 2;

  // Themed bar fill + a slightly lighter bottom border so it frames cleanly.
  scene.add
    .rectangle(480, midY, 960, BAR_HEIGHT, darken(boss.environmentColor, BAR_DARKEN))
    .setDepth(900);
  scene.add
    .rectangle(480, BAR_HEIGHT - 1, 960, 2, darken(boss.environmentColor, BAR_BORDER_DARKEN))
    .setDepth(901);

  // Left: door + run label.
  mountMenuButton(scene, onExit, { x: 28, y: midY });
  scene.add
    .text(64, midY, formatRunLabel(campaign, boss.domainShort), {
      fontSize: '14px',
      color: '#f5e4b3',
      fontFamily: 'monospace',
    })
    .setOrigin(0, 0.5)
    .setDepth(1000);

  // Right: icon-only SFX/BGM, vertically centered in the bar.
  mountAudioToggles(scene, { iconOnly: true, y: midY, onBgmToggle });
}
