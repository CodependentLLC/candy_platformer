import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);

function loadBrowserScript(path) {
  vm.runInContext(readFileSync(path, 'utf8'), context, { filename: path });
}

loadBrowserScript('data/shapes.js');
loadBrowserScript('data/levels.js');
loadBrowserScript('data/worlds.js');
loadBrowserScript('data/world-map.js');

const { LEVELS, BONUS_STAGES } = context.window.CandyQuestLevels || {};
const { WORLDS } = context.window.CandyQuestWorlds || {};
const {
  WORLD_MAPS,
  WORLD_MAP_NODES,
  WORLD_MAP_BRANCH_NODES,
  WORLD_MAP_BONUS_NODE,
  MAP_NODE_BRANCH_OFFSET,
  MAP_NODE_BONUS
} = context.window.CandyQuestMap || {};

const PLAYER_H = 56;
const GOAL_W = 48;
const GOAL_H = 102;
const ENEMY_FOOT_TOLERANCE = 28;
const START_SNAP_TOLERANCE = 18;
const GOAL_SPACE_DISTANCE = 130;
const CANDY_GAP_LIMIT = 420;
const PLATFORM_SIDE_TOLERANCE = 24;
const STAGE_ID_PATTERN = /^world-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ignoredSupportKinds = new Set(['sugarGate', 'blinkGate', 'break']);
const failures = [];
const warnings = [];

function fail(stage, message) {
  failures.push(`${stage.label}: ${message}`);
}

function failGlobal(message) {
  failures.push(message);
}

function warnGlobal(message) {
  warnings.push(message);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkNumber(label, value) {
  if (!isNumber(value)) failGlobal(`${label} must be a finite number.`);
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

function checkStageIds(stages) {
  const seen = new Map();
  for (const stage of stages) {
    if (typeof stage.id !== 'string' || !stage.id) {
      fail(stage, 'missing stable stage id.');
      continue;
    }
    if (!STAGE_ID_PATTERN.test(stage.id)) {
      fail(stage, `stage id "${stage.id}" must be stable kebab-case.`);
    }
    if (seen.has(stage.id)) {
      fail(stage, `stage id "${stage.id}" duplicates ${seen.get(stage.id)}.`);
    } else {
      seen.set(stage.id, stage.label);
    }
  }
  return seen;
}

function checkWorldData(stageIds, mapIds = new Set()) {
  if (!Array.isArray(WORLDS)) {
    failGlobal('CandyQuestWorlds.WORLDS must be an array.');
    return;
  }
  const worldIds = new Set();
  for (const world of WORLDS) {
    const label = `World ${world?.id || '(missing id)'}`;
    if (!world || typeof world !== 'object') {
      failGlobal('World entry must be an object.');
      continue;
    }
    if (typeof world.id !== 'string' || !world.id) failGlobal(`${label}: missing id.`);
    else if (worldIds.has(world.id)) failGlobal(`${label}: duplicate world id.`);
    else worldIds.add(world.id);
    for (const key of ['name', 'shortName', 'description', 'mapId']) {
      if (typeof world[key] !== 'string' || !world[key]) failGlobal(`${label}: missing ${key}.`);
    }
    if (world.mapId && mapIds.size > 0 && !mapIds.has(world.mapId)) {
      failGlobal(`${label}: references unknown map id "${world.mapId}".`);
    }
    for (const key of ['mainStageIds', 'sideStageIds']) {
      if (!Array.isArray(world[key])) {
        failGlobal(`${label}: ${key} must be an array.`);
        continue;
      }
      for (const stageId of world[key]) {
        if (!stageIds.has(stageId)) failGlobal(`${label}: ${key} references unknown stage id "${stageId}".`);
      }
    }
    if (!world.unlock || typeof world.unlock !== 'object') {
      failGlobal(`${label}: missing unlock rule.`);
    } else if (typeof world.unlock.type !== 'string' || !world.unlock.type) {
      failGlobal(`${label}: unlock rule is missing type.`);
    }
  }
}

function checkMapData(stageIds) {
  const combinedStages = [
    ...(Array.isArray(LEVELS) ? LEVELS : []),
    ...(Array.isArray(BONUS_STAGES) ? BONUS_STAGES : [])
  ];

  function checkMainMapStageReference(node, nodeLabel, index) {
    if (node.stageId && !stageIds.has(node.stageId)) {
      failGlobal(`${nodeLabel}: references unknown stage id "${node.stageId}".`);
    }
    if (node.stageIndex !== undefined) {
      if (!Number.isInteger(node.stageIndex) || node.stageIndex < 0 || node.stageIndex >= combinedStages.length) {
        failGlobal(`${nodeLabel}: stageIndex must reference a valid stage.`);
      }
      return;
    }
    const inferredStage = LEVELS[index];
    if (!node.stageId && !inferredStage) failGlobal(`${nodeLabel}: has no matching main level stage.`);
  }

  if (!WORLD_MAPS || typeof WORLD_MAPS !== 'object' || Array.isArray(WORLD_MAPS)) {
    failGlobal('CandyQuestMap.WORLD_MAPS must be an object keyed by map id.');
  }
  if (!Array.isArray(WORLD_MAP_NODES)) failGlobal('CandyQuestMap.WORLD_MAP_NODES must be an array.');
  if (!Array.isArray(WORLD_MAP_BRANCH_NODES)) failGlobal('CandyQuestMap.WORLD_MAP_BRANCH_NODES must be an array.');
  if (!WORLD_MAP_BONUS_NODE || typeof WORLD_MAP_BONUS_NODE !== 'object') failGlobal('CandyQuestMap.WORLD_MAP_BONUS_NODE must be an object.');
  checkNumber('CandyQuestMap.MAP_NODE_BRANCH_OFFSET', MAP_NODE_BRANCH_OFFSET);
  checkNumber('CandyQuestMap.MAP_NODE_BONUS', MAP_NODE_BONUS);
  if (!Array.isArray(WORLD_MAP_NODES) || !Array.isArray(WORLD_MAP_BRANCH_NODES) || !WORLD_MAP_BONUS_NODE) {
    return { mapIds: new Set(), mapNodeCount: 0 };
  }

  const mapEntries = WORLD_MAPS && typeof WORLD_MAPS === 'object' && !Array.isArray(WORLD_MAPS)
    ? Object.entries(WORLD_MAPS)
    : [];
  if (mapEntries.length === 0) failGlobal('CandyQuestMap.WORLD_MAPS must define at least one map.');

  const mapIds = new Set();
  let mapNodeCount = 0;
  for (const [mapKey, map] of mapEntries) {
    const label = `World map ${mapKey}`;
    if (!map || typeof map !== 'object') {
      failGlobal(`${label}: map entry must be an object.`);
      continue;
    }
    if (typeof map.mapId !== 'string' || !map.mapId) failGlobal(`${label}: missing mapId.`);
    else if (map.mapId !== mapKey) failGlobal(`${label}: mapId must match its WORLD_MAPS key.`);
    else mapIds.add(map.mapId);
    if (!Array.isArray(map.mainNodes)) failGlobal(`${label}: mainNodes must be an array.`);
    if (!Array.isArray(map.branchNodes)) failGlobal(`${label}: branchNodes must be an array.`);
    if (!map.bonusNode || typeof map.bonusNode !== 'object') failGlobal(`${label}: bonusNode must be an object.`);
    const mainNodes = Array.isArray(map.mainNodes) ? map.mainNodes : [];
    const branchNodes = Array.isArray(map.branchNodes) ? map.branchNodes : [];
    mainNodes.forEach((node, index) => {
      const nodeLabel = `${label} main node ${index}`;
      checkMainMapStageReference(node, nodeLabel, index);
      for (const key of ['x', 'y', 'mobileX', 'mobileY']) checkNumber(`${nodeLabel}.${key}`, node[key]);
    });
    branchNodes.forEach((node, index) => {
      const nodeLabel = `${label} branch node ${index}`;
      if (!Number.isInteger(node.levelIndex) || node.levelIndex < 0 || node.levelIndex >= LEVELS.length) {
        failGlobal(`${nodeLabel}: levelIndex must reference a valid main level.`);
      }
      if (node.levelIndex >= BONUS_STAGES.length - 1) {
        failGlobal(`${nodeLabel}: levelIndex does not map to a current side stage.`);
      }
      if (node.stageId && !stageIds.has(node.stageId)) failGlobal(`${nodeLabel}: references unknown stage id "${node.stageId}".`);
      for (const key of ['x', 'y', 'mobileX', 'mobileY']) checkNumber(`${nodeLabel}.${key}`, node[key]);
    });
    if (map.bonusNode && typeof map.bonusNode === 'object') {
      for (const key of ['x', 'y', 'mobileX', 'mobileY']) checkNumber(`${label} bonus node.${key}`, map.bonusNode[key]);
    }
    mapNodeCount += (Array.isArray(map.mainNodes) ? map.mainNodes.length : 0)
      + (Array.isArray(map.branchNodes) ? map.branchNodes.length : 0)
      + (map.bonusNode && typeof map.bonusNode === 'object' ? 1 : 0);
  }

  WORLD_MAP_NODES.forEach((node, index) => {
    const label = `World map main node ${index}`;
    checkMainMapStageReference(node, label, index);
    for (const key of ['x', 'y', 'mobileX', 'mobileY']) checkNumber(`${label}.${key}`, node[key]);
    if (!isNumber(node.mobileLabelDy)) warnGlobal(`${label}: missing numeric mobileLabelDy.`);
  });

  WORLD_MAP_BRANCH_NODES.forEach((node, index) => {
    const label = `World map branch node ${index}`;
    if (!Number.isInteger(node.levelIndex) || node.levelIndex < 0 || node.levelIndex >= LEVELS.length) {
      failGlobal(`${label}: levelIndex must reference a valid main level.`);
    }
    if (node.levelIndex >= BONUS_STAGES.length - 1) {
      failGlobal(`${label}: levelIndex does not map to a current side stage.`);
    }
    if (node.stageId && !stageIds.has(node.stageId)) failGlobal(`${label}: references unknown stage id "${node.stageId}".`);
    for (const key of ['x', 'y', 'mobileX', 'mobileY']) checkNumber(`${label}.${key}`, node[key]);
  });

  for (const key of ['x', 'y', 'mobileX', 'mobileY']) checkNumber(`World map bonus node.${key}`, WORLD_MAP_BONUS_NODE[key]);
  return { mapIds, mapNodeCount };
}

function checkStageCoordinates(stage) {
  if (stage.start) {
    checkNumber(`${stage.label}: start.x`, stage.start.x);
    checkNumber(`${stage.label}: start.y`, stage.start.y);
  }
  if (stage.goal) {
    checkNumber(`${stage.label}: goal.x`, stage.goal.x);
    checkNumber(`${stage.label}: goal.y`, stage.goal.y);
  }
  (stage.platforms || []).forEach((platform, index) => {
    for (const key of ['x', 'y', 'w', 'h']) checkNumber(`${stage.label}: platform ${index}.${key}`, platform[key]);
    for (const key of ['minX', 'maxX', 'minY', 'maxY', 'speed']) {
      if (platform[key] !== undefined) checkNumber(`${stage.label}: platform ${index}.${key}`, platform[key]);
    }
  });
  (stage.enemies || []).forEach((enemy, index) => {
    for (const key of ['x', 'y', 'w', 'h']) checkNumber(`${stage.label}: enemy ${index}.${key}`, enemy[key]);
  });
  (stage.specials || []).forEach((special, index) => {
    checkNumber(`${stage.label}: special ${index}.x`, special[1]);
    checkNumber(`${stage.label}: special ${index}.y`, special[2]);
  });
  (stage.candies || []).forEach((candy, index) => {
    checkNumber(`${stage.label}: candy ${index}.x`, candy[1]);
    checkNumber(`${stage.label}: candy ${index}.y`, candy[2]);
  });
}

const stages = stageList();
const stageIds = checkStageIds(stages);
const mapSummary = checkMapData(stageIds);
checkWorldData(stageIds, mapSummary.mapIds);

for (const stage of stages) {
  checkStageCoordinates(stage);
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

for (const message of warnings) console.warn(`Warning: ${message}`);
console.log(`Data validation passed for ${LEVELS.length + BONUS_STAGES.length} stages, ${WORLDS.length} world(s), and ${mapSummary.mapNodeCount} map node(s). ${warnings.length} warning(s).`);
