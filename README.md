# Candy Quest Kids

A browser-based candy platformer campaign with a bedtime story setup: a child wakes up, finds an old door inside the closet, and gets pulled into a candy world they have to cross before morning to get back home.

## What Changed
- Rebased the game around the stronger sprite-driven build
- Expanded the campaign from 3 short levels to 6 longer chapters
- Added a full story hook and chapter-by-chapter story text
- Added a lives-and-hearts system
- Added extra lives every 45 candy collected
- Increased difficulty through longer maps, denser enemy placement, more moving platforms, and multiple sugar-gate sections
- Added a final reward ending instead of stopping at a plain victory panel

## Campaign Flow
1. Moonlit Meadow
2. Licorice Lane
3. Frosting Falls
4. Waffle Woods
5. Castle Courtyard Run
6. Closet Door Keep

## Core Systems
- Hero select: Boy Explorer or Girl Explorer
- 5 starting lives
- 3 hearts per life
- Checkpoints
- Sugar Rush power-up
- Breakable cookie blocks
- Sugar gates that require meter timing
- Gummy, marshmallow, beetle, and jawbreaker enemies
- End-of-campaign story ending

## How To Run
1. Open `index.html` in a modern browser.
2. Pick a hero.
3. Choose a starting chapter if needed.
4. Click `Open The Door`.

Optional local server:

```sh
npm run serve
```

Smoke check:

```sh
npm run smoke
```

The browser smoke test uses a locally installed Chromium-family browser. If it cannot find one automatically, set `BROWSER_BIN` to the browser executable path.

## Controls
- Move: Left / Right arrows or A / D
- Jump: Space, Up Arrow, or W
- Restart current level: R or `Restart Level`
- Return to menu after ending/game over: Enter or `Choose Hero`

## Manual QA
Before adding new levels, open `index.html` and confirm these core flows still work:

- Choose both heroes from hero select.
- Start Adventure enters the first playable level.
- World Map opens and selects unlocked worlds.
- Side Stages opens and shows available side routes.
- World 1 map keeps optional side stages route-positioned when unlocked: Drift after Jungle, Loop after Woods, and Skyway before Gate.
- Optional side stages remain skippable; casual main progression can still reach Gate without requiring Drift, Loop, or Skyway completion.
- Touch controls move and jump on a small or touch viewport.
- Sound toggle switches sound on and off.
- Fullscreen enters and exits cleanly.
- Pause stops and resumes active play.
- Restart reloads the current level.
- Refresh the page and confirm saved hero/progress load safely.

## Notes
This is still a handcrafted indie-sized campaign, not a full commercial Mario-scale production. The structure is now much closer to a real story mode and is set up so more chapters, hazards, bosses, and cutscenes can be added without changing the core architecture.
