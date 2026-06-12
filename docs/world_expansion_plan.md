# World Expansion Plan

## Direction

Candy Quest Kids should grow toward a classic platformer campaign structure with multiple worlds. The current campaign should become World 1, then future worlds should unlock one at a time as the player completes each world's main path.

Keep the current static HTML/CSS/JavaScript canvas setup for now. Do not add a framework, bundler, or build step to support world expansion.

## World Model

Each world should have:

- Its own world map.
- Several main levels.
- Optional side stages.
- Optional rewards, medals, or bonus routes.
- Clear unlock messaging.
- A completion moment that opens the next world.

The main campaign path should stay casual-friendly:

- Completing main levels advances through the current world.
- Completing the final main level in a world unlocks the next world.
- Side stages, medals, and full special collection should remain optional unless a future task explicitly changes the campaign structure.

## Current Campaign As World 1

Treat the current six-chapter campaign as World 1 for planning purposes. It can later be kept as a longer first world or split into smaller world-sized groups, but that decision should happen after save data, world data, and map rendering are ready.

Do not add lots of new content before this foundation is stable.

## Save Data Direction

Save data should move away from fixed numeric level indexes and toward stable IDs.

Future save data should use:

- Stable `worldId` values.
- Stable `stageId` values.
- Versioned save schema.
- A migration path from the current localStorage keys.

Recommended long-term shape:

```js
{
  version: 2,
  selectedHero: 'boy',
  currentWorldId: 'world-1',
  unlockedWorldIds: ['world-1'],
  unlockedStageIds: ['world-1-level-1'],
  completedStageIds: [],
  specialsByStageId: {},
  medalsByStageId: {},
  rewardsByWorldId: {}
}
```

## Data Direction

World expansion should live in `data/` as plain browser scripts with stable `window.CandyQuest*` exports.

Recommended data groups:

- `WORLDS`: world definitions, order, maps, stage lists, rewards, and next-world unlock rules.
- `STAGES`: stage definitions keyed by stable stage ID.
- `WORLD_MAPS`: per-world map nodes and visual metadata.
- `UNLOCK_RULES`: small explicit unlock descriptions where needed.

Avoid tying new world progression to array offsets like `levelIndex + 1`.

## Implementation Order

1. Add versioned save data and migrate existing progress safely.
2. Add stable stage IDs while preserving current gameplay behavior.
3. Add a `WORLDS` data structure that wraps the existing campaign as World 1.
4. Update progression helpers to resolve by world and stage IDs.
5. Make world-map rendering consume world map data.
6. Add validation checks for world IDs, stage IDs, map nodes, and unlock rules.
7. Add the next world only after the first-world model is stable.

## Review Bar

World expansion PRs should include:

- `npm run smoke` results when tooling is available.
- Manual validation notes for map selection and level start.
- Save/load notes when persistence changes.
- Compact/mobile notes when map UI or touch behavior changes.

Keep PRs small. Avoid combining save migration, map rendering changes, and new content in one large change.
