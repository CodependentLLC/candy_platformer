# Code Review Instructions

Use this checklist when reviewing changes to **Candy Quest Kids**.

## Product fit

Check whether the change preserves the game's identity:

- Does it still feel like a friendly candy platformer?
- Does it support the bedtime-story candy-world premise?
- Is the challenge gentle, readable, and fair?
- Is player-facing text warm and family-friendly?
- Does it avoid scary, harsh, or overly complex content?

## Architecture

Check whether the change respects the current static-browser architecture:

- Does `index.html` still load directly in a browser?
- Did the change avoid unnecessary frameworks, build tools, and dependencies?
- Are `index.html`, `style.css`, and `game.js` responsibilities preserved?
- Are DOM IDs and JavaScript references kept in sync?
- Is the change focused rather than a broad rewrite?

## Gameplay

For gameplay changes, check:

- Can the player understand the goal?
- Are hazards visible before they punish the player?
- Are collisions predictable?
- Are checkpoints placed fairly?
- Do hearts, lives, damage, restart, and game over still work?
- Do candy collection and extra-life thresholds still work?
- Do Sugar Rush, gates, enemies, and moving platforms still behave clearly?
- Can the player complete the affected level?
- Are side stages, medals, and reward progress still optional unless intentionally changed?

## Level data

For level edits, check:

- `name`, `theme`, `chapter`, `story`, `tip`, and `success` are present where appropriate.
- `worldW`, `start`, and `goal` are valid.
- Platforms and hazards fit the camera and player movement.
- Candy trails guide movement rather than cluttering the level.
- Specials are discoverable but not required for casual completion.
- Enemy ranges and speeds fit the available platform space.
- Difficulty increases through readable combinations, not surprise punishment.

## UI and responsive layout

For UI/CSS changes, check:

- Desktop HUD is readable.
- Compact/mobile HUD does not overlap essential controls.
- Touch controls remain usable.
- Safe-area inset handling is preserved.
- Buttons remain large enough to tap.
- Menu, map, play, ending, and game-over modes update visible UI correctly.
- Fullscreen behavior still works.

## Accessibility

Check:

- Button labels are understandable.
- Toggle buttons update `aria-pressed` where relevant.
- HUD changes remain readable.
- Critical information is not conveyed by color alone.
- Sound is not required to understand success, danger, or progression.
- Keyboard play remains supported.

## Persistence

For save/progression changes, check:

- localStorage reads are guarded.
- Parsed data is validated.
- Numeric values are clamped.
- Old save data still works or is migrated.
- Reset Progress clears all relevant progress keys.
- Refreshing the page does not corrupt progress.

## Performance

Check for hot-path risks:

- New image objects are not created every frame.
- DOM writes are not excessive during gameplay.
- Particle/effect arrays are bounded or cleaned up.
- Collision loops remain reasonable.
- No heavy synchronous work runs during active play.
- Mobile performance is considered.

## Audio

Check:

- New sounds respect `soundOn`.
- Audio remains browser-safe and user-toggleable.
- Sounds are short, gentle, and candy-appropriate.
- Important interactions have feedback, but not overwhelming noise.

## Manual test notes

Because there is currently no automated test runner, reviewers should ask for manual validation notes when the change affects runtime behavior.

Useful validation requests:

- Browser and device tested
- Level or flow tested
- Whether console errors appeared
- Whether save data was tested with fresh and existing localStorage
- Whether compact/mobile mode was checked

## Risk flags

Call out changes that:

- Add dependencies
- Add a build step
- Change canvas size
- Change save schema
- Change core player physics
- Change collision behavior
- Change level progression
- Change reward, medal, or side-stage unlock logic
- Remove accessibility affordances
- Remove mobile support
- Replace sprite-driven rendering with placeholders
