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
 * Left-side HUD floor label: "Floor <n>/<total>" (n is 1-indexed). Empty string
 * for an isolated/debug fight with no campaign (the bar then shows just the
 * domain). The domain is rendered as its own label so the decorative sigil can
 * sit between the two as the separator.
 */
export function formatFloorLabel(campaign: CampaignRunInfo | undefined): string {
  if (!campaign) return '';
  return `Floor ${campaign.floorsCleared + 1}/${campaign.bossOrder.length}`;
}

export interface BossHudOptions {
  boss: BossDefinition;
  campaign: CampaignRunInfo | undefined;
  onExit: () => void;
  onBgmToggle: (muted: boolean) => void;
  /** Boss name, rendered centered in the bar. Sitting on the themed strip
   *  keeps it clear of the brick wall and the near-full-width question scroll
   *  below, which a scene-body plate would clip. */
  bossName?: string;
}

/**
 * Mount the boss-fight HUD: a themed top bar (darkened boss color) holding the
 * back-to-menu door + "Floor N/M · <domain>" on the left and icon-only
 * SFX/BGM on the right. Reuses mountMenuButton + mountAudioToggles so their
 * behavior/persistence is unchanged.
 */
export function mountBossHud(
  scene: Phaser.Scene,
  opts: BossHudOptions,
): { separatorX: number; separatorY: number } {
  const { boss, campaign, onExit, onBgmToggle, bossName } = opts;
  const midY = BAR_HEIGHT / 2;

  // Themed bar fill + a slightly lighter bottom border so it frames cleanly.
  scene.add
    .rectangle(480, midY, 960, BAR_HEIGHT, darken(boss.environmentColor, BAR_DARKEN))
    .setDepth(900);
  scene.add
    .rectangle(480, BAR_HEIGHT - 1, 960, 2, darken(boss.environmentColor, BAR_BORDER_DARKEN))
    .setDepth(901);

  // Left cluster: door, then "Floor N/M  ◈  <domain>". The decorative stinger
  // sigil stands in for the separator between floor and domain (the old "·" is
  // dropped). We lay out floor → reserved separator slot → domain left-to-right
  // and return the slot's centre so the caller mounts the actual sigil there —
  // keeping the demo-arm/trigger logic in decorativeSigil, not in the HUD.
  mountMenuButton(scene, onExit, { x: 28, y: midY });

  const labelStyle = { fontSize: '14px', color: '#f5e4b3', fontFamily: 'monospace' };
  const SEP_HALF = 7; // half the width reserved for the separator sigil slot (14px glyph)
  const GAP = 5; // breathing space between each label and the separator slot

  let cursor = 64;
  const floorStr = formatFloorLabel(campaign);
  if (floorStr) {
    const floorText = scene.add
      .text(cursor, midY, floorStr, labelStyle)
      .setOrigin(0, 0.5)
      .setDepth(1000);
    cursor = floorText.x + floorText.width + GAP;
  }
  const separatorX = cursor + SEP_HALF;
  cursor = separatorX + SEP_HALF + GAP;
  scene.add.text(cursor, midY, boss.domainShort, labelStyle).setOrigin(0, 0.5).setDepth(1000);

  // Center: boss name, in amber (brand accent). Centered between the left run
  // label and the right audio cluster, on the themed strip — clears both the
  // brick wall and the question scroll that side/overhead plates would clip.
  if (bossName) {
    scene.add
      .text(480, midY, bossName, {
        fontSize: '18px',
        color: '#ffca28',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(1000);
  }

  // Right: icon-only SFX/BGM, vertically centered in the bar.
  mountAudioToggles(scene, { iconOnly: true, y: midY, onBgmToggle });

  // Return the separator slot's centre so the caller mounts the decorative
  // stinger sigil exactly between the floor and domain labels.
  return { separatorX, separatorY: midY };
}
