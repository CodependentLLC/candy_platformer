# Premium Version Plan

## 1. Premium Product Goal

The premium version of Candy Quest Kids is a polished, replayable, app-store-ready version of World 1. It should feel complete before World 2 or major new systems are added.

Premium does not mean bigger first. It means World 1 feels fair, smooth, consistent, readable, rewarding, and dependable across desktop, tablet, and mobile. Players should be able to choose a hero, move through the World 1 path, replay stages, discover optional content, and trust that progress saves and loads safely.

World 1 should feel like a complete candy-platformer campaign with:

- Fair starts, respawns, checkpoints, hazards, and level completion.
- Smooth performance on common phones, tablets, and desktops.
- Theme-consistent art for each level and platform state.
- Clear mobile menus, phone-landscape gameplay, and tablet presentation.
- Rewarding progression through the world map, side stages, specials, medals, and completion moments.

## 2. Premium Quality Pillars

### Fair gameplay

Players should understand why they take damage, lose hearts, fall, restart, or fail a gate. Starts, respawns, checkpoints, enemy placement, pits, and moving platforms must avoid surprise punishment.

### Smooth performance

The game should stay responsive on phones, tablets, and desktop browsers. Heavy canvas effects, particles, filters, and per-frame work should be bounded and lighter on compact or tablet layouts without replacing important art with unclear placeholders.

### Theme-consistent art

Each World 1 level should have a clear visual identity. Platform, obstacle, enemy, candy trail, and background choices should match the level theme in normal, moving, bounce, float, break, hit, and damaged states.

### Strong game feel

Jumping, landing, collecting candy, bouncing, stomping enemies, taking damage, opening gates, finding specials, and completing stages should have clear visual and sound feedback. Effects should feel sweet and responsive without cluttering the screen.

### Polished menus and transitions

Hero select, action menu, World Select, world map entry, pause, restart, ending, and game-over states should feel intentional. Menus must stay centered when they fit and scroll safely when content is taller than the viewport.

### Rewarding level completion

Finishing a stage should clearly communicate progress. Specials, medals, side-stage unlocks, extra lives, and world completion should feel earned but not required for casual main-path completion.

### Clear world progression

The World 1 main path should be visually and mechanically clear. Optional side content should remain optional, and unlock language should make it obvious what opens next.

### Mobile/app readiness

Menus and World Select must work in phone portrait. Active gameplay should be optimized for phone landscape. Touch controls, HUD, safe areas, canvas clarity, orientation guidance, and tablet layout need premium-level validation before packaging work starts.

### Accessibility and readability

Buttons, labels, HUD text, world-map nodes, platform silhouettes, hazards, collectibles, and rewards must remain readable. Important state should not rely on color alone, and keyboard play should remain supported.

### Safe save/load behavior

Existing saves should keep working. localStorage reads and writes should fail gracefully, reset should clear relevant progress, and save schema changes should happen only through explicit migration tasks.

## 3. Current World 1 Path

The intended World 1 main path is:

1. Lollipop Meadow
2. Gummy Grove
3. Pretzel Path
4. Jungle Jelly Run
5. Ice Cream Falls
6. Waffle Woods
7. Cake Courtyard
8. Kingdom Gate

Optional side and bonus content:

- Marshmallow Driftway
- Lantern Lollipop Loop
- Sugar Skyway Sprint
- Morning Star Run

Side and bonus content should reward exploration, specials, medals, and replay mastery without blocking casual World 1 completion unless a future task explicitly changes that rule.

Marshmallow Driftway, Lantern Lollipop Loop, and Sugar Skyway Sprint are optional route-positioned side stages. When they are unlocked, they should appear inline in map navigation near their parent route:

`Meadow -> Grove -> Pretzel -> Jungle -> Drift -> Falls -> Woods -> Loop -> Cake -> Skyway -> Gate`

This route order is for selection readability. It does not make Drift, Loop, or Skyway required main-path stages.

## 4. Premium Feature Roadmap

### Phase 1: Stability and verification

- Keep `npm run smoke` passing.
- Fix boot errors, validation errors, broken script order, and runtime exceptions first.
- Stabilize level/map/world data validation around current World 1.
- Verify start, restart, respawn, checkpoint, pause, save, load, reset, and world-map flows.
- Keep emergency fixes small and avoid polish work during stabilization tasks.

### Phase 2: Presentation polish

- Finish theme-consistent platform and obstacle visuals for all World 1 stages.
- Remove placeholder-looking graphics from normal play when sprite art exists.
- Polish backgrounds, candy trails, map paths, menu layout, HUD readability, and transitions.
- Preserve existing collision and physics while improving visuals.

### Phase 3: Progression and rewards

- Clarify World 1 main-path progression and optional side-stage access.
- Make level completion, world completion, specials, medals, and rewards feel clear and satisfying.
- Keep side stages optional.
- Avoid save schema changes unless a task explicitly introduces a safe migration.

### Phase 4: Game feel and sound

- Improve feedback for jumping, landing, bounce pads, gates, damage, candy collection, specials, enemies, and stage completion.
- Keep sounds gentle, short, and user-toggleable.
- Tune particles and animations so they add clarity without hurting performance.

### Phase 5: Accessibility and mobile/app readiness

- Validate the standard phone, tablet, and desktop viewport matrix.
- Confirm phone portrait menus and World Select are usable.
- Confirm phone landscape gameplay is readable and touch controls do not block critical action.
- Confirm tablet layout and performance are smooth.
- Improve readable labels, contrast, safe-area handling, and keyboard/touch parity.

### Phase 6: Only then prepare World 2

- Prepare World 2 only after World 1 feels complete and stable.
- Confirm world data, map data, progression helpers, validation, and saves are ready for expansion.
- Add new content in small PRs that preserve the current static HTML/CSS/JS setup.

## 5. Definition of Done

Any premium PR should include:

- `npm run smoke`
- Manual browser validation
- Phone portrait menu validation
- Phone landscape gameplay validation
- Tablet validation
- Desktop validation
- Confirmation that no save schema changed unless explicitly requested
- Confirmation that no framework or build step was added unless explicitly requested

For runtime behavior changes, manual notes should include the affected level or flow, browser/device checked, console status, and any save/load impact.

## 6. What Not To Do Yet

- Do not add World 2 yet.
- Do not rewrite `game.js` broadly.
- Do not change save schema casually.
- Do not add dependencies casually.
- Do not package for app stores until World 1 feels complete.
