# Game Steering

## Game identity

**Candy Quest Kids** is a gentle, story-driven candy platformer for short, approachable play sessions. It begins with a bedtime-story setup: a child discovers an old door inside a closet, enters a candy world, and must cross it before morning to return home.

The game should feel:

- Safe
- Bright
- Storybook-like
- Candy-rich
- Kid-friendly
- Skill-based but forgiving
- More handcrafted adventure than commercial-scale platformer

Avoid making the game feel gritty, mean, scary, hypercompetitive, or overly punishing.

## Current campaign shape

The main campaign has six chapters:

1. Moonlit Meadow / Lollipop Meadow
2. Licorice Lane
3. Frosting Falls
4. Waffle Woods
5. Castle Courtyard Run
6. Closet Door Keep

The campaign includes:

- Boy Explorer and Girl Explorer hero selection
- Five starting lives
- Three hearts per life
- Checkpoints
- Candy collection
- Extra lives every 45 total candy
- Sugar Rush
- Breakable cookie blocks
- Sugar gates and timing gates
- Moving platforms, floating platforms, rafts, bounce pads, and vertical lifts
- Gummy, marshmallow, beetle, and jawbreaker enemies
- Specials, reward progress, medals, side stages, world map flow, and a final story ending

New work should extend this structure rather than replacing it.

## Design pillars

### 1. Storybook platforming

Levels should feel like chapters in a candy-world journey. Mechanics should support the story of moving deeper through a strange but safe candy world.

### 2. Gentle challenge

Challenge should come from readable timing, positioning, and route choice. Avoid cheap hits, blind jumps, sudden impossible enemy placements, or mandatory precision that feels out of step with a kid-friendly campaign.

### 3. Sweet readability

The player should quickly understand:

- Where to go
- What is safe
- What hurts
- What can be collected
- What is interactive
- Why they lost a heart or life
- What changed after collecting specials or rewards

### 4. Juicy feedback

Important actions should have clear visual and/or audio feedback:

- Jumping
- Landing
- Bouncing
- Collecting candy
- Taking damage
- Stomping enemies
- Breaking blocks
- Opening or failing sugar gates
- Collecting specials
- Earning lives, rewards, or medals
- Completing a chapter

### 5. Expandable campaign

Additions should make it easier to add new chapters, hazards, bosses, cutscenes, or side stages without breaking the current game flow.

## Future multi-world campaign

The long-term campaign should support multiple worlds in a classic platformer structure. Each world should feel like a self-contained candy region with its own map, several main levels, optional side stages, rewards, and a clear path to the next world.

When expanding toward multiple worlds:

- Treat the current six-chapter campaign as content that can be wrapped into a first world or split into world-sized groups later.
- Prefer stable world and stage IDs over array indexes for progression.
- Keep each world readable: one main route, optional side routes, and clear unlock messaging.
- Unlock the next world by completing that world's main path, not by requiring optional side-stage mastery.
- Use side stages for optional challenge, specials, medals, and rewards.
- Preserve a final story ending for the overall campaign, while allowing each world to have its own completion moment.

Avoid:

- Making every level its own "world" in naming or UI unless it actually has a map and internal progression.
- Coupling future unlocks to fixed numeric level indexes.
- Requiring all specials or medals to continue the main campaign.
- Adding many new levels before world progression, save migration, and map data are stable.

## Level design rules

When adding or changing a level:

- Give the level a clear theme, story text, success text, and useful tip.
- Start with a safe area where the player can read the level.
- Introduce one main challenge at a time.
- Place enemies where players can see and react to them.
- Avoid blind drops unless they are clearly safe or signposted.
- Put checkpoints before major difficulty spikes.
- Keep candy trails useful as route guidance.
- Make specials optional but discoverable.
- Make the goal visually and spatially obvious.

## Difficulty tuning

Prefer tuning these first:

- Platform spacing
- Enemy patrol range and speed
- Gate timing
- Moving platform speed
- Checkpoint placement
- Candy and extra-life pacing
- Number of hazards in one screen
- Time limit pressure
- Optional special placement

Avoid difficulty changes that make controls less responsive, make collision unclear, or require hidden knowledge.

## Lives, hearts, and recovery

The lives-and-hearts system should feel forgiving. Damage should be understandable and recoverable.

Maintain these principles:

- Three hearts per life should remain readable in the HUD.
- Extra lives from candy should feel rewarding and predictable.
- Checkpoints should reduce frustration on longer chapters.
- Falling or taking damage should communicate clearly what happened.
- Game-over language should encourage retrying rather than scolding.

## Enemies

Enemies are candy-world obstacles, not scary monsters.

Current enemy families:

- Gummy
- Marshmallow
- Beetle
- Jawbreaker

When adding enemies:

- Use a readable silhouette and movement pattern.
- Make the safe interaction obvious if stompable or avoidable.
- Avoid enemies that punish the player before they appear on screen.
- Match speed and patrol range to the surrounding platform layout.
- Keep names and animations candy-appropriate.

## Power-ups and gates

Sugar Rush and sugar gates are core identity systems. They should stay readable and satisfying.

For Sugar Rush:

- The meter should remain visible and understandable.
- Activation or benefit should feel strong but not like an automatic win.
- Audio and visual feedback should clearly indicate the powered state.

For gates:

- Gate state must be readable before the player commits.
- Timing windows should be fair.
- Gate failures should teach timing, not feel random.

## Side stages, medals, and rewards

Side stages and medals should reward mastery without blocking the core story for casual players.

Use side stages for:

- Optional challenge
- Special collection routes
- Medal goals
- Theme variations
- Shorter skill tests

Do not make side-stage mastery required to finish the main story unless the task explicitly changes the campaign structure.

Some side stages may be route-positioned on the world map. Route-positioned side stages appear in the left/right map navigation near the part of the world they branch from once they are unlocked, but they remain optional. They must not block casual main-path progression or next-world unlocks unless a future task explicitly changes that rule.

## Win, ending, and story flow

The final reward ending is part of the game's identity. Preserve the feeling that the player crossed a candy world and returned from an adventure.

When adding story moments:

- Keep text short.
- Use warm, bedtime-story language.
- Avoid interrupting active platforming too often.
- Make chapter completion feel like meaningful progress.
