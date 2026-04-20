# Asset dropzone

Stash raw CC0 asset ZIPs here. Session 4 (Task 4.1) extracts them into `../sprites/`, `../tiles/`, `../audio/`.

Expected contents (per spec §11.2):

- `kenney_1-bit-pack.zip` — hero sprite (warlock recolor) + generic tiles
- `kenney_tiny-dungeon.zip` — dungeon floors, walls, torches
- `kenney_ui-pack-rpg-expansion.zip` — scroll banners, HP hearts, buttons
- `kenney_digital-audio.zip` — hit/miss/spell/death SFX

All Kenney packs are CC0; download from https://kenney.nl/assets (no account needed).

ZIPs themselves are not committed (see `.gitignore`); only the extracted, organized output under `../sprites/` etc. ships with the game.
