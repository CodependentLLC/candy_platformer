# AGENTS.md

## Project

This repository contains **Candy Quest Kids**, a browser-based candy platformer campaign. The game is a handcrafted HTML/CSS/JavaScript canvas game that runs by opening `index.html` in a modern browser.

The player chooses a Boy or Girl Explorer and travels through a bedtime-story candy world, moving from a closet door into a six-chapter campaign with lives, hearts, checkpoints, collectibles, Sugar Rush, sugar gates, enemies, side stages, medals, and a story ending.

## Read first

Before making gameplay, UI, content, or architecture changes, read these steering docs:

- `docs/game_steering.md`
- `docs/technical_steering.md`
- `docs/content_steering.md`
- `docs/code_review.md`

## Current architecture

The app is intentionally simple:

- `index.html` defines the canvas, HUD, menu, hero selection, world map entry points, and touch controls.
- `style.css` owns responsive layout, HUD styling, menu styling, compact mobile mode, safe-area handling, and touch controls.
- `data/` owns reusable data-shape helpers, asset metadata, level/stage definitions, and world-map node data.
- `game.js` owns game state, asset loading, rendering, input, audio, world map flow, persistence, collision, enemies, collectibles, and story flow.
- `assets/` contains sprites, backgrounds, tiles, enemies, hero art, world-map art, and icons.

Do not introduce a framework or build step unless the task explicitly asks for that migration.

## How to run

Open `index.html` in a modern browser.

There is currently no package manager, bundler, test runner, or `package.json`. Do not invent commands. If commands are added later, update this file and the technical steering doc.

## Working rules for Codex

- Prefer small, focused changes that preserve the no-build static-browser setup.
- Keep the game playable by opening `index.html` directly.
- Preserve the existing 16:9 canvas stage and responsive shell behavior.
- Preserve keyboard, button, fullscreen, sound, pause, menu, hero select, world map, and touch-control flows.
- Preserve localStorage save compatibility unless the task explicitly asks for a migration.
- Keep game content family-friendly, encouraging, readable, and candy-themed.
- Keep gameplay challenge gentle but meaningful.
- Avoid large rewrites of `game.js` unless explicitly requested.
- Avoid new dependencies unless there is a clear benefit and the task asks for them.
- Avoid replacing existing sprite-driven presentation with placeholder shapes unless the task is specifically about fallback rendering.
- Avoid removing mobile compact UI behavior, safe-area support, or touch controls.
- Avoid exposing raw errors to players.

## Quality bar

A change is ready only when:

- `index.html` still loads in a modern browser.
- The main menu, hero selection, Start Adventure, World Map, Side Stages, pause, restart, sound toggle, fullscreen, and touch controls still work where relevant.
- The player can still complete at least one level after gameplay changes.
- Save data still reads safely from localStorage and fails gracefully if storage is unavailable.
- Any new player-facing copy follows `docs/content_steering.md`.
- Any new mechanics follow `docs/game_steering.md`.
- Any architectural changes follow `docs/technical_steering.md`.

## Manual validation checklist

When relevant, manually check:

1. Open `index.html`.
2. Choose Boy and start the adventure.
3. Choose Girl and confirm the hero state updates.
4. Move, jump, collect candy, take damage, lose hearts, and restart.
5. Reach a checkpoint if the changed area touches levels or progression.
6. Open the world map and select an unlocked node.
7. Confirm compact/mobile layout still has usable controls.
8. Toggle sound, pause, menu, and fullscreen.
9. Refresh and confirm saved progress still loads.

## Commit style

Use concise commit messages in the imperative mood.

Examples:

- `Tune sugar gate timing`
- `Add frosting falls side stage`
- `Fix compact HUD overlap`
- `Document Codex steering rules`
