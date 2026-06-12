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

Future world expansion should also live in `data/` as plain browser-script data. Prefer structures that separate:

- world definitions
- world-map nodes
- stage definitions
- side-stage unlock rules
- world rewards
- campaign unlock rules

Use stable IDs such as `worldId`, `stageId`, and `nodeId` for new progression data. Avoid adding new save or unlock behavior that depends on fixed array offsets.

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
- Before multi-world progression ships, introduce versioned save data and migrate current level-index progress safely.
- New world/stage progress should be keyed by stable IDs rather than array indexes.

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
- Menus, hero selection, action menu, reset progress, and World Select must work in phone portrait.
- Active gameplay is optimized for phone landscape, while portrait phone gameplay may show a rotate hint.
- Touch controls must not overlap critical HUD, hazards, player position, or required gameplay reads.
- World-map labels, nodes, selected markers, locked states, and play/start affordances must remain readable on mobile.

Standard viewport matrix for responsive validation:

- `375x667` phone portrait
- `390x844` phone portrait
- `667x375` phone landscape
- `844x390` phone landscape
- `768x1024` tablet portrait
- `1024x768` tablet landscape
- `1366x768` desktop

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

## World data

Future multiple-world support should be data-driven before adding lots of new content.

Recommended shape:

- `WORLDS`: ordered world definitions with `id`, `name`, `map`, `stages`, `sideStages`, rewards, and next-world unlock rules.
- `STAGES`: stage definitions keyed by stable `stageId`, with each stage pointing to its `worldId`.
- `map.nodes`: per-world map nodes that point to `stageId` and describe position, labels, icons, and unlock requirements.
- `unlock` objects: explicit rules such as completing a stage, completing a world main path, or finding specials in a world.

Rules:

- Keep `data/` files as plain browser scripts with stable `window.CandyQuest*` exports.
- Do not convert data files to modules or add a bundler for world expansion.
- Keep current flat `LEVELS` compatibility until save migration and map rendering are safely adapted.
- Add validation for world/stage data before relying on it for new content.

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

The project has smoke checks, not a full automated gameplay test suite. Use smoke checks for boot and syntax coverage, then validate runtime behavior manually.

Run when relevant:

- `npm run smoke:syntax` for JavaScript syntax checks.
- `npm run smoke:browser` for static-server page boot, key DOM elements, and uncaught boot errors.
- `npm run smoke` before handing off a runtime or tooling change when a Chromium-family browser is available.

When relevant, check:

- Browser console has no new errors.
- `index.html` loads directly.
- Main menu and hero selection work.
- Menus and World Select work in phone portrait.
- Movement and jumping work.
- Active gameplay is readable in phone landscape.
- Candy collection and extra-life thresholds still work.
- Damage, hearts, lives, checkpoints, restart, and game over work.
- Level completion advances progress.
- World map selection works, and labels/nodes remain readable on mobile.
- Side stages remain accessible only as intended.
- Touch controls do not overlap critical HUD or gameplay.
- Sound, pause, fullscreen, and compact mobile UI work.
- Refreshing preserves progress safely.

For runtime behavior changes, reviewers should ask for both smoke-check results and manual validation notes. Include browser/device tested, affected flow, console status, save/load notes when persistence is touched, and compact/mobile notes when UI or touch behavior is touched.

If adding a test runner in the future, prioritize pure tests for collision, save parsing, progression unlocking, level data validation, gate timing, and medal conditions.
