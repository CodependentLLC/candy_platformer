import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);

function loadBrowserScript(path) {
  vm.runInContext(readFileSync(path, 'utf8'), context, { filename: path });
}

loadBrowserScript('data/shapes.js');
loadBrowserScript('data/levels.js');

const { LEVELS, BONUS_STAGES } = context.window.CandyQuestLevels || {};

const PLAYER_H = 56;
const GOAL_W = 48;
const GOAL_H = 102;
const ENEMY_FOOT_TOLERANCE = 28;
const START_SNAP_TOLERANCE = 18;
const GOAL_SPACE_DISTANCE = 130;
const CANDY_GAP_LIMIT = 420;
const PLATFORM_SIDE_TOLERANCE = 24;

const ignoredSupportKinds = new Set(['sugarGate', 'blinkGate', 'break']);
const failures = [];

function fail(stage, message) {
  failures.push(`${stage.label}: ${message}`);
}

function stageList() {
  if (!Array.isArray(LEVELS)) throw new Error('CandyQuestLevels.LEVELS must be an array.');
  if (!Array.isArray(BONUS_STAGES)) throw new Error('CandyQuestLevels.BONUS_STAGES must be an array.');
  return [
    ...LEVELS.map((level, index) => ({ ...level, label: `Level ${index + 1} (${level.name || 'unnamed'})` })),
    ...BONUS_STAGES.map((level, index) => ({ ...level, label: `Bonus ${index + 1} (${level.name || 'unnamed'})` }))
  ];
}

function supportPlatforms(stage) {
  return (stage.platforms || []).filter(platform => platform && !ignoredSupportKinds.has(platform.kind));
}

function platformXRange(platform) {
  const minX = Math.min(platform.x, platform.minX ?? platform.x);
  const maxX = Math.max(platform.x + platform.w, (platform.maxX ?? platform.x) + platform.w);
  return [minX, maxX];
}

function platformTopRange(platform) {
  if (typeof platform.minY === 'number' && typeof platform.maxY === 'number') {
    return [Math.min(platform.y, platform.minY, platform.maxY), Math.max(platform.y, platform.minY, platform.maxY)];
  }
  return [platform.y, platform.y];
}

function horizontallyOverlaps(rect, platform, tolerance = 0) {
  const [minX, maxX] = platformXRange(platform);
  return rect.x + rect.w >= minX - tolerance && rect.x <= maxX + tolerance;
}

function nearestPlatformTop(stage, rect, feetY) {
  let nearest = null;
  for (const platform of supportPlatforms(stage)) {
    if (!horizontallyOverlaps(rect, platform, PLATFORM_SIDE_TOLERANCE)) continue;
    const [topMin, topMax] = platformTopRange(platform);
    const verticalDistance = feetY < topMin ? topMin - feetY : feetY > topMax ? feetY - topMax : 0;
    if (!nearest || verticalDistance < nearest.distance) nearest = { platform, distance: verticalDistance };
  }
  return nearest;
}

function distanceToPlatformSpace(stage, rect, feetY) {
  let nearest = null;
  for (const platform of supportPlatforms(stage)) {
    const [minX, maxX] = platformXRange(platform);
    const [topMin, topMax] = platformTopRange(platform);
    const centerX = rect.x + rect.w / 2;
    const dx = centerX < minX ? minX - centerX : centerX > maxX ? centerX - maxX : 0;
    const dy = feetY < topMin ? topMin - feetY : feetY > topMax ? feetY - topMax : 0;
    const distance = Math.hypot(dx, dy);
    if (!nearest || distance < nearest.distance) nearest = { platform, distance };
  }
  return nearest;
}

function checkEnemyStarts(stage) {
  for (const enemy of stage.enemies || []) {
    const enemyRect = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
    const enemyFeetY = enemy.y + enemy.h;
    const nearest = nearestPlatformTop(stage, enemyRect, enemyFeetY);

    for (const platform of supportPlatforms(stage)) {
      const platformRect = { x: platform.x, y: platform.y, w: platform.w, h: platform.h };
      const overlaps = enemyRect.x < platformRect.x + platformRect.w
        && enemyRect.x + enemyRect.w > platformRect.x
        && enemyRect.y < platformRect.y + platformRect.h
        && enemyRect.y + enemyRect.h > platformRect.y;
      if (overlaps && enemyFeetY > platform.y + 6 && (!nearest || nearest.distance > ENEMY_FOOT_TOLERANCE)) {
        fail(stage, `enemy ${enemy.kind} at (${enemy.x}, ${enemy.y}) appears inside ${platform.kind} platform at (${platform.x}, ${platform.y}).`);
      }
    }

    if (!nearest || nearest.distance > ENEMY_FOOT_TOLERANCE) {
      fail(stage, `enemy ${enemy.kind} at (${enemy.x}, ${enemy.y}) feet are not near a platform top.`);
    }
  }
}

function checkCandyGaps(stage) {
  const candies = [...(stage.candies || [])].sort((a, b) => a[1] - b[1]);
  for (let i = 1; i < candies.length; i += 1) {
    const previous = candies[i - 1];
    const current = candies[i];
    const gap = current[1] - previous[1];
    if (gap > CANDY_GAP_LIMIT) {
      fail(stage, `candy gap of ${gap}px between (${previous[1]}, ${previous[2]}) and (${current[1]}, ${current[2]}) is unusually large.`);
    }
  }
}

function checkPlayerStart(stage) {
  if (!stage.start) {
    fail(stage, 'missing player start.');
    return;
  }
  const playerRect = { x: stage.start.x, y: stage.start.y, w: 34, h: PLAYER_H };
  const nearest = nearestPlatformTop(stage, playerRect, stage.start.y + PLAYER_H);
  if (!nearest || nearest.distance > START_SNAP_TOLERANCE) {
    fail(stage, `player start at (${stage.start.x}, ${stage.start.y}) does not snap to nearby ground.`);
  }
}

function checkGoal(stage) {
  if (!stage.goal) {
    fail(stage, 'missing goal.');
    return;
  }
  const goalRect = { x: stage.goal.x, y: stage.goal.y, w: GOAL_W, h: GOAL_H };
  const nearest = distanceToPlatformSpace(stage, goalRect, stage.goal.y + GOAL_H);
  if (!nearest || nearest.distance > GOAL_SPACE_DISTANCE) {
    fail(stage, `goal at (${stage.goal.x}, ${stage.goal.y}) is not near reachable platform space.`);
  }
}

for (const stage of stageList()) {
  checkEnemyStarts(stage);
  checkCandyGaps(stage);
  checkPlayerStart(stage);
  checkGoal(stage);
}

if (failures.length > 0) {
  console.error(`Level validation failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Level validation passed for ${LEVELS.length + BONUS_STAGES.length} stages.`);
