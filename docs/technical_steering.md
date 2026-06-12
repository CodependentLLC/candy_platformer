# Technical Steering

## Stack

This is a static browser game:

- HTML entry point: `index.html`
- Styling: `style.css`
- Runtime/game logic: `game.js`
- Data definitions: browser scripts in `data/`
- Rendering: HTML canvas
- Audio: Web Audio API
- Persistence: `localStorage`
- Assets: files in `assets/`
- Package scripts: `package.json` for local serving and smoke checks only
- No build step currently exists

Do not add a build system, framework, transpiler, dependency manager, or module bundler unless the task explicitly asks for it.

## File responsibilities

### `index.html`

Owns the document shell:

- Canvas
- HUD containers
- Menu overlay
- Hero selection buttons
- Main menu actions
- Top control buttons
- Touch controls
- Stylesheet and script includes

Keep IDs stable unless all JavaScript references are updated.

### `style.css`

Owns layout and responsive presentation:

- 16:9 game stage
- Fullscreen behavior
- HUD panels
- Menu overlay
- Hero/action menu states
- Compact mobile UI
- Safe-area inset support
- Touch controls

Do not remove compact UI rules or safe-area handling.

### `game.js`

Owns runtime behavior:

- DOM references
- Game state
- Save keys
- Asset loading
- Data consumption
- World map data
- Input handling
- Game loop
- Rendering
- Physics/collision
- Enemies
- Collectibles
- Audio
- Menus and overlays
- Progression and localStorage persistence

Prefer focused edits within existing sections. Avoid broad reorganizations unless explicitly requested.

### `data/`

Owns static JavaScript data loaded before `game.js`:

- `shapes.js` for level-data helper constructors
- `assets.js` for asset metadata, animation frames, background presentation, and ambience data
- `levels.js` for main campaign and side-stage definitions
- `world-map.js` for world-map node data

Keep these files as plain browser scripts with stable `window.CandyQuest*` exports. Do not convert them to modules unless the project also intentionally changes how `index.html` loads scripts.

### `package.json`

Owns minimal development scripts only:

- `npm run serve` starts a static local server for manual browser checks.
- `npm run smoke:syntax` runs JavaScript syntax checks for the browser scripts and smoke test.
- `npm run smoke:browser` starts a local static server and checks the page in a Chromium-family browser.
- `npm run smoke` runs both syntax and browser smoke checks.

Do not add dependencies, a build step, or framework tooling unless explicitly requested.

## Runtime model

The game uses a single-page runtime with a canvas and HUD overlays. The high-level game state includes menu, map, playing, gameover, ending, and escape-style flows.

When changing state transitions:

- Preserve menu return behavior.
- Preserve pause behavior.
- Preserve active-run behavior.
- Preserve world map selection behavior.
- Preserve ending and game-over controls.
- Ensure buttons update their text and aria state correctly.

## Persistence

Progress is saved through localStorage keys for unlocked level, selected hero, special progress, reward progress, and medal progress.

Rules:

- Always wrap localStorage reads/writes in safe error handling.
- Validate parsed data before using it.
- Clamp numeric progress to valid ranges.
- Preserve old save data whenever possible.
- If the save schema changes, add a migration path and document it here.

## Input

The game supports:

- Keyboard movement
- Jump keys
- Restart key
- Menu/buttons
- Touch controls
- Fullscreen button
- Sound toggle
- Pause button

When changing controls:

- Preserve keyboard and touch parity.
- Keep touch targets usable on small screens.
- Avoid requiring hover.
- Avoid adding hidden gestures as the only way to access a feature.

## Canvas and responsive layout

The canvas is 960x540 internally and displayed inside a responsive 16:9 stage.

Rules:

- Do not change canvas dimensions casually.
- Keep world/camera calculations independent from CSS display size.
- Test desktop and compact mobile layouts after UI changes.
- Avoid placing important HUD elements where mobile controls cover them.

## Assets

Existing asset categories include:

- `assets/backgrounds/`
- `assets/heroes/`
- `assets/enemies/`
- `assets/tiles/`
- `assets/world_map.png`
- `assets/favicon.svg`

When adding assets:

- Use descriptive lowercase names that match existing naming style.
- Put files in the correct asset folder.
- Register new sprite names in `game.js` where assets are loaded.
- Avoid very large unoptimized images.
- Preserve fallback behavior where missing images might otherwise break rendering.

## Audio

Audio is generated with the Web Audio API. Sound is user-toggleable.

Rules:

- Do not autoplay audio before user interaction beyond existing browser-safe behavior.
- Respect `soundOn`.
- Keep sound effects short and gentle.
- Avoid harsh, scary, or startling sounds.
- When adding a new action, consider whether existing sound kinds can be reused first.

## Game logic

Prefer readable helper functions and data-driven level configuration.

When adding mechanics:

- Keep state explicit.
- Keep collision behavior predictable.
- Update rendering and UI feedback together.
- Handle edge cases at screen boundaries, level starts, checkpoints, and goal transitions.
- Avoid making frame-rate-dependent behavior worse.
- Avoid expensive per-frame allocations in hot paths.

## Level data

Levels are defined in `data/levels.js` as JavaScript objects. Continue the existing pattern for:

- `name`
- `theme`
- `chapter`
- `story`
- `tip`
- `success`
- `worldW`
- `start`
- `goal`
- `decor`
- `platforms`
- collectibles, specials, enemies, gates, and other level-specific objects

Keep new level objects readable. Use existing helper constructors when possible.

## Performance

The game should feel smooth on common laptops, tablets, and phones.

Avoid:

- Large loops over unchanged data every frame
- Excessive particle counts
- Repeated image construction during gameplay
- Layout thrashing from frequent DOM writes
- Heavy synchronous work during active play
- Unbounded arrays for effects, particles, or temporary objects

## Accessibility

Current markup includes canvas labeling, aria labels, aria-live HUD regions, and button states.

Preserve and improve:

- Canvas aria label
- HUD readability
- Button labels
- `aria-pressed` on toggle buttons
- Text contrast
- Mobile touch target size
- Keyboard access
- Sound-independent feedback

Do not rely on color alone to communicate critical state.

## Testing and validation

There is no automated test runner at the moment. For now, validation is manual.

When relevant, check:

- Browser console has no new errors.
- `index.html` loads directly.
- Main menu and hero selection work.
- Movement and jumping work.
- Candy collection and extra-life thresholds still work.
- Damage, hearts, lives, checkpoints, restart, and game over work.
- Level completion advances progress.
- World map selection works.
- Side stages remain accessible only as intended.
- Sound, pause, fullscreen, and compact mobile UI work.
- Refreshing preserves progress safely.

If adding a test runner in the future, prioritize pure tests for collision, save parsing, progression unlocking, level data validation, gate timing, and medal conditions.
