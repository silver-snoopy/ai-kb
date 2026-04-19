// Per-boss backdrop definitions. Each backdrop composes three layers:
//   1. A wall tile repeated across the upper band
//   2. A floor tile repeated across the lower band
//   3. A handful of themed props placed at specific positions
//
// Tile indices reference frames in the `td-tiles` spritesheet (loaded from
// public/assets/tilemap_packed.png \u2014 192\u00d7176, 12\u00d711 tiles at 16px).
// Layout in the sheet:
//   Row 0-2 (tiles 0-35):   walls (wood, stone, iron)
//   Row 3   (tiles 36-47):  grey stone floor + doors + stairs
//   Row 4   (tiles 48-59):  sand/tan floor
//   Row 5   (tiles 60-71):  pattern floors + chest + lamp + gate
//   Row 6   (tiles 72-83):  wooden tables, bed
//   Row 7   (tiles 84-95):  humanoid characters
//   Row 8   (tiles 96-107): undead + weapons
//   Row 9   (tiles 108-119):creatures + potions
//   Row 10  (tiles 120-131):big bosses + gems + keys

import type Phaser from 'phaser';

export interface BackdropProp {
  tile: number;
  x: number;
  y: number;
}

export interface Backdrop {
  wallTile: number;
  floorTile: number;
  props: BackdropProp[];
}

// Sprite scale for backdrop tiles. Scaled 2x so tiles render at 32px each \u2014
// matches roughly the scale of our hero (48px at 3x) and boss (64px at 4x)
// sprites standing in the scene.
const TILE_DISPLAY_SCALE = 2;

// Backdrop band placement. The top wall band sits above the question bubble,
// the floor band sits under the hero/boss sprite ground plane. The top 70px
// is intentionally left clear so the boss-name text has an uncluttered
// banner strip above the wall pattern.
const WALL_BAND_Y = 140;   // center of the 140-tall wall band (y=70..210)
const WALL_BAND_HEIGHT = 140;
const FLOOR_BAND_Y = 540;  // center of the 200-tall floor band (y=440..640)
const FLOOR_BAND_HEIGHT = 200;

export const BACKDROPS: Record<string, Backdrop> = {
  'the-orchestrator': {
    // Throne hall with chess-piece attendants \u2014 grey stone, torches, throne-center.
    wallTile: 17,      // plain grey stone wall
    floorTile: 36,     // grey flagstone floor
    props: [
      { tile: 30, x: 120, y: 180 },  // torch left
      { tile: 30, x: 840, y: 180 },  // torch right
      { tile: 66, x: 480, y: 430 },  // chest (throne stand-in, center)
    ],
  },
  'the-compiler-king': {
    // Iron workshop; command sigils. Darker tones, anvil front-center.
    wallTile: 11,      // iron panel wall
    floorTile: 36,     // grey floor
    props: [
      { tile: 14, x: 300, y: 430 },  // anvil left-center
      { tile: 14, x: 660, y: 430 },  // anvil right-center
      { tile: 30, x: 480, y: 180 },  // torch center-top
    ],
  },
  'the-grammarian': {
    // Library of carved stone scrolls. Pattern floor + chests standing in for bookshelves.
    wallTile: 17,      // grey stone
    floorTile: 62,     // pattern floor (reads like a rug)
    props: [
      { tile: 66, x: 160, y: 430 },  // chest (book-cache) left
      { tile: 66, x: 800, y: 430 },  // chest right
      { tile: 78, x: 480, y: 440 },  // bed-tile (reading chaise in spec spirit)
    ],
  },
  'the-tool-smith': {
    // Forge surrounded by schemas-as-runes. Sand floor, wood walls, anvil-heavy.
    wallTile: 7,       // wood/iron wall
    floorTile: 48,     // sand/tan floor
    props: [
      { tile: 14, x: 180, y: 430 },  // anvil left
      { tile: 14, x: 780, y: 430 },  // anvil right
      { tile: 30, x: 480, y: 180 },  // torch/forge-fire center-top
    ],
  },
  'the-memory-kraken': {
    // Flooded archive; sinking context-shelves. Tan floor reads as submerged; chests sinking.
    wallTile: 17,      // grey stone
    floorTile: 48,     // tan (damp)
    props: [
      { tile: 66, x: 160, y: 440 },  // chest (shelf-fragment) left
      { tile: 66, x: 480, y: 440 },  // chest center
      { tile: 66, x: 800, y: 440 },  // chest right
    ],
  },
};

// The torch tile index in Kenney Tiny Dungeon. Handled specially so it
// flickers \u2014 readable as a flame source rather than a static sconce.
const TORCH_TILE = 30;

/**
 * Render the backdrop for a boss into the scene. Must be called BEFORE any
 * other scene elements are added so it sits at the bottom of the z-stack.
 */
export function renderBackdrop(scene: Phaser.Scene, bossId: string): void {
  const bg = BACKDROPS[bossId];
  if (!bg) return;

  // Wall band along the top.
  const wall = scene.add.tileSprite(
    480, WALL_BAND_Y,
    960, WALL_BAND_HEIGHT,
    'td-tiles', bg.wallTile,
  );
  wall.setTileScale(TILE_DISPLAY_SCALE);

  // Floor band along the bottom.
  const floor = scene.add.tileSprite(
    480, FLOOR_BAND_Y,
    960, FLOOR_BAND_HEIGHT,
    'td-tiles', bg.floorTile,
  );
  floor.setTileScale(TILE_DISPLAY_SCALE);

  // Props on top of the floor/wall. Torches get a flame-wobble tween;
  // other props stay static.
  for (const p of bg.props) {
    const img = scene.add.image(p.x, p.y, 'td-tiles', p.tile).setScale(TILE_DISPLAY_SCALE);
    if (p.tile === TORCH_TILE) {
      // Three overlapping tweens produce a credible flame flicker:
      //  - vertical scale wobble (~5%) = flame stretch/squash
      //  - subtle alpha dip = brightness modulation
      //  - tiny y jitter = heat wave shimmer
      // Different durations + 'Sine.easeInOut' easing prevent a
      // perceptible rhythm (would feel mechanical if phase-locked).
      scene.tweens.add({
        targets: img,
        scaleY: TILE_DISPLAY_SCALE * 1.08,
        duration: 140,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      scene.tweens.add({
        targets: img,
        alpha: 0.82,
        duration: 190,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      scene.tweens.add({
        targets: img,
        y: p.y - 2,
        duration: 110,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
