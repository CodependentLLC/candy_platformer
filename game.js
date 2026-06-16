(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const menuButton = document.getElementById('menuButton');
  const heroButton = document.getElementById('heroButton');
  const menuOverlay = document.getElementById('menuOverlay');
  const resumeButton = document.getElementById('resumeButton');
  const startButton = document.getElementById('startButton');
  const mapButton = document.getElementById('mapButton');
  const sideStagesButton = document.getElementById('sideStagesButton');
  const resetProgressButton = document.getElementById('resetProgressButton');
  const menuBoyButton = document.getElementById('menuBoyButton');
  const menuGirlButton = document.getElementById('menuGirlButton');
  const menuHeroView = document.getElementById('menuHeroView');
  const menuActionView = document.getElementById('menuActionView');
  const menuWorldView = document.getElementById('menuWorldView');
  const menuSelectedHeroText = document.getElementById('menuSelectedHeroText');
  const backToHeroButton = document.getElementById('backToHeroButton');
  const backToActionsButton = document.getElementById('backToActionsButton');
  const worldOneButton = document.getElementById('worldOneButton');
  const soundButton = document.getElementById('soundButton');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const pauseButton = document.getElementById('pauseButton');
  const hudLevelName = document.getElementById('hudLevelName');
  const hudLevelValue = document.getElementById('hudLevelValue');
  const hudCandyValue = document.getElementById('hudCandyValue');
  const hudTotalValue = document.getElementById('hudTotalValue');
  const hudHeartsValue = document.getElementById('hudHeartsValue');
  const hudLivesValue = document.getElementById('hudLivesValue');
  const hudTimeValue = document.getElementById('hudTimeValue');
  const hudSpecialsValue = document.getElementById('hudSpecialsValue');
  const hudSugarFill = document.getElementById('hudSugarFill');
  const hudTipText = document.getElementById('hudTipText');
  const hudLifeText = document.getElementById('hudLifeText');
  const hudChapterText = document.getElementById('hudChapterText');
  const touch = { left: false, right: false };
  const keys = new Set();

  let selectedHero = 'boy';
  let jumpPressed = false;
  let time = 0;
  let cameraX = 0;
  let shake = 0;
  let levelIndex = 0;
  let WORLD_W = 2200;
  let totalCandy = 0;
  let nextExtraLifeAt = 45;
  const levelTimeLimit = 60 * 60;
  let levelTimer = levelTimeLimit;
  let soundOn = true;
  let audioCtx = null;
  let musicState = '';
  let musicNextNoteTime = 0;
  let musicStep = 0;
  let footstepCooldown = 0;
  let gameState = 'playing';
  let winTimer = 0;
  let storyTimer = 0;
  let endingTimer = 0;
  let escapeTimer = 0;
  let loopStarted = false;
  let introTimer = 0;
  let paused = false;
  let mapLevelIndex = 0;
  let mapPulse = 0;
  let mapMoveCooldown = 0;
  let mapRevealTimer = 0;
  let mapMarkerFromIndex = 0;
  let mapMarkerToIndex = 0;
  let mapMarkerProgress = 1;
  let mapArrivalTimer = 0;
  let mapBranchHintTimer = 0;
  const saveKey = 'candy-platformer-unlocked-level';
  const heroSaveKey = 'candy-platformer-selected-hero';
  const specialSaveKey = 'candy-platformer-special-progress';
  const rewardSaveKey = 'candy-platformer-reward-progress';
  const medalSaveKey = 'candy-platformer-medal-progress';
  const versionedSaveKey = 'candy-platformer-save-v1';
  const currentSaveVersion = 1;
  const currentWorldId = 'world-1';
  // These legacy keys remain the source of truth until progression moves to stable world/stage IDs.
  const legacyProgressSaveKeys = [saveKey, specialSaveKey, rewardSaveKey, medalSaveKey];
  let unlockedLevel = 0;
  let hasActiveRun = false;
  let menuReturnState = 'map';
  let menuStep = 'hero';
  let canvasProfileReady = false;
  let compactCanvasCached = false;
  let coarsePointerCached = false;
  let tabletCanvasCached = false;
  let reducedEffectsActive = false;
  const hudCache = {};

  const assets = {};
  const worldMapBackground = new Image();
  worldMapBackground.src = 'assets/world_map.png';
  const backgroundFiles = {
    meadow: 'lollipop.png',
    licorice: 'pretzel.png',
    falls: 'icecream.png',
    woods: 'wafflewoods.png',
    courtyard: 'cake.png',
    keep: 'kingdom.png',
    gummy: 'gummy.png',
    jungle: 'jungle.png',
    mallows: 'mallows.png',
    lollipops: 'lollipops.png',
    sky: 'background.png'
  };
  const backgroundImages = Object.fromEntries(
    Object.entries(backgroundFiles).map(([theme, file]) => {
      const img = new Image();
      img.src = `assets/backgrounds/${file}`;
      return [theme, img];
    })
  );
  const backgroundImageList = Object.values(backgroundImages);

  function updateFullscreenButton() {
    const active = document.fullscreenElement === canvas.parentElement;
    fullscreenButton.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
    fullscreenButton.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function updatePauseButton() {
    const compact = isMobileCanvas();
    if (gameState === 'gameover') {
      pauseButton.textContent = compact ? 'Reset' : 'Reset All';
      pauseButton.setAttribute('aria-pressed', 'false');
      return;
    }
    if (gameState === 'ending') {
      pauseButton.textContent = compact ? 'Again' : 'Play Again';
      pauseButton.setAttribute('aria-pressed', 'false');
      return;
    }
    const isMap = gameState === 'map';
    pauseButton.textContent = isMap ? (compact ? 'Go' : 'Play') : (paused ? (compact ? 'Go' : 'Resume') : (compact ? 'II' : 'Pause'));
    pauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }

  function updateHeroButton() {
    const compact = isMobileCanvas();
    if (compact) heroButton.textContent = selectedHero === 'boy' ? 'Boy' : 'Girl';
    else heroButton.textContent = selectedHero === 'boy' ? 'Hero: Boy' : 'Hero: Girl';
    heroButton.setAttribute('aria-label', selectedHero === 'boy' ? 'Switch hero, current hero is boy' : 'Switch hero, current hero is girl');
    menuBoyButton.classList.toggle('active', selectedHero === 'boy');
    menuGirlButton.classList.toggle('active', selectedHero === 'girl');
    menuSelectedHeroText.textContent = selectedHero === 'boy' ? 'Hero: Boy' : 'Hero: Girl';
  }

  function updateMenuButtons() {
    const resumable = hasActiveRun && ['playing', 'map'].includes(menuReturnState);
    resumeButton.disabled = !resumable;
  }

  function updateMenuStep() {
    const heroScreen = menuStep === 'hero';
    const worldScreen = menuStep === 'world';
    const actionScreen = !heroScreen && !worldScreen;
    menuHeroView.hidden = !heroScreen;
    menuActionView.hidden = !actionScreen;
    menuWorldView.hidden = !worldScreen;
    menuOverlay.classList.toggle('menu-hero-step', heroScreen);
    menuOverlay.classList.toggle('menu-action-step', actionScreen);
    menuOverlay.classList.toggle('menu-world-step', worldScreen);
  }

  function updateUiMode() {
    refreshCanvasProfile();
    const wrap = canvas.parentElement.parentElement;
    const mapMode = gameState === 'map';
    const compact = isMobileCanvas();
    wrap.classList.toggle('compact-ui', compact);
    wrap.classList.toggle('menu-mode', gameState === 'menu');
    wrap.classList.toggle('map-mode', mapMode);
    wrap.classList.toggle('play-mode', gameState === 'playing');
    wrap.classList.toggle('end-mode', ['gameover', 'ending', 'escape'].includes(gameState));
    menuOverlay.hidden = gameState !== 'menu';
    updateMenuButtons();
    updateMenuStep();
    soundButton.textContent = compact ? (soundOn ? 'SFX' : 'Off') : (mapMode ? (soundOn ? 'Sound' : 'Mute') : (soundOn ? 'Sound On' : 'Sound Off'));
    fullscreenButton.textContent = compact ? 'Full' : 'Fullscreen';
    updatePauseButton();
    updateHeroButton();
  }

  async function toggleFullscreen() {
    const target = canvas.parentElement;
    try {
      if (document.fullscreenElement === target) await document.exitFullscreen();
      else await target.requestFullscreen();
    } catch {}
    updateFullscreenButton();
  }

  function readUnlockedLevel() {
    try {
      const raw = localStorage.getItem(saveKey);
      const parsed = Number(raw);
      if (Number.isInteger(parsed)) return Math.max(0, Math.min(MAIN_LEVEL_COUNT - 1, parsed));
    } catch {}
    return 0;
  }

  function readSelectedHero() {
    try {
      const hero = localStorage.getItem(heroSaveKey);
      return hero === 'girl' ? 'girl' : 'boy';
    } catch {}
    return 'boy';
  }

  function persistSelectedHero() {
    try {
      localStorage.setItem(heroSaveKey, selectedHero);
    } catch {}
  }

  function persistUnlockedLevel() {
    try {
      localStorage.setItem(saveKey, String(unlockedLevel));
    } catch {}
  }

  function readSpecialProgress() {
    const blank = LEVELS.map(level => Array((level.specials || []).length).fill(false));
    try {
      const raw = JSON.parse(localStorage.getItem(specialSaveKey) || 'null');
      if (!Array.isArray(raw)) return blank;
      return blank.map((row, levelIdx) => row.map((_, specialIdx) => !!(raw[levelIdx] && raw[levelIdx][specialIdx])));
    } catch {}
    return blank;
  }

  function persistSpecialProgress() {
    try {
      localStorage.setItem(specialSaveKey, JSON.stringify(specialProgress));
    } catch {}
  }

  function readRewardProgress() {
    const blank = LEVELS.map(() => false);
    try {
      const raw = JSON.parse(localStorage.getItem(rewardSaveKey) || 'null');
      if (!Array.isArray(raw)) return blank;
      return blank.map((_, idx) => !!raw[idx]);
    } catch {}
    return blank;
  }

  function persistRewardProgress() {
    try {
      localStorage.setItem(rewardSaveKey, JSON.stringify(rewardProgress));
    } catch {}
  }

  function readMedalProgress() {
    const blank = Array.from({ length: ALL_STAGE_COUNT }, () => ({ swift: false, steady: false, specialist: false }));
    try {
      const raw = JSON.parse(localStorage.getItem(medalSaveKey) || 'null');
      if (!Array.isArray(raw)) return blank;
      return blank.map((row, idx) => ({
        swift: !!(raw[idx] && raw[idx].swift),
        steady: !!(raw[idx] && raw[idx].steady),
        specialist: !!(raw[idx] && raw[idx].specialist)
      }));
    } catch {}
    return blank;
  }

  function persistMedalProgress() {
    try {
      localStorage.setItem(medalSaveKey, JSON.stringify(medalProgress));
    } catch {}
  }

  function stageForSaveIndex(index) {
    if (index < MAIN_LEVEL_COUNT) return LEVELS[index] || null;
    return BONUS_STAGES[index - MAIN_LEVEL_COUNT] || null;
  }

  function stageIdForSaveIndex(index) {
    const stage = stageForSaveIndex(index);
    return stage && typeof stage.id === 'string' ? stage.id : '';
  }

  function keyedStageProgress(rows, normalizeValue) {
    return rows.reduce((progressByStageId, row, index) => {
      const stageId = stageIdForSaveIndex(index);
      if (stageId) progressByStageId[stageId] = normalizeValue(row, index);
      return progressByStageId;
    }, {});
  }

  function readLegacySave() {
    return {
      unlockedLevel: readUnlockedLevel(),
      selectedHero: readSelectedHero(),
      specialProgress: readSpecialProgress(),
      rewardProgress: readRewardProgress(),
      medalProgress: readMedalProgress()
    };
  }

  function normalizeLegacySave(legacySave) {
    const unlockedStageIds = LEVELS
      .slice(0, legacySave.unlockedLevel + 1)
      .map(level => level.id)
      .filter(Boolean);
    const completedStageIds = LEVELS
      .slice(0, legacySave.unlockedLevel)
      .map(level => level.id)
      .filter(Boolean);

    return {
      version: currentSaveVersion,
      source: 'legacy-localStorage',
      currentWorldId,
      unlockedWorldIds: [currentWorldId],
      selectedHero: legacySave.selectedHero,
      unlockedLevelIndex: legacySave.unlockedLevel,
      unlockedStageIds,
      completedStageIds,
      specialsByStageId: keyedStageProgress(legacySave.specialProgress, row => Array.isArray(row) ? row.map(Boolean) : []),
      rewardsByStageId: keyedStageProgress(legacySave.rewardProgress, value => !!value),
      medalsByStageId: keyedStageProgress(legacySave.medalProgress, row => ({
        swift: !!(row && row.swift),
        steady: !!(row && row.steady),
        specialist: !!(row && row.specialist)
      })),
      // Preserve the legacy arrays for the current index-based runtime until save migration is explicit.
      legacy: legacySave
    };
  }

  function readVersionedSave() {
    return normalizeLegacySave(readLegacySave());
  }

  function setHero(nextHero) {
    selectedHero = nextHero === 'girl' ? 'girl' : 'boy';
    persistSelectedHero();
    updateHeroButton();
  }

  function resetProgressAndReturnToMenu() {
    unlockedLevel = 0;
    specialProgress = LEVELS.map(level => Array((level.specials || []).length).fill(false));
    rewardProgress = LEVELS.map(() => false);
    medalProgress = Array.from({ length: ALL_STAGE_COUNT }, () => ({ swift: false, steady: false, specialist: false }));
    try {
      for (const key of legacyProgressSaveKeys) localStorage.removeItem(key);
      // Future stable-ID saves should clear with Reset Progress, but are not written yet.
      localStorage.removeItem(versionedSaveKey);
    } catch {}
    totalCandy = 0;
    nextExtraLifeAt = 45;
    lives = maxLives;
    hasActiveRun = false;
    menuReturnState = 'menu';
    bootToGame();
    sound('click');
  }

  function openMenu() {
    if (gameState !== 'menu') menuReturnState = gameState;
    gameState = 'menu';
    menuStep = 'hero';
    paused = false;
    updatePauseButton();
    updateUiMode();
  }

  function openMenuActions() {
    menuStep = 'actions';
    updateUiMode();
  }

  function resumeRun() {
    if (!hasActiveRun || !['playing', 'map'].includes(menuReturnState)) return;
    gameState = menuReturnState;
    paused = false;
    updatePauseButton();
    updateUiMode();
    sound('click');
  }

  function startAdventure() {
    resetRun(0);
    hasActiveRun = true;
    menuReturnState = 'playing';
    sound('click');
  }

  function openWorldMap() {
    const nodes = selectableMapNodes();
    const targetNode = nodes.includes(currentMapNodeId()) ? currentMapNodeId() : (nodes[0] ?? 0);
    const targetIndex = stageIndexForMapNode(targetNode);
    loadLevel(targetIndex);
    hasActiveRun = true;
    menuReturnState = 'map';
    gameState = 'map';
    paused = false;
    mapLevelIndex = targetIndex;
    mapMarkerFromIndex = targetNode;
    mapMarkerToIndex = targetNode;
    mapMarkerProgress = 1;
    mapRevealTimer = 0;
    mapArrivalTimer = 0;
    mapBranchHintTimer = 0;
    updatePauseButton();
    updateUiMode();
    sound('click');
  }

  function firstVisibleBranchTarget() {
    const branchNodes = currentWorldMapData().branchNodes || WORLD_MAP_BRANCH_NODES;

    for (let i = 0; i <= unlockedLevel && i < branchNodes.length; i++) {
      if (rewardRouteUnlocked(i)) return branchNodeId(i);
    }

    for (let i = 0; i <= unlockedLevel && i < branchNodes.length; i++) {
      return branchNodeId(i);
    }

    return 0;
  }

  function openSideStagesMap() {
    const nodes = selectableMapNodes();
    const targetNode = firstVisibleBranchTarget();
    const selectedNode = nodes.includes(targetNode) ? targetNode : (nodes[0] ?? 0);
    const targetIndex = stageIndexForMapNode(selectedNode);
    loadLevel(targetIndex);
    hasActiveRun = true;
    menuReturnState = 'map';
    gameState = 'map';
    paused = false;
    mapLevelIndex = targetIndex;
    mapMarkerFromIndex = selectedNode;
    mapMarkerToIndex = selectedNode;
    mapMarkerProgress = 1;
    mapRevealTimer = 0;
    mapArrivalTimer = 0;
    mapBranchHintTimer = 220;
    updatePauseButton();
    updateUiMode();
    sound('click');
  }

  function selectMapNode(nextIndex) {
    const nodes = selectableMapNodes();
    if (!nodes.includes(nextIndex)) return;
    const nextStage = stageIndexForMapNode(nextIndex);
    if (nextIndex === mapMarkerToIndex && nextStage === mapLevelIndex) return;
    mapLevelIndex = nextStage;
    mapMarkerFromIndex = mapMarkerToIndex;
    mapMarkerToIndex = nextIndex;
    mapMarkerProgress = 0;
    mapMoveCooldown = 12;
    sound('click');
  }

  function setUnlockedLevel(nextLevel) {
    const clamped = Math.max(0, Math.min(MAIN_LEVEL_COUNT - 1, nextLevel));
    if (clamped <= unlockedLevel) return;
    unlockedLevel = clamped;
    persistUnlockedLevel();
  }

  function ensureAudio() {
    if (!soundOn) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function stopMusic() {
    musicState = '';
    musicNextNoteTime = 0;
    musicStep = 0;
  }

  function playTone(ac, freq, dur, type, gain, when, ramp = 'up') {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (ramp === 'up') osc.frequency.exponentialRampToValueAtTime(freq * 1.28, when + dur);
    if (ramp === 'down') osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.62), when + dur);
    if (ramp === 'pulse') osc.frequency.exponentialRampToValueAtTime(freq * 1.08, when + dur * 0.5);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(when);
    osc.stop(when + dur + 0.03);
  }

  function currentMusicMode() {
    if (!soundOn) return 'silent';
    if (gameState === 'menu') return 'menu';
    if (gameState === 'map') return 'map';
    if (gameState === 'escape' || gameState === 'ending') return 'ending';
    if (gameState === 'playing' && !paused) return level ? level.theme : 'meadow';
    return 'silent';
  }

  function updateMusic() {
    const ac = ensureAudio();
    const mode = currentMusicMode();
    if (!ac || mode === 'silent') {
      stopMusic();
      return;
    }
    if (musicState !== mode) {
      musicState = mode;
      musicNextNoteTime = ac.currentTime + 0.02;
      musicStep = 0;
    }
    const patterns = {
      menu: { lead: [523.25, 659.25, 783.99, 659.25], bass: [261.63, 329.63], stepDur: 0.28, leadType: 'triangle', bassType: 'sine' },
      map: { lead: [659.25, 783.99, 698.46, 880], bass: [220, 293.66], stepDur: 0.24, leadType: 'triangle', bassType: 'sine' },
      meadow: { lead: [659.25, 783.99, 880, 783.99], bass: [261.63, 329.63], stepDur: 0.22, leadType: 'triangle', bassType: 'sine' },
      licorice: { lead: [587.33, 698.46, 659.25, 783.99], bass: [220, 246.94], stepDur: 0.22, leadType: 'square', bassType: 'triangle' },
      falls: { lead: [698.46, 880, 987.77, 880], bass: [293.66, 349.23], stepDur: 0.24, leadType: 'sine', bassType: 'triangle' },
      woods: { lead: [523.25, 587.33, 698.46, 587.33], bass: [196, 246.94], stepDur: 0.24, leadType: 'triangle', bassType: 'sine' },
      courtyard: { lead: [659.25, 739.99, 880, 783.99], bass: [246.94, 329.63], stepDur: 0.2, leadType: 'square', bassType: 'triangle' },
      keep: { lead: [783.99, 880, 987.77, 1046.5], bass: [293.66, 392], stepDur: 0.19, leadType: 'square', bassType: 'sine' },
      ending: { lead: [880, 987.77, 1174.66, 1318.51], bass: [329.63, 392], stepDur: 0.34, leadType: 'triangle', bassType: 'sine' }
    };
    const pattern = patterns[mode] || patterns.meadow;
    while (musicNextNoteTime < ac.currentTime + 0.28) {
      const leadFreq = pattern.lead[musicStep % pattern.lead.length];
      const bassFreq = pattern.bass[musicStep % pattern.bass.length];
      playTone(ac, leadFreq, pattern.stepDur * 0.78, pattern.leadType, 0.022, musicNextNoteTime, 'pulse');
      if (musicStep % 2 === 0) playTone(ac, bassFreq, pattern.stepDur * 0.92, pattern.bassType, 0.018, musicNextNoteTime, 'down');
      musicNextNoteTime += pattern.stepDur;
      musicStep++;
    }
  }

  function sound(kind) {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime;
    if (kind === 'jump') {
      playTone(ac, 520, 0.07, 'triangle', 0.05, now, 'up');
    } else if (kind === 'bounce') {
      playTone(ac, 680, 0.1, 'sine', 0.06, now, 'up');
    } else if (kind === 'collect') {
      playTone(ac, 880, 0.07, 'sine', 0.05, now, 'up');
    } else if (kind === 'sugar') {
      playTone(ac, 980, 0.25, 'sawtooth', 0.04, now, 'up');
    } else if (kind === 'stomp') {
      playTone(ac, 240, 0.12, 'square', 0.05, now, 'down');
      playTone(ac, 360, 0.08, 'triangle', 0.025, now + 0.02, 'up');
    } else if (kind === 'hurt') {
      playTone(ac, 150, 0.18, 'sawtooth', 0.04, now, 'down');
    } else if (kind === 'checkpoint') {
      playTone(ac, 740, 0.16, 'triangle', 0.055, now, 'up');
    } else if (kind === 'win') {
      playTone(ac, 660, 0.25, 'sine', 0.06, now, 'up');
    } else if (kind === 'gate') {
      playTone(ac, 360, 0.16, 'square', 0.045, now, 'down');
    } else if (kind === 'click') {
      playTone(ac, 440, 0.06, 'triangle', 0.035, now, 'pulse');
    } else if (kind === 'life') {
      playTone(ac, 1040, 0.18, 'triangle', 0.05, now, 'up');
    } else if (kind === 'ending') {
      playTone(ac, 580, 0.35, 'sine', 0.06, now, 'up');
    } else if (kind === 'step') {
      playTone(ac, 180, 0.035, 'triangle', 0.015, now, 'pulse');
    } else if (kind === 'run') {
      playTone(ac, 220, 0.03, 'square', 0.018, now, 'pulse');
    } else if (kind === 'fall') {
      playTone(ac, 320, 0.22, 'sawtooth', 0.028, now, 'down');
    } else {
      playTone(ac, 440, 0.06, 'triangle', 0.035, now, 'pulse');
    }
  }

  function chordWin() {
    sound('win');
    setTimeout(() => sound('collect'), 90);
    setTimeout(() => sound('checkpoint'), 180);
  }

  function createImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  const {
    LEVEL_BACKGROUNDS,
    THEME_AMBIENCE,
    BACKGROUND_LAYOUTS,
    HERO_FRAMES,
    ENEMY_FRAMES,
    assetNames
  } = window.CandyQuestAssets;

  for (const name of assetNames) {
    const folder = HERO_FRAMES.boy.idle.includes(name) || HERO_FRAMES.boy.run.includes(name) || HERO_FRAMES.boy.jump.includes(name) || HERO_FRAMES.boy.land.includes(name) || HERO_FRAMES.boy.skid.includes(name) || HERO_FRAMES.boy.celebrate.includes(name) || HERO_FRAMES.boy.hurt.includes(name) || HERO_FRAMES.girl.idle.includes(name) || HERO_FRAMES.girl.run.includes(name) || HERO_FRAMES.girl.jump.includes(name) || HERO_FRAMES.girl.land.includes(name) || HERO_FRAMES.girl.skid.includes(name) || HERO_FRAMES.girl.celebrate.includes(name) || HERO_FRAMES.girl.hurt.includes(name)
      ? 'heroes' : (name.includes('gummy_') || name.includes('marsh_') || name.includes('beetle_') || name.includes('jaw_')) ? 'enemies' : 'tiles';
    assets[name] = createImage(`assets/${folder}/${name}.png`);
  }

  const { P, B, M, R, V, G, TG, E, C, S, D, F, HN, WZ } = window.CandyQuestShapes;
  const {
    LEVELS,
    BONUS_STAGES,
    MAIN_LEVEL_COUNT,
    SIDE_STAGE_COUNT,
    BONUS_STAGE_INDEX,
    ALL_STAGE_COUNT
  } = window.CandyQuestLevels;
  const {
    WORLDS
  } = window.CandyQuestWorlds || { WORLDS: [] };

  const maxHearts = 3;
  const maxLives = 5;
  const player = {
    x: 70, y: 390, w: 34, h: 56,
    vx: 0, vy: 0, onGround: false, face: 1,
    coyote: 0, jumpBuffer: 0, anim: 0,
    lastSafe: {x:70,y:390}, invuln: 0, landedTimer: 0, hurtTimer: 0,
    hearts: maxHearts
  };

  const gravity = 0.72;
  const fallGravity = 0.98;
  const accel = 0.92;
  const maxSpeed = 6.8;
  const friction = 0.82;
  const jumpPower = -16.1;
  const coyoteFrames = 12;
  const bufferFrames = 12;
  const spawnGraceFrames = 45;

  let level = null;
  let levelDecor = [];
  let friendlyNpcs = [];
  let signHints = [];
  let wonderZones = [];
  let platforms = [];
  let candies = [];
  let specials = [];
  let enemies = [];
  let checkpoints = [];
  let goal = {x:0, y:0, w:38, h:90};
  let score = 0;
  let sugar = 0;
  let sugarTimer = 0;
  let particles = [];
  let ambientParticles = [];
  let levelIntroTimer = 0;
  let lives = maxLives;
  let specialProgress = [];
  let rewardProgress = [];
  let medalProgress = [];
  let wonderText = '';
  let wonderTextTimer = 0;
  let runTookDamage = false;
  let lastStageRewards = [];
  let respawnGraceTimer = 0;

  function levelSpecialCount(i) {
    return (LEVELS[i] && LEVELS[i].specials ? LEVELS[i].specials.length : 0);
  }

  function collectedSpecialCount(i) {
    const row = specialProgress[i] || [];
    let count = 0;
    for (const taken of row) if (taken) count++;
    return count;
  }

  function hasAllSpecialsInLevel(i) {
    if (i >= MAIN_LEVEL_COUNT) return false;
    const total = levelSpecialCount(i);
    return total > 0 && collectedSpecialCount(i) === total;
  }

  function totalSpecialsFound() {
    let total = 0;
    for (let i = 0; i < LEVELS.length; i++) total += collectedSpecialCount(i);
    return total;
  }

  function totalSpecialCount() {
    let total = 0;
    for (let i = 0; i < LEVELS.length; i++) total += levelSpecialCount(i);
    return total;
  }

  function allSpecialsComplete() {
    return totalSpecialsFound() === totalSpecialCount();
  }

  function isBonusStageIndex(i) {
    return i >= MAIN_LEVEL_COUNT;
  }

  function isBranchStageIndex(i) {
    return i >= MAIN_LEVEL_COUNT && i < BONUS_STAGE_INDEX;
  }

  function isHiddenBonusStageIndex(i) {
    return i === BONUS_STAGE_INDEX;
  }

  function getStageData(i) {
    return isBonusStageIndex(i) ? BONUS_STAGES[i - MAIN_LEVEL_COUNT] : LEVELS[i];
  }

  function getWorldById(worldId) {
    return (Array.isArray(WORLDS) ? WORLDS : []).find(world => world.id === worldId) || null;
  }

  function getCurrentWorld() {
    return getWorldById(currentWorldId);
  }

  function isWorldUnlocked(worldId) {
    return worldId === currentWorldId;
  }

  function isFinalMainStageForWorld(world, stageIndex) {
    if (!world || !Array.isArray(world.mainStageIds)) return stageIndex === MAIN_LEVEL_COUNT - 1;
    const stage = getStageData(stageIndex);
    const finalStageId = world.mainStageIds[world.mainStageIds.length - 1];
    return !!stage && stage.id === finalStageId;
  }

  function hasCurrentRunCompletedWorld(world) {
    if (!isFinalMainStageForWorld(world, levelIndex)) return false;
    return winTimer > 0 || gameState === 'escape' || gameState === 'ending';
  }

  function isWorldComplete(worldId) {
    const world = getWorldById(worldId);
    return isWorldUnlocked(worldId) && hasCurrentRunCompletedWorld(world);
  }

  function maxMapSelection() {
    return allSpecialsComplete() ? BONUS_STAGE_INDEX : unlockedLevel;
  }

  function branchStageIndex(levelIdx) {
    return MAIN_LEVEL_COUNT + levelIdx;
  }

  function branchNodeId(levelIdx) {
    return MAP_NODE_BRANCH_OFFSET + levelIdx;
  }

  function isBranchNodeId(id) {
    return id >= MAP_NODE_BRANCH_OFFSET && id < MAP_NODE_BRANCH_OFFSET + MAIN_LEVEL_COUNT;
  }

  function isBonusNodeId(id) {
    return id === MAP_NODE_BONUS;
  }

  function mapNodeStageIndex(node, nodeIndex) {
    return Number.isInteger(node?.stageIndex) ? node.stageIndex : nodeIndex;
  }

  function mapNodeUnlockLevel(node, nodeIndex) {
    if (Number.isInteger(node?.unlockLevel)) return node.unlockLevel;
    const stageIndex = mapNodeStageIndex(node, nodeIndex);
    if (isBranchStageIndex(stageIndex)) return Math.min(MAIN_LEVEL_COUNT - 1, stageIndex - MAIN_LEVEL_COUNT + 1);
    return Math.max(0, Math.min(MAIN_LEVEL_COUNT - 1, stageIndex));
  }

  function mapNodeIdForStageIndex(stageIndex) {
    if (isHiddenBonusStageIndex(stageIndex)) return MAP_NODE_BONUS;
    const nodeIndex = WORLD_MAP_NODES.findIndex((node, index) => mapNodeStageIndex(node, index) === stageIndex);
    if (nodeIndex >= 0) return nodeIndex;
    if (isBranchStageIndex(stageIndex)) return branchNodeId(stageIndex - MAIN_LEVEL_COUNT);
    return stageIndex;
  }

  function stageIndexForMapNode(id) {
    if (isBranchNodeId(id)) return branchStageIndex(id - MAP_NODE_BRANCH_OFFSET);
    if (isBonusNodeId(id)) return BONUS_STAGE_INDEX;
    const node = WORLD_MAP_NODES[id];
    return node ? mapNodeStageIndex(node, id) : id;
  }

  function selectableMapNodes() {
    const nodes = [];
    WORLD_MAP_NODES.forEach((node, index) => {
      if (unlockedLevel >= mapNodeUnlockLevel(node, index)) nodes.push(index);
    });
    for (const branch of WORLD_MAP_BRANCH_NODES) {
      if (branch.levelIndex <= unlockedLevel && rewardRouteUnlocked(branch.levelIndex)) nodes.push(branchNodeId(branch.levelIndex));
    }
    if (allSpecialsComplete()) nodes.push(MAP_NODE_BONUS);
    return nodes;
  }

  function currentMapNodeId() {
    return mapNodeIdForStageIndex(mapLevelIndex);
  }

  function mainPathBranchStageAfterMainLevel(mainLevelIndex) {
    if (mainLevelIndex === 0 || mainLevelIndex === 1) return branchStageIndex(mainLevelIndex);
    return null;
  }

  function medalCount(i) {
    const row = medalProgress[i] || {};
    return (row.swift ? 1 : 0) + (row.steady ? 1 : 0) + (row.specialist ? 1 : 0);
  }

  function pushStageReward(text) {
    if (!text || lastStageRewards.includes(text)) return;
    lastStageRewards.push(text);
  }

  function grantMedal(i, key, color = '#fff27a') {
    if (!medalProgress[i]) medalProgress[i] = { swift: false, steady: false, specialist: false };
    if (medalProgress[i][key]) return;
    medalProgress[i][key] = true;
    const medalLabels = {
      swift: 'Swift medal earned',
      steady: 'Steady medal earned',
      specialist: isBonusStageIndex(i) ? 'Morning Star medal earned' : 'Specialist medal earned'
    };
    pushStageReward(medalLabels[key]);
    persistMedalProgress();
    burst(player.x + player.w / 2, player.y + 4, 12, color);
    sound('checkpoint');
  }

  function rewardRouteUnlocked(i) {
    return hasAllSpecialsInLevel(i) || (i > 0 && hasAllSpecialsInLevel(i - 1));
  }

  function formatLevelTimer(frames) {
    const totalSeconds = Math.max(0, Math.ceil(frames / 60));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function buildAmbientParticle(theme) {
    const cfg = THEME_AMBIENCE[theme] || THEME_AMBIENCE.meadow;
    const roll = Math.random();
    const kind = roll < cfg.gumdrops ? 'gumdrop' : (roll < cfg.gumdrops + cfg.sparkle ? 'sparkle' : 'dust');
    return {
      kind,
      x: Math.random() * W,
      y: Math.random() * H,
      r: kind === 'gumdrop' ? 5 + Math.random() * 5 : 1.4 + Math.random() * 3.2,
      vx: cfg.driftX * (0.6 + Math.random() * 1.6),
      vy: cfg.driftY * (0.4 + Math.random() * 1.8),
      alpha: kind === 'dust' ? 0.22 + Math.random() * 0.22 : kind === 'sparkle' ? 0.26 + Math.random() * 0.28 : 0.18 + Math.random() * 0.18,
      twinkle: Math.random() * Math.PI * 2,
      sway: 0.4 + Math.random() * 1.2,
      color: cfg.colors[(Math.random() * cfg.colors.length) | 0]
    };
  }

  function resetAmbientParticles(theme) {
    ambientParticles = Array.from({ length: ambientParticleTargetCount(theme) }, () => buildAmbientParticle(theme));
  }

  function ambientParticleTargetCount(theme) {
    const cfg = THEME_AMBIENCE[theme] || THEME_AMBIENCE.meadow;
    if (!reducedEffectsMode()) return cfg.count;
    return Math.max(8, Math.ceil(cfg.count * 0.45));
  }

  function maxParticleCount() {
    return reducedEffectsMode() ? 90 : 180;
  }

  function clampParticles() {
    const maxCount = maxParticleCount();
    if (particles.length > maxCount) particles.splice(0, particles.length - maxCount);
  }

  function triggerWonder(zone) {
    if (zone.done) return;
    zone.done = true;
    wonderText = zone.text;
    wonderTextTimer = 170;
    if (zone.heart) {
      player.hearts = Math.min(maxHearts, player.hearts + zone.heart);
      player.invuln = Math.max(player.invuln, 42);
    }
    burst(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.heart ? 18 : 12, zone.color || '#fff27a');
    sound('checkpoint');
  }

  function grantLevelReward(i) {
    if (rewardProgress[i] || !hasAllSpecialsInLevel(i)) return;
    rewardProgress[i] = true;
    persistRewardProgress();
    lives = Math.min(maxLives + 4, lives + 1);
    pushStageReward('Extra life unlocked');
    pushStageReward('Bonus stamp upgraded on the map');
    pushStageReward('Hero flair unlocked for this world');
    pushStageReward('Safe route opened');
    if (i + 1 < MAIN_LEVEL_COUNT) pushStageReward(`Next world route opened: ${LEVELS[i + 1].name}`);
    if (allSpecialsComplete()) pushStageReward('Hidden world unlocked: Morning Star Run');
    burst(player.x + player.w / 2, player.y, 26, '#fff27a');
    burst(player.x + player.w / 2, player.y - 18, 12, '#ff74ba');
    sound('life');
    sound('checkpoint');
  }

  function addRewardRouteContent(i) {
    if (!rewardRouteUnlocked(i)) return;
    switch (i) {
      case 0:
        platforms.push(P(1460, 270, 94, 18, 'icing'), P(1590, 238, 96, 18, 'icing'));
        candies.push({ kind: 'star_blue', x: 1508, y: 236, taken: false, bob: Math.random() * Math.PI * 2 });
        candies.push({ kind: 'bean_yellow', x: 1642, y: 206, taken: false, bob: Math.random() * Math.PI * 2 });
        levelDecor.push(D(1588, 214, 'candy_arch', { h: 58, alpha: 0.34, tint: 'rgba(255,242,122,0.45)' }));
        break;
      case 1:
        platforms.push(P(1848, 166, 92, 18, 'wafer'), P(1952, 146, 94, 18, 'wafer'));
        candies.push({ kind: 'star_pink', x: 1894, y: 130, taken: false, bob: Math.random() * Math.PI * 2 });
        candies.push({ kind: 'bean_green', x: 2000, y: 112, taken: false, bob: Math.random() * Math.PI * 2 });
        levelDecor.push(D(1988, 126, 'lollipop_purple', { h: 56, alpha: 0.36, tint: 'rgba(255,242,122,0.42)' }));
        break;
      case 2:
        platforms.push(P(2128, 182, 96, 18, 'icing'), P(2240, 152, 90, 18, 'icing'));
        candies.push({ kind: 'star_purple', x: 2180, y: 146, taken: false, bob: Math.random() * Math.PI * 2 });
        candies.push({ kind: 'bean_blue', x: 2284, y: 118, taken: false, bob: Math.random() * Math.PI * 2 });
        levelDecor.push(D(2216, 138, 'candy_arch', { h: 56, alpha: 0.34, tint: 'rgba(137,228,255,0.42)' }));
        break;
      case 3:
        platforms.push(P(2038, 212, 92, 18, 'wafer'), P(2146, 184, 94, 18, 'wafer'));
        candies.push({ kind: 'star_blue', x: 2088, y: 176, taken: false, bob: Math.random() * Math.PI * 2 });
        candies.push({ kind: 'bean_orange', x: 2192, y: 148, taken: false, bob: Math.random() * Math.PI * 2 });
        levelDecor.push(D(2148, 166, 'candy_arch', { h: 54, alpha: 0.34, tint: 'rgba(255,242,122,0.42)' }));
        break;
      case 4:
        platforms.push(P(2810, 246, 90, 18, 'icing'), P(3020, 196, 90, 18, 'icing'));
        candies.push({ kind: 'star_pink', x: 2856, y: 210, taken: false, bob: Math.random() * Math.PI * 2 });
        candies.push({ kind: 'bean_purple', x: 3062, y: 160, taken: false, bob: Math.random() * Math.PI * 2 });
        levelDecor.push(D(2990, 176, 'lollipop_pink', { h: 56, alpha: 0.34, tint: 'rgba(255,242,122,0.42)' }));
        break;
      case 5:
        platforms.push(P(2948, 214, 94, 18, 'cookie'), P(3176, 170, 96, 18, 'icing'));
        candies.push({ kind: 'star_blue', x: 2994, y: 178, taken: false, bob: Math.random() * Math.PI * 2 });
        candies.push({ kind: 'star_purple', x: 3224, y: 134, taken: false, bob: Math.random() * Math.PI * 2 });
        levelDecor.push(D(3198, 150, 'candy_arch', { h: 58, alpha: 0.34, tint: 'rgba(255,242,122,0.45)' }));
        break;
    }
  }

  function collectSpecial(special) {
    if (!specialProgress[levelIndex]) specialProgress[levelIndex] = Array(levelSpecialCount(levelIndex)).fill(false);
    if (!specialProgress[levelIndex][special.index]) {
      specialProgress[levelIndex][special.index] = true;
      persistSpecialProgress();
    }
    special.taken = true;
    score += 5;
    sugar += 20;
    if (sugar >= 100) {
      sugar = 0;
      sugarTimer = 380;
      burst(player.x + player.w / 2, player.y, 30, '#fff27a');
      sound('sugar');
    }
    burst(special.x, special.y, 18, '#fff27a');
    sound('checkpoint');
    while (totalCandy + score >= nextExtraLifeAt) {
      lives = Math.min(maxLives + 4, lives + 1);
      nextExtraLifeAt += 45;
      burst(player.x + player.w / 2, player.y, 18, '#fff27a');
      sound('life');
    }
    grantLevelReward(levelIndex);
  }

  const {
    WORLD_MAPS,
    WORLD_MAP_NODES,
    WORLD_MAP_BRANCH_NODES,
    WORLD_MAP_BONUS_NODE,
    MAP_NODE_BRANCH_OFFSET,
    MAP_NODE_BONUS
  } = window.CandyQuestMap;
  const ACTIVE_WORLD_MAP_ID = 'world-1-map';

  function currentWorldMapData() {
    return (WORLD_MAPS && WORLD_MAPS[ACTIVE_WORLD_MAP_ID]) || {
      mapId: ACTIVE_WORLD_MAP_ID,
      mainNodes: WORLD_MAP_NODES,
      branchNodes: WORLD_MAP_BRANCH_NODES,
      bonusNode: WORLD_MAP_BONUS_NODE
    };
  }

  menuButton.addEventListener('click', openMenu);

  heroButton.addEventListener('click', () => {
    setHero(selectedHero === 'boy' ? 'girl' : 'boy');
    burst(player.x + player.w / 2, player.y + player.h / 2, 10, selectedHero === 'boy' ? '#72ddff' : '#ff74ba');
    sound('click');
  });

  menuBoyButton.addEventListener('click', () => { setHero('boy'); openMenuActions(); sound('click'); });
  menuGirlButton.addEventListener('click', () => { setHero('girl'); openMenuActions(); sound('click'); });
  resumeButton.addEventListener('click', resumeRun);
  startButton.addEventListener('click', startAdventure);
  mapButton.addEventListener('click', () => { menuStep = 'world'; updateUiMode(); sound('click'); });
  worldOneButton.addEventListener('click', openWorldMap);
  sideStagesButton.addEventListener('click', openSideStagesMap);
  resetProgressButton.addEventListener('click', resetProgressAndReturnToMenu);
  backToHeroButton.addEventListener('click', () => { menuStep = 'hero'; updateUiMode(); sound('click'); });
  backToActionsButton.addEventListener('click', () => { menuStep = 'actions'; updateUiMode(); sound('click'); });

  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    if (!soundOn) stopMusic();
    updateUiMode();
    if (soundOn) sound('click');
  });

  pauseButton.addEventListener('click', () => {
    if (gameState === 'map' && mapRevealTimer === 0 && mapMarkerProgress >= 1) {
      loadLevel(mapLevelIndex);
      gameState = 'playing';
      paused = false;
      updatePauseButton();
      updateUiMode();
      sound('click');
      return;
    }
    if (gameState === 'gameover') {
      resetProgressAndReturnToMenu();
      sound('click');
      return;
    }
    if (gameState === 'ending') {
      resetRun(Math.min(levelIndex, unlockedLevel));
      sound('click');
      return;
    }
    paused = !paused;
    updatePauseButton();
    sound('click');
  });

  fullscreenButton.addEventListener('click', () => {
    sound('click');
    toggleFullscreen();
  });
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  addEventListener('resize', updateUiMode);

  function enterWorldMap(nextLevel) {
    const nodes = selectableMapNodes();
    const nextNode = mapNodeIdForStageIndex(nextLevel);
    const targetNode = nodes.includes(nextNode) ? nextNode : (nodes[0] ?? 0);
    const clamped = stageIndexForMapNode(targetNode);
    menuReturnState = 'map';
    mapLevelIndex = clamped;
    mapPulse = 0;
    mapMoveCooldown = 0;
    mapRevealTimer = 42;
    mapArrivalTimer = 0;
    mapBranchHintTimer = 0;
    mapMarkerFromIndex = currentMapNodeId();
    mapMarkerToIndex = targetNode;
    mapMarkerProgress = 0;
    winTimer = 0;
    paused = false;
    gameState = 'map';
    updatePauseButton();
    updateUiMode();
  }

  function resetRun(startLevel = 0) {
    hasActiveRun = true;
    menuReturnState = 'playing';
    totalCandy = 0;
    nextExtraLifeAt = 45;
    lives = maxLives;
    player.hearts = maxHearts;
    endingTimer = 0;
    paused = false;
    mapMarkerFromIndex = 0;
    mapMarkerToIndex = 0;
    mapMarkerProgress = 1;
    mapArrivalTimer = 0;
    updatePauseButton();
    loadLevel(Math.max(0, Math.min(MAIN_LEVEL_COUNT - 1, startLevel)));
    gameState = 'playing';
    introTimer = 0;
    updatePauseButton();
    updateUiMode();
  }

  function bootToGame() {
    loadLevel(0);
    hasActiveRun = false;
    menuReturnState = 'menu';
    menuStep = 'hero';
    gameState = 'menu';
    paused = false;
    mapLevelIndex = 0;
    mapMarkerFromIndex = 0;
    mapMarkerToIndex = 0;
    mapMarkerProgress = 1;
    mapMoveCooldown = 0;
    mapRevealTimer = 0;
    mapArrivalTimer = 0;
    mapBranchHintTimer = 0;
    updatePauseButton();
    updateUiMode();
  }

  addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyR','Enter'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (gameState === 'menu' && e.code === 'Enter') {
      if (menuStep === 'hero') openMenuActions();
      else startAdventure();
    }
    if (gameState === 'playing' && ['ArrowUp','Space','KeyW'].includes(e.code)) jumpPressed = true;
    if (e.code === 'KeyR' && gameState === 'playing') loadLevel(levelIndex);
    if (e.code === 'KeyP' && gameState === 'playing') { paused = !paused; updatePauseButton(); }
    if ((e.code === 'Enter' || e.code === 'Space') && gameState === 'map' && mapRevealTimer === 0 && mapMarkerProgress >= 1) {
      loadLevel(mapLevelIndex);
      gameState = 'playing';
      paused = false;
      updatePauseButton();
      updateUiMode();
    }
    if (e.code === 'Enter' && gameState === 'ending') resetRun(Math.min(levelIndex, unlockedLevel));
    if (e.code === 'Enter' && gameState === 'gameover') resetProgressAndReturnToMenu();
  });
  addEventListener('keyup', e => keys.delete(e.code));

  for (const btn of document.querySelectorAll('[data-hold]')) {
    const dir = btn.dataset.hold;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!['playing', 'map'].includes(gameState)) return;
      touch[dir] = true;
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener('pointerup', () => touch[dir] = false);
    btn.addEventListener('pointercancel', () => touch[dir] = false);
  }
  document.querySelector('[data-tap="jump"]').addEventListener('pointerdown', e => {
    e.preventDefault();
    if (gameState === 'map' && mapRevealTimer === 0 && mapMarkerProgress >= 1) {
      loadLevel(mapLevelIndex);
      gameState = 'playing';
      paused = false;
      updatePauseButton();
      updateUiMode();
      return;
    }
    if (gameState === 'gameover') {
      resetProgressAndReturnToMenu();
      return;
    }
    if (gameState === 'ending') {
      resetRun(Math.min(levelIndex, unlockedLevel));
      return;
    }
    if (gameState === 'playing') jumpPressed = true;
  });

  function loadLevel(i) {
    levelIndex = i;
    menuReturnState = 'playing';
    lastStageRewards = [];
    level = getStageData(i);
    levelDecor = level.decor.map(d => ({ ...d }));
    friendlyNpcs = (level.npcs || []).map(npc => ({ ...npc, bob: Math.random() * Math.PI * 2 }));
    signHints = (level.signs || []).map(sign => ({ ...sign }));
    wonderZones = (level.wonders || []).map(zone => ({ ...zone, done: false }));
    WORLD_W = level.worldW;
    platforms = level.platforms.map(p => ({
      ...p,
      crumbleTimer: p.kind === 'cookie' ? 0 : undefined,
      respawnTimer: 0
    }));
    candies = level.candies.map(([kind, x, y]) => ({ kind, x, y, taken: false, bob: Math.random() * Math.PI * 2 }));
    specials = (level.specials || []).map(([kind, x, y], index) => ({
      kind, x, y, index,
      taken: !!(specialProgress[i] && specialProgress[i][index]),
      bob: Math.random() * Math.PI * 2
    }));
    enemies = level.enemies.map(e => ({
      ...e,
      x: e.spawnX,
      y: e.spawnY,
      vx: e.chase ? 0 : e.baseSpeed,
      alive: true,
      hurtTimer: 0,
      respawnTimer: 0,
      chaseActive: false,
      alert: false
    }));
    checkpoints = level.checkpoints.map(c => ({ ...c }));
    goal = { ...level.goal, w: 48, h: 102 };
    Object.assign(player, {
      x: level.start.x, y: level.start.y, w: 34, h: 56, vx: 0, vy: 0,
      onGround: false, face: 1, coyote: 0, jumpBuffer: 0, anim: 0, surfaceKind: null,
      invuln: 0, landedTimer: 0, hurtTimer: 0, hearts: maxHearts,
      lastSafe: { x: level.start.x, y: level.start.y }
    });
    respawnGraceTimer = 0;
    placePlayerAtSafeSpawn(level.start, { fallback: level.start, graceFrames: spawnGraceFrames });
    cameraX = 0;
    score = 0;
    sugar = 0;
    sugarTimer = 0;
    levelTimer = levelTimeLimit;
    particles.length = 0;
    resetAmbientParticles(level.theme);
    if (!isBonusStageIndex(i)) addRewardRouteContent(i);
    wonderText = '';
    wonderTextTimer = 0;
    winTimer = 0;
    shake = 0;
    levelIntroTimer = 150;
    storyTimer = 180;
    runTookDamage = false;
  }

  function bankLevelCandy() {
    totalCandy += score;
    score = 0;
    while (totalCandy >= nextExtraLifeAt) {
      lives = Math.min(maxLives + 4, lives + 1);
      nextExtraLifeAt += 45;
      pushStageReward('Extra life from candy total');
      burst(player.x + player.w / 2, player.y, 28, '#fff27a');
      sound('life');
    }
  }

  function grantStageMedals() {
    if (isBonusStageIndex(levelIndex)) {
      grantMedal(levelIndex, 'specialist', '#ff9ed0');
      return;
    }
    if (levelTimer >= 20 * 60) grantMedal(levelIndex, 'swift', '#71dfff');
    if (!runTookDamage) grantMedal(levelIndex, 'steady', '#79f0c3');
    if (hasAllSpecialsInLevel(levelIndex)) grantMedal(levelIndex, 'specialist', '#fff27a');
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function isSafePlatform(p) {
    return ['icing', 'choco', 'wafer', 'float', 'elevator', 'slide', 'raft'].includes(p.kind);
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isSpawnSupportPlatform(p) {
    return p.alive && !['sugarGate', 'blinkGate', 'break', 'bounce'].includes(p.kind);
  }

  function spawnPointOnPlatform(point, platform) {
    const margin = Math.min(24, Math.max(8, platform.w * 0.18));
    const minX = platform.x + margin;
    const maxX = platform.x + platform.w - player.w - margin;
    const desiredX = point.x ?? platform.x;
    const x = maxX >= minX
      ? clampValue(desiredX, minX, maxX)
      : platform.x + platform.w / 2 - player.w / 2;
    return {
      x: clampValue(x, 0, WORLD_W - player.w),
      y: platform.y - player.h,
      platform
    };
  }

  function playerSafelySupportedBy(platform) {
    const feetLeft = player.x + 8;
    const feetRight = player.x + player.w - 8;
    const feetY = player.y + player.h;
    return feetLeft >= platform.x + 10
      && feetRight <= platform.x + platform.w - 10
      && Math.abs(feetY - platform.y) <= 3;
  }

  function findSafeSpawnPosition(point, horizontalPadding = 44, verticalAbove = 120, verticalBelow = 240) {
    if (!point) return null;
    const desiredCenterX = point.x + player.w / 2;
    let best = null;
    let bestScore = Infinity;
    for (const p of platforms) {
      if (!isSpawnSupportPlatform(p)) continue;
      const top = p.y - player.h;
      const nearX = desiredCenterX >= p.x - horizontalPadding && desiredCenterX <= p.x + p.w + horizontalPadding;
      const nearY = top >= point.y - verticalAbove && top <= point.y + verticalBelow;
      if (!nearX || !nearY) continue;
      const platformCenterX = clampValue(desiredCenterX, p.x + 8, p.x + p.w - 8);
      const xDistance = Math.abs(desiredCenterX - platformCenterX);
      const yDistance = Math.abs(top - point.y);
      const safeBonus = isSafePlatform(p) ? -18 : 0;
      const movingPenalty = ['float', 'elevator', 'moving', 'raft'].includes(p.kind) ? 4 : 0;
      const cookiePenalty = p.kind === 'cookie' ? 28 : 0;
      const score = yDistance * 2 + xDistance + movingPenalty + cookiePenalty + safeBonus;
      if (score < bestScore) {
        bestScore = score;
        best = spawnPointOnPlatform(point, p);
      }
    }
    return best;
  }

  function findFallbackSpawnPosition(point) {
    let best = null;
    let bestScore = Infinity;
    for (const p of platforms) {
      if (!isSpawnSupportPlatform(p) || p.kind === 'cookie') continue;
      const top = p.y - player.h;
      const score = Math.abs((point?.x || 0) - p.x) + Math.abs((point?.y || 0) - top);
      if (score < bestScore) {
        bestScore = score;
        best = spawnPointOnPlatform(point || level.start, p);
      }
    }
    return best;
  }

  function resolveSafeSpawnPosition(point, fallback = level?.start) {
    return findSafeSpawnPosition(point)
      || findSafeSpawnPosition(point, 96, 180, 320)
      || findSafeSpawnPosition(fallback)
      || findSafeSpawnPosition(fallback, 96, 180, 320)
      || findFallbackSpawnPosition(fallback)
      || {
        x: clampValue((fallback || point || { x: 70 }).x, 0, WORLD_W - player.w),
        y: clampValue((fallback || point || { y: 390 }).y, 0, H - player.h - 8),
        platform: null
      };
  }

  function placePlayerAtSafeSpawn(point, options = {}) {
    const safe = resolveSafeSpawnPosition(point, options.fallback || level?.start);
    player.x = safe.x;
    player.y = safe.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = !!safe.platform;
    player.surfaceKind = safe.platform ? safe.platform.kind : null;
    player.coyote = safe.platform ? coyoteFrames : 0;
    player.jumpBuffer = 0;
    if (options.updateLastSafe !== false) player.lastSafe = { x: player.x, y: player.y };
    if (options.graceFrames) respawnGraceTimer = Math.max(respawnGraceTimer, options.graceFrames);
    if (options.invulnFrames) player.invuln = Math.max(player.invuln, options.invulnFrames);
    return safe;
  }

  function recoverUnsafeFallDuringGrace() {
    placePlayerAtSafeSpawn(player.lastSafe, {
      fallback: level.start,
      graceFrames: spawnGraceFrames,
      invulnFrames: 60
    });
  }

  function enemyHasGroundAhead(enemy) {
    const probeX = enemy.vx >= 0 ? enemy.x + enemy.w + 6 : enemy.x - 6;
    const probeY = enemy.y + enemy.h + 8;
    for (const p of platforms) {
      if (!p.alive || p.kind === 'sugarGate' || p.kind === 'break') continue;
      const withinX = probeX >= p.x + 4 && probeX <= p.x + p.w - 4;
      const nearTop = probeY >= p.y && probeY <= p.y + p.h + 14;
      if (withinX && nearTop) return true;
    }
    return false;
  }

  function enemyStandingOnPlatform(enemy, platform, previousX, previousY) {
    if (!enemy.alive) return false;
    const enemyBottom = enemy.y + enemy.h;
    const overlapAtPreviousX = enemy.x + enemy.w > previousX + 5 && enemy.x < previousX + platform.w - 5;
    const platformTopMin = Math.min(previousY, platform.y);
    const platformTopMax = Math.max(previousY, platform.y);
    return overlapAtPreviousX && enemyBottom >= platformTopMin - 4 && enemyBottom <= platformTopMax + 8;
  }

  function carrySupportedEnemies(platform, dx, dy, previousX, previousY) {
    if (dx === 0 && dy === 0) return;
    for (const enemy of enemies) {
      if (!enemyStandingOnPlatform(enemy, platform, previousX, previousY)) continue;
      enemy.x += dx;
      enemy.y += dy;
      enemy.y = platform.y - enemy.h;
    }
  }

  function snapSpawnToGround() {
    placePlayerAtSafeSpawn({ x: player.x, y: player.y }, { fallback: level?.start, updateLastSafe: true });
  }

  function update() {
    time += 1;
    updateMusic();
    if (gameState !== 'menu' && gameState !== 'map') {
      updateParticles();
      updateAmbientParticles();
    }
    if (gameState === 'map') {
      mapPulse += 0.05;
      if (mapBranchHintTimer > 0) mapBranchHintTimer--;
      if (mapArrivalTimer > 0) mapArrivalTimer--;
      if (mapMarkerProgress < 1) {
        mapMarkerProgress = Math.min(1, mapMarkerProgress + 0.08);
        if (mapMarkerProgress >= 1) {
          mapArrivalTimer = 24;
          sound('checkpoint');
        }
      }
      if (mapRevealTimer > 0) {
        mapRevealTimer--;
        return;
      }
      if (mapMoveCooldown > 0) mapMoveCooldown--;
      const mapLeft = keys.has('ArrowLeft') || keys.has('KeyA') || touch.left;
      const mapRight = keys.has('ArrowRight') || keys.has('KeyD') || touch.right;
      if (mapMoveCooldown === 0 && mapMarkerProgress >= 1) {
        const nodes = selectableMapNodes();
        const currentNode = mapMarkerToIndex;
        const currentIdx = Math.max(0, nodes.indexOf(currentNode));
        if (mapLeft && currentIdx > 0) {
          selectMapNode(nodes[currentIdx - 1]);
        } else if (mapRight && currentIdx < nodes.length - 1) {
          selectMapNode(nodes[currentIdx + 1]);
        }
      }
      return;
    }
    if (paused && gameState === 'playing') return;
    if (gameState !== 'playing') {
      if (gameState === 'escape') {
        escapeTimer++;
        if (escapeTimer === 30 || escapeTimer === 86 || escapeTimer === 148) {
          burst(W * 0.5, H * 0.42, 18, '#fff27a');
          sound('checkpoint');
        }
        if (escapeTimer >= 232) {
          endingTimer = 0;
          gameState = 'ending';
          sound('ending');
        }
      }
      if (gameState === 'ending') endingTimer++;
      return;
    }

    if (winTimer > 0) {
      winTimer++;
      player.anim += 0.11;
      if (winTimer === 120) {
        if (isHiddenBonusStageIndex(levelIndex)) {
          enterWorldMap(BONUS_STAGE_INDEX);
        } else if (isBranchStageIndex(levelIndex)) {
          const branchParentIndex = levelIndex - MAIN_LEVEL_COUNT;
          const nextMainIndex = branchParentIndex + 1;
          if (nextMainIndex < MAIN_LEVEL_COUNT) {
            setUnlockedLevel(nextMainIndex);
            enterWorldMap(nextMainIndex);
          } else {
            enterWorldMap(levelIndex);
          }
        } else if (levelIndex < MAIN_LEVEL_COUNT - 1) {
          setUnlockedLevel(levelIndex + 1);
          enterWorldMap(mainPathBranchStageAfterMainLevel(levelIndex) ?? levelIndex + 1);
        } else {
          escapeTimer = 0;
          gameState = 'escape';
          sound('win');
        }
      }
      return;
    }

    levelTimer = Math.max(0, levelTimer - 1);
    if (levelTimer === 0) {
      loseLife('time');
      return;
    }

    const left = keys.has('ArrowLeft') || keys.has('KeyA') || touch.left;
    const right = keys.has('ArrowRight') || keys.has('KeyD') || touch.right;
    const jumpHeld = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space');
    const inRush = sugarTimer > 0;
    const speedBoost = inRush ? 1.38 : 1;

    for (const p of platforms) {
      const previousX = p.x;
      const previousY = p.y;
      if (!p.alive && p.respawnTimer > 0) {
        p.respawnTimer--;
        if (p.respawnTimer <= 0) {
          p.alive = true;
          p.crumbleTimer = 0;
        }
      }
      if ((p.kind === 'moving' || p.kind === 'raft') && p.alive) {
        p.x += p.speed * p.dir;
        if (p.x < p.minX || p.x > p.maxX) {
          p.dir *= -1;
          p.x = Math.max(p.minX, Math.min(p.maxX, p.x));
        }
      }
      if ((p.kind === 'float' || p.kind === 'elevator') && p.alive) {
        p.y += p.speed * p.dir;
        if (p.y < p.minY || p.y > p.maxY) {
          p.dir *= -1;
          p.y = Math.max(p.minY, Math.min(p.maxY, p.y));
        }
      }
      if (p.alive && (p.kind === 'moving' || p.kind === 'raft' || p.kind === 'float' || p.kind === 'elevator')) {
        carrySupportedEnemies(p, p.x - previousX, p.y - previousY, previousX, previousY);
      }
      if (p.kind === 'blinkGate') {
        const cycle = (p.openFor || 80) + (p.closedFor || 90);
        p.open = ((time + (p.phase || 0)) % cycle) < (p.openFor || 80);
      }
      if (p.hit > 0) p.hit--;
      if (p.kind === 'cookie' && p.alive && p.crumbleTimer > 0) {
        p.crumbleTimer = Math.max(0, p.crumbleTimer - (player.onGround ? 0 : 0.5));
      }
    }

    for (const enemy of enemies) {
      if (enemy.noRespawn || enemy.alive || enemy.respawnTimer <= 0) continue;
      enemy.respawnTimer--;
      const farFromPlayer = Math.abs((player.x + player.w / 2) - (enemy.spawnX + enemy.w / 2)) > 180;
      if (enemy.respawnTimer <= 0 && farFromPlayer) {
        enemy.x = enemy.spawnX;
        enemy.y = enemy.spawnY;
        enemy.vx = enemy.baseSpeed;
        enemy.alive = true;
        enemy.hurtTimer = 0;
        enemy.alert = false;
        burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 10, '#79f0c3');
      } else if (enemy.respawnTimer <= 0) {
        enemy.respawnTimer = 45;
      }
    }

    if (left) { player.vx -= accel * speedBoost; player.face = -1; }
    if (right) { player.vx += accel * speedBoost; player.face = 1; }
    if (player.onGround && player.surfaceKind === 'syrup') player.vx *= 0.72;
    if (!left && !right) player.vx *= friction;
    player.vx = Math.max(-maxSpeed * speedBoost, Math.min(maxSpeed * speedBoost, player.vx));
    if (Math.abs(player.vx) < 0.05) player.vx = 0;

    if (footstepCooldown > 0) footstepCooldown--;
    if (player.onGround && Math.abs(player.vx) > 1.2 && footstepCooldown === 0) {
      sound(Math.abs(player.vx) > 4.4 ? 'run' : 'step');
      footstepCooldown = Math.abs(player.vx) > 4.4 ? 9 : 14;
    }

    if (jumpPressed) player.jumpBuffer = bufferFrames;
    jumpPressed = false;

    if (player.onGround) player.coyote = coyoteFrames;
    else player.coyote = Math.max(0, player.coyote - 1);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - 1);

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = jumpPower * (inRush ? 1.08 : 1);
      player.onGround = false;
      player.jumpBuffer = 0;
      player.coyote = 0;
      burst(player.x + player.w / 2, player.y + player.h, 10, '#fff2a8');
      sound('jump');
    }
    if (!jumpHeld && player.vy < -4) player.vy *= 0.92;

    const prevY = player.y;
    const wasGrounded = player.onGround;
    player.vy += player.vy > 0 ? fallGravity : gravity;
    player.vy = Math.min(player.vy, 18);

    player.x += player.vx;
    player.x = Math.max(0, Math.min(WORLD_W - player.w, player.x));
    player.y += player.vy;
    player.onGround = false;
    player.surfaceKind = null;

    let landing = null;
    let landingY = Infinity;
    for (const p of platforms) {
      if (!p.alive || p.kind === 'sugarGate' || (p.kind === 'blinkGate' && !p.open)) continue;
      const overlapX = player.x + player.w > p.x + 5 && player.x < p.x + p.w - 5;
      const wasAbove = prevY + player.h <= p.y + 2;
      const crossedTop = player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + 26;
      if (player.vy >= 0 && overlapX && wasAbove && crossedTop && p.y < landingY) {
        landing = p;
        landingY = p.y;
      }
    }

    if (landing) {
      player.y = landing.y - player.h;
      player.onGround = true;
      if (!wasGrounded) player.landedTimer = 8;
      if (landing.kind === 'bounce') {
        player.vy = -14.8;
        player.onGround = false;
        burst(player.x + player.w / 2, landing.y, 16, '#fff');
        sound('bounce');
        shake = 4;
      } else {
        player.vy = 0;
        if (isSafePlatform(landing) && playerSafelySupportedBy(landing)) player.lastSafe = { x: player.x, y: player.y };
        if (landing.kind === 'moving' || landing.kind === 'raft') player.x += landing.speed * landing.dir;
        if (landing.kind === 'float' || landing.kind === 'elevator') player.y += landing.speed * landing.dir;
        if (landing.kind === 'tilt') player.vx += (player.x + player.w / 2 < landing.x + landing.w / 2 ? -0.18 : 0.18);
        if (landing.kind === 'slide') player.vx += landing.slideDir || 0.26;
        player.surfaceKind = landing.kind;
        if (landing.kind === 'cookie') {
          landing.crumbleTimer = Math.min(90, (landing.crumbleTimer || 0) + 2);
          if (landing.crumbleTimer === 58) sound('gate');
          if (landing.crumbleTimer >= 108) {
            landing.alive = false;
            landing.respawnTimer = 220;
            landing.crumbleTimer = 0;
            player.onGround = false;
            player.vy = Math.max(player.vy, 2.5);
            burst(landing.x + landing.w / 2, landing.y + landing.h / 2, 20, '#f7c471');
            sound('gate');
            shake = 4;
          }
        }
      }
    }

    for (const p of platforms) {
      if (!p.alive || p.kind !== 'break') continue;
      if (rectsOverlap(player, p)) {
        if (inRush || player.vy < 0) {
          p.alive = false;
          burst(p.x + p.w / 2, p.y + p.h / 2, 18, '#f7c471');
          sound('gate');
          shake = 5;
        } else {
          p.hit = 8;
        }
      }
    }

    for (const p of platforms) {
      if (!p.alive || (p.kind !== 'sugarGate' && p.kind !== 'blinkGate')) continue;
      if (p.kind === 'blinkGate' && p.open) continue;
      if (rectsOverlap(player, p)) {
        if (inRush) {
          p.alive = false;
          burst(p.x + p.w / 2, p.y + p.h / 2, 35, '#fff27a');
          sound('gate');
          shake = 7;
        } else {
          if (player.x + player.w / 2 < p.x + p.w / 2) player.x = p.x - player.w;
          else player.x = p.x + p.w;
          player.vx = 0;
        }
      }
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const enemyMidX = enemy.x + enemy.w / 2;
      const playerMidX = player.x + player.w / 2;
      enemy.alert = Math.abs(playerMidX - enemyMidX) < 190 && Math.abs((player.y + player.h / 2) - (enemy.y + enemy.h / 2)) < 120;
      if (enemy.chase) {
        if (!enemy.chaseActive && player.x >= enemy.triggerX) {
          enemy.chaseActive = true;
          enemy.vx = enemy.baseSpeed;
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 18, '#f7a14a');
          sound('gate');
        }
        if (!enemy.chaseActive) continue;
        enemy.x += enemy.vx;
        if (enemy.x > enemy.maxX) {
          enemy.alive = false;
          continue;
        }
      } else {
        const dir = enemy.vx === 0 ? 1 : Math.sign(enemy.vx);
        const alertScale = enemy.kind === 'jaw' ? 1.14 : enemy.kind === 'beetle' ? 1.08 : enemy.kind === 'gummy' ? 1.1 : 0.94;
        const targetSpeed = enemy.baseSpeed * (enemy.alert ? alertScale : 1);
        enemy.vx += (dir * targetSpeed - enemy.vx) * 0.14;
        enemy.x += enemy.vx;
        const outOfRange = enemy.x < enemy.minX || enemy.x > enemy.maxX;
        const noGroundAhead = !outOfRange && !enemyHasGroundAhead(enemy);
        if (outOfRange || noGroundAhead) {
          enemy.vx *= -1;
          if (enemy.alert && enemy.kind !== 'jaw' && time % 8 === 0) burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 4, '#fff5dc');
          if (outOfRange) enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x));
          else enemy.x += enemy.vx * 2;
        }
      }
      if (enemy.hurtTimer > 0) enemy.hurtTimer--;

      const enemyHit = { x: enemy.x + 6, y: enemy.y + 4, w: enemy.w - 12, h: enemy.h - 4 };
      const stomp = !enemy.noStomp && rectsOverlap(player, enemyHit) && player.vy > 1.5 && prevY + player.h <= enemy.y + 12;
      if (stomp) {
        enemy.alive = false;
        enemy.hurtTimer = 40;
        enemy.respawnTimer = 300;
        player.vy = -10.8;
        player.invuln = Math.max(player.invuln, 18);
        score += 3;
        sugar = Math.min(100, sugar + 10);
        burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 14, '#79f0c3');
        sound('stomp');
      } else if (rectsOverlap(player, enemyHit) && player.invuln <= 0 && player.vy > -3) {
        hurtPlayer();
      }
    }

    for (const candy of candies) {
      if (candy.taken) continue;
      candy.bob += 0.08;
      const hit = { x: candy.x - 14, y: candy.y + Math.sin(candy.bob) * 5 - 14, w: 28, h: 28 };
      if (rectsOverlap(player, hit)) {
        candy.taken = true;
        score += 1;
        sugar += candy.kind.startsWith('star_') ? 12 : 8;
        if (sugar >= 100) {
          sugar = 0;
          sugarTimer = 380;
          burst(player.x + player.w / 2, player.y, 30, '#fff27a');
          sound('sugar');
        }
        burst(candy.x, candy.y, 10, candy.kind.startsWith('star_') ? '#fff27a' : '#ff74ba');
        sound('collect');
        while (totalCandy + score >= nextExtraLifeAt) {
          lives = Math.min(maxLives + 4, lives + 1);
          nextExtraLifeAt += 45;
          burst(player.x + player.w / 2, player.y, 18, '#fff27a');
          sound('life');
        }
      }
    }

    for (const special of specials) {
      if (special.taken) continue;
      special.bob += 0.06;
      const hit = { x: special.x - 18, y: special.y + Math.sin(special.bob) * 6 - 18, w: 36, h: 36 };
      if (rectsOverlap(player, hit)) collectSpecial(special);
    }

    for (const zone of wonderZones) {
      if (zone.done) continue;
      if (rectsOverlap(player, zone)) triggerWonder(zone);
    }

    for (const cp of checkpoints) {
      const pad = { x: cp.x, y: cp.y, w: 46, h: 46 };
      if (!cp.active && rectsOverlap(player, pad)) {
        const safeCheckpoint = resolveSafeSpawnPosition({ x: player.x, y: player.y }, level.start);
        const safeStart = resolveSafeSpawnPosition(level.start, level.start);
        cp.active = true;
        player.lastSafe = safeCheckpoint.platform
          ? { x: safeCheckpoint.x, y: safeCheckpoint.y }
          : { x: safeStart.x, y: safeStart.y };
        player.hearts = Math.min(maxHearts, player.hearts + 1);
        burst(cp.x + 22, cp.y + 12, 14, '#fff27a');
        sound('checkpoint');
      }
    }

    if (rectsOverlap(player, goal)) {
      grantStageMedals();
      bankLevelCandy();
      winTimer = 1;
      burst(player.x + player.w / 2, player.y, 60, '#fff27a');
      chordWin();
    }

    if (player.y > H + 120) {
      if (respawnGraceTimer > 0) recoverUnsafeFallDuringGrace();
      else loseLife('fall');
    }

    if (player.invuln > 0) player.invuln--;
    if (respawnGraceTimer > 0) respawnGraceTimer--;
    if (player.landedTimer > 0) player.landedTimer--;
    if (player.hurtTimer > 0) player.hurtTimer--;
    if (levelIntroTimer > 0) levelIntroTimer--;
    if (storyTimer > 0) storyTimer--;
    if (wonderTextTimer > 0) wonderTextTimer--;
    if (sugarTimer > 0) {
      sugarTimer--;
      if (time % 4 === 0) particles.push({ x: player.x + player.w / 2 - player.face * 8, y: player.y + 28, vx: -player.face * 0.7 + (Math.random() - 0.5), vy: (Math.random() - 0.5) * 1.5, r: 3 + Math.random() * 3, life: 28, color: '#fff27a' });
    }

    player.anim += Math.max(0.08, Math.abs(player.vx) * 0.12);
    const camTarget = player.x + player.w / 2 - W * 0.42 + player.vx * 20;
    cameraX += (camTarget - cameraX) * 0.08;
    cameraX = Math.max(0, Math.min(WORLD_W - W, cameraX));
    if (shake > 0) shake *= 0.86;
  }

  function hurtPlayer() {
    runTookDamage = true;
    player.hearts--;
    player.invuln = 100;
    player.hurtTimer = 28;
    player.vx = -player.face * 4.2;
    player.vy = -7.4;
    sugar = Math.max(0, sugar - 18);
    burst(player.x + player.w / 2, player.y + player.h / 2, 14, '#71dfff');
    sound('hurt');
    shake = 5;
    if (player.hearts <= 0) {
      loseLife('hurt');
    }
  }

  function loseLife(reason) {
    if (gameState !== 'playing') return;
    lives--;
    if (lives < 0) lives = 0;
    if (lives === 0) {
      player.hearts = 0;
      gameState = 'gameover';
      sound('hurt');
      burst(player.x + player.w / 2, player.y + player.h / 2, 36, '#ff74ba');
      return;
    }
    respawn();
    if (reason === 'fall') sound('fall');
  }

  function respawn() {
    levelTimer = levelTimeLimit;
    footstepCooldown = 0;
    placePlayerAtSafeSpawn(player.lastSafe, {
      fallback: level.start,
      graceFrames: spawnGraceFrames,
      invulnFrames: 132
    });
    player.hurtTimer = 0;
    player.hearts = maxHearts;
    sugar = Math.max(0, sugar - 20);
    burst(player.x + player.w / 2, player.y + player.h, 14, '#71dfff');
  }

  function burst(x, y, count, color) {
    const colors = [color, '#79f0c3', '#ff74ba', '#fff5dc', '#71dfff', '#f7a14a'];
    const burstCount = reducedEffectsMode() ? Math.ceil(count * 0.6) : count;
    for (let i = 0; i < burstCount; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 7 - 1,
        r: 2 + Math.random() * 4,
        life: 28 + Math.random() * 34,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }
    clampParticles();
  }

  function updateParticles() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.11;
      p.life--;
    }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
    clampParticles();
  }

  function updateAmbientParticles() {
    if (!level) return;
    const targetCount = ambientParticleTargetCount(level.theme);
    if (ambientParticles.length > targetCount) ambientParticles.length = targetCount;
    for (let i = 0; i < ambientParticles.length; i++) {
      const p = ambientParticles[i];
      p.x += p.vx;
      p.y += p.vy + Math.sin(time * 0.015 + p.twinkle) * 0.04 * p.sway;
      p.twinkle += 0.015 + p.sway * 0.004;
      if (p.x < -28 || p.y < -28 || p.y > H + 28) {
        ambientParticles[i] = buildAmbientParticle(level.theme);
        ambientParticles[i].x = W + Math.random() * 40;
        ambientParticles[i].y = Math.random() * H;
      }
    }
    while (ambientParticles.length < targetCount) ambientParticles.push(buildAmbientParticle(level.theme));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    if (gameState === 'map') {
      drawWorldMap();
    } else {
      drawBackground();
      if (gameState !== 'menu') drawAmbientParticles();
      ctx.save();
      ctx.translate(-cameraX, 0);
      if (gameState !== 'menu') {
        drawDecor();
        drawPlatforms();
        drawSigns();
        drawFriendlyNpcs();
        drawCheckpoints();
        drawGoal();
        drawCandies();
        drawSpecials();
        drawEnemies();
        drawPlayer();
        drawParticles();
      }
      ctx.restore();
      drawHUD();
    }
    if (levelIntroTimer > 0 && gameState === 'playing' && winTimer === 0) drawLevelIntro();
    if (storyTimer > 0 && gameState === 'playing' && winTimer === 0) drawStoryBanner();
    if (wonderTextTimer > 0 && gameState === 'playing' && winTimer === 0) drawWonderBanner();
    if (winTimer > 0 && gameState === 'playing') drawWin();
    if (paused && gameState === 'playing') drawPause();
    if (gameState === 'escape') drawEscape();
    if (gameState === 'ending') drawEnding();
    if (gameState === 'gameover') drawGameOver();

    ctx.restore();
  }

  function drawBackground() {
    if (!level) return;
    const theme = LEVEL_BACKGROUNDS[level.theme] || LEVEL_BACKGROUNDS.meadow;
    const bg = backgroundImages[level.theme] || backgroundImages.meadow;
    if (bg && bg.complete && bg.naturalWidth > 0) {
      const drew = drawArtBackground(bg, level.theme);
      if (!drew) {
        ctx.fillStyle = '#c8fff1';
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = '#c8fff1';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = theme.haze;
    const hazeCount = reducedEffectsMode() ? 2 : 4;
    for (let i = 0; i < hazeCount; i++) {
      const x = ((i * 420 - time * 0.14) % (W + 520)) - 140;
      ctx.beginPath();
      ctx.ellipse(x, 88 + (i % 2) * 36, 74, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#fffaf1';
    const lightBandCount = reducedEffectsMode() ? 1 : 3;
    for (let i = 0; i < lightBandCount; i++) {
      const x = ((i * 310 + time * 0.22) % (W + 240)) - 120;
      ctx.fillRect(x, 0, 46, H);
    }
    ctx.restore();
  }

  function drawAmbientParticles() {
    if (!level) return;
    for (const p of ambientParticles) {
      const pulse = 0.72 + Math.sin(p.twinkle) * 0.28;
      ctx.save();
      ctx.globalAlpha = p.alpha * pulse;
      if (p.kind === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'sparkle') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - p.r, p.y);
        ctx.lineTo(p.x + p.r, p.y);
        ctx.moveTo(p.x, p.y - p.r);
        ctx.lineTo(p.x, p.y + p.r);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r * 0.92, p.r * 0.72, Math.sin(p.twinkle) * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawDecor() {
    if (!levelDecor.length) return;
    for (const d of levelDecor) {
      const img = assets[d.img];
      if (!img) continue;
      const bobAmp = d.bobAmp ?? (d.img.includes('arch') ? 3 : 5);
      const bob = Math.sin(time * (d.floatSpeed || 0.018) + d.x * 0.01) * bobAmp;
      const sway = Math.sin(time * (d.swingSpeed || 0.014) + d.y * 0.01) * (d.swingAmp ?? (d.img.includes('lollipop') ? 4 : 1.8));
      ctx.save();
      ctx.globalAlpha = (d.alpha ?? 0.64) + Math.sin(time * 0.02 + d.x * 0.02) * 0.04;
      ctx.translate(0, bob);
      if (sway !== 0) ctx.rotate((sway * Math.PI) / 720);
      if (d.tint) {
        ctx.filter = renderFilter(`drop-shadow(0 0 10px ${d.tint})`);
      } else if (d.img.includes('arch')) {
        ctx.filter = renderFilter('drop-shadow(0 0 10px rgba(255,255,255,0.25))');
      }
      drawImageBottom(img, d.x, d.y, d.h || 72, d.w, d.flip || 1);
      if (d.img.includes('arch') && Math.sin(time * 0.06 + d.x * 0.03) > 0.68) {
        ctx.globalAlpha = 0.4;
        drawImageCentered(assets.star_pink, d.x + 26, d.y - 14, 16);
      }
      ctx.restore();
    }
  }

  function drawSigns() {
    for (const sign of signHints) {
      ctx.save();
      ctx.fillStyle = 'rgba(122,72,46,0.95)';
      ctx.fillRect(sign.x + 18, sign.y + 14, 6, 34);
      roundRect(sign.x, sign.y, 64, 24, 8, 'rgba(255,248,239,0.96)', 'rgba(122,72,46,0.18)');
      ctx.fillStyle = '#a45627';
      ctx.font = '900 9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('HINT', sign.x + 32, sign.y + 15);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 8px system-ui';
      ctx.fillText(sign.text.length > 18 ? sign.text.slice(0, 18) : sign.text, sign.x + 32, sign.y + 24);
      ctx.restore();
    }
    ctx.textAlign = 'start';
  }

  function drawFriendlyNpcs() {
    for (const npc of friendlyNpcs) {
      const bob = Math.sin(time * 0.09 + npc.bob) * 3;
      const frame = assets[npc.frame];
      if (!frame) continue;
      ctx.save();
      ctx.filter = renderFilter('drop-shadow(0 0 8px rgba(255,248,239,0.65))');
      drawImageBottom(frame, npc.x, npc.y + bob, 42, 42, 1);
      if (npc.text) {
        roundRect(npc.x - 10, npc.y - 34 + bob, 122, 24, 10, 'rgba(255,248,239,0.88)', 'rgba(255,255,255,0.65)');
        ctx.fillStyle = '#5a2e20';
        ctx.font = '800 9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(npc.text, npc.x + 51, npc.y - 18 + bob, 112);
      }
      ctx.restore();
    }
    ctx.textAlign = 'start';
  }

  function currentPlatformTheme() {
    return level && level.theme ? level.theme : 'meadow';
  }

  function basePlatformImage(p) {
    if (p.kind === 'icing') return p.w > 260 ? assets.icing_long : assets.icing_block2;
    if (p.kind === 'choco') return p.w > 200 ? assets.choco_long : assets.choco_double;
    if (p.kind === 'cookie') {
      if (p.crumbleTimer >= 52) return assets.cookie_cracked_3;
      if (p.crumbleTimer >= 30) return assets.cookie_cracked_2;
      if (p.crumbleTimer >= 12) return assets.cookie_cracked_1;
      return p.w > 160 ? assets.cookie_long : assets.cookie_block;
    }
    if (p.kind === 'wafer') return p.w > 200 ? assets.wafer_long : assets.wafer_platform;
    if (p.kind === 'syrup') return p.w > 140 ? assets.choco_long : assets.choco_double;
    if (p.kind === 'tilt') return assets.wafer_bar;
    if (p.kind === 'slide') return assets.icing_block2;
    if (p.kind === 'moving') return assets.wafer_moving;
    if (p.kind === 'raft') return assets.marshmallow_2;
    if (p.kind === 'elevator') return assets.icing_block;
    if (p.kind === 'break') return p.hit ? assets.cookie_cracked_2 : assets.cookie_cracked_1;
    return assets.icing_long;
  }

  function themedPlatformImage(p, theme) {
    const baseImg = basePlatformImage(p);
    if (theme === 'meadow' || theme === 'lollipops' || theme === 'gummy') {
      if (p.kind === 'icing') return p.w > 180 ? assets.candy_cane_straight || assets.icing_strip || baseImg : assets.lollipop_green || baseImg;
      if (p.kind === 'cookie') return p.crumbleTimer > 0 ? baseImg : assets.candy_cane_pink || assets.lollipop_swirl || baseImg;
      if (p.kind === 'moving') return assets.rod_pink || assets.wafer_moving || baseImg;
      if (p.kind === 'break') return p.hit ? assets.cookie_cracked_2 : assets.lollipop_orange || baseImg;
    }
    if (theme === 'falls' || theme === 'mallows') {
      if (p.kind === 'icing' || p.kind === 'slide') return p.w > 170 ? assets.icing_strip || assets.icing_long || baseImg : assets.icing_block2 || baseImg;
      if (p.kind === 'cookie' || p.kind === 'choco') return assets.marshmallow_2 || assets.icing_block || baseImg;
      if (p.kind === 'moving') return assets.icing_strip || assets.wafer_moving || baseImg;
      if (p.kind === 'break') return p.hit ? assets.cookie_cracked_2 : assets.wafer_broken || baseImg;
    }
    if (theme === 'woods' || theme === 'jungle') {
      if (p.kind === 'icing' || p.kind === 'cookie') return p.w > 190 ? assets.wafer_long || baseImg : assets.wafer_platform || baseImg;
      if (p.kind === 'choco' || p.kind === 'syrup') return assets.wafer_block2 || assets.choco_double || baseImg;
      if (p.kind === 'moving') return assets.wafer_moving || baseImg;
      if (p.kind === 'break') return p.hit ? assets.wafer_broken || baseImg : assets.wafer_block3 || baseImg;
    }
    if (theme === 'courtyard' || theme === 'keep' || theme === 'sky') {
      if (p.kind === 'icing') return p.w > 180 ? assets.frosting_ground || assets.icing_long || baseImg : assets.cake_disc_1 || assets.icing_block || baseImg;
      if (p.kind === 'cookie') return p.crumbleTimer > 0 ? baseImg : assets.cake_disc_2 || assets.cookie_block || baseImg;
      if (p.kind === 'choco') return assets.gate_piece || assets.choco_double || baseImg;
      if (p.kind === 'moving') return assets.gate_piece || assets.wafer_moving || baseImg;
      if (p.kind === 'elevator') return assets.cake_disc_3 || assets.icing_block || baseImg;
      if (p.kind === 'break') return p.hit ? assets.gate_broken || baseImg : assets.gate_piece || baseImg;
    }
    return baseImg;
  }

  function platformThemeStyle(theme, kind) {
    if (theme === 'meadow' || theme === 'lollipops' || theme === 'gummy') {
      return { glow: 'rgba(255,158,208,0.22)', stroke: 'rgba(255,255,255,0.58)', filter: kind === 'break' ? 'none' : 'saturate(1.12) brightness(1.04)', accent: '#ff74ba' };
    }
    if (theme === 'falls' || theme === 'mallows') {
      return { glow: 'rgba(137,228,255,0.26)', stroke: 'rgba(238,252,255,0.70)', filter: 'saturate(0.95) brightness(1.12)', accent: '#89e4ff' };
    }
    if (theme === 'woods' || theme === 'jungle') {
      return { glow: 'rgba(186,243,170,0.20)', stroke: 'rgba(255,241,199,0.58)', filter: 'saturate(1.08) brightness(0.98)', accent: '#baf3aa' };
    }
    if (theme === 'courtyard') {
      return { glow: 'rgba(255,176,212,0.24)', stroke: 'rgba(255,245,164,0.62)', filter: 'saturate(1.06) brightness(1.04)', accent: '#ffb0d4' };
    }
    if (theme === 'keep' || theme === 'sky') {
      return { glow: 'rgba(135,240,204,0.24)', stroke: 'rgba(254,248,224,0.64)', filter: 'saturate(0.98) brightness(1.02)', accent: '#87f0cc' };
    }
    return { glow: 'rgba(255,255,255,0.18)', stroke: 'rgba(255,255,255,0.45)', filter: 'none', accent: '#fff27a' };
  }

  function platformRenderStyle(style) {
    if (!reducedEffectsMode()) return style;
    return {
      ...style,
      glow: 'rgba(255,255,255,0)',
      stroke: 'rgba(255,255,255,0)'
    };
  }

  function drawPlatformAccent(p, theme, drawY, style) {
    if (reducedEffectsMode()) return;
    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + 8, drawY + 4);
    ctx.lineTo(p.x + p.w - 8, drawY + 4);
    ctx.stroke();

    if (theme === 'meadow' || theme === 'lollipops' || theme === 'gummy') {
      const icon = theme === 'gummy' ? assets.gumdrop_pink : assets.lollipop_swirl;
      if (icon && p.w >= 84) drawImageCentered(icon, p.x + p.w / 2, drawY + 1, 18);
    } else if (theme === 'falls' || theme === 'mallows') {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.beginPath();
      ctx.arc(p.x + p.w - 20, drawY + 2, 5, 0, Math.PI * 2);
      ctx.arc(p.x + 20, drawY + 3, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if ((theme === 'woods' || theme === 'jungle') && p.kind === 'syrup') {
      ctx.fillStyle = 'rgba(122,72,46,0.55)';
      ctx.fillRect(p.x + 8, drawY + 4, Math.max(0, p.w - 16), 7);
    } else if (theme === 'courtyard' || theme === 'keep' || theme === 'sky') {
      const icon = theme === 'keep' ? assets.gate_piece : assets.star_pink;
      if (icon && p.w >= 78) drawImageCentered(icon, p.x + p.w / 2, drawY + 1, 16);
    }
    ctx.restore();
  }

  function reducedPlatformColors(theme, kind) {
    if (kind === 'cookie' || kind === 'break') return { fill: '#f7c471', top: '#fff0b8', stroke: '#b8753a' };
    if (kind === 'choco') return { fill: '#8f5a40', top: '#d6a36a', stroke: '#5a2e20' };
    if (kind === 'wafer' || kind === 'tilt') return { fill: '#d9a24f', top: '#ffe0a4', stroke: '#916033' };
    if (kind === 'syrup') return { fill: '#9b5a36', top: '#f0a15e', stroke: '#6a3824' };
    if (theme === 'falls' || theme === 'mallows') return { fill: '#a8edff', top: '#f5fdff', stroke: '#57b8dc' };
    if (theme === 'woods' || theme === 'jungle') return { fill: '#b7d66a', top: '#fff0a3', stroke: '#6f8f3d' };
    if (theme === 'courtyard' || theme === 'keep' || theme === 'sky') return { fill: '#ffb7d6', top: '#fff2b8', stroke: '#c76b9b' };
    if (theme === 'gummy') return { fill: '#ff8fc8', top: '#ffd4ea', stroke: '#c65394' };
    return { fill: '#ff9ed0', top: '#fff1f8', stroke: '#cf5c9d' };
  }

  function drawReducedPlatformSurface(p, theme, drawY) {
    const colors = reducedPlatformColors(theme, p.kind);
    roundRect(p.x, drawY, p.w, Math.max(12, p.h), 6, colors.fill, colors.stroke);
    ctx.save();
    ctx.globalAlpha = 0.58;
    roundRect(p.x + 4, drawY + 3, Math.max(0, p.w - 8), 4, 4, colors.top, 'rgba(255,255,255,0)');
    ctx.restore();
    if (p.kind === 'syrup') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#6a3824';
      ctx.fillRect(p.x + 8, drawY + Math.max(6, p.h - 7), Math.max(0, p.w - 16), 4);
      ctx.restore();
    }
  }

  function drawThemedPlatformSprite(img, p, drawY, h, style) {
    if (reducedEffectsMode()) {
      drawReducedPlatformSurface(p, currentPlatformTheme(), drawY);
      return;
    }
    const renderStyle = platformRenderStyle(style);
    roundRect(p.x - 3, drawY - 3, p.w + 6, Math.max(16, p.h + 8), 7, renderStyle.glow, renderStyle.stroke);
    ctx.save();
    ctx.filter = renderFilter(renderStyle.filter);
    drawImageBottom(img, p.x, drawY + p.h + 12, h, p.w);
    ctx.restore();
    drawPlatformAccent(p, currentPlatformTheme(), drawY, renderStyle);
  }

  function drawThemedBouncePlatform(p, theme) {
    const pulse = Math.sin(time * 0.18 + p.x * 0.02) * 2;
    const style = platformRenderStyle(platformThemeStyle(theme, p.kind));
    const img = theme === 'woods' || theme === 'jungle'
      ? assets.gumdrop_green || assets.marshmallow_1
      : theme === 'courtyard' || theme === 'keep' || theme === 'sky'
        ? assets.cake_disc_3 || assets.marshmallow_1
        : theme === 'falls' || theme === 'mallows'
          ? assets.marshmallow_2 || assets.marshmallow_1
          : assets.gumdrop_pink || assets.marshmallow_1;
    roundRect(p.x - 5, p.y + 3, p.w + 10, p.h + 14, 10, style.glow, style.stroke);
    drawImageBottom(img, p.x - 4, p.y + p.h + 6 + pulse, 40 - pulse * 0.5, p.w + 8);
  }

  function drawThemedFloatPlatform(p, theme) {
    if (reducedEffectsMode()) {
      drawReducedPlatformSurface(p, theme, p.y);
      return;
    }
    const style = platformRenderStyle(platformThemeStyle(theme, p.kind));
    const top = theme === 'meadow' || theme === 'lollipops' || theme === 'gummy'
      ? assets.candy_cane_pink || assets.candy_cane_straight || assets.lollipop_swirl
      : theme === 'falls' || theme === 'mallows'
        ? assets.marshmallow_2 || assets.icing_strip
        : theme === 'woods' || theme === 'jungle'
          ? assets.wafer_platform || assets.wafer_long
          : assets.cake_disc_2 || assets.frosting_ground || assets.icing_block;
    const stem = theme === 'woods' || theme === 'jungle'
      ? assets.wafer_pole || assets.lollipop_green
      : theme === 'courtyard' || theme === 'keep' || theme === 'sky'
        ? assets.frosting_column || assets.gate_post || assets.lollipop_green
        : assets.lollipop_pink || assets.lollipop_green;
    roundRect(p.x - 4, p.y + 1, p.w + 8, p.h + 11, 8, style.glow, style.stroke);
    if (stem) drawImageBottom(stem, p.x + p.w / 2 - 20, p.y + p.h + 22, 54, 40);
    if (top) drawImageBottom(top, p.x, p.y + p.h + 10, 34, p.w);
  }

  function drawThemedGate(p, theme, openAlpha = 0.95, star = assets.star_blue) {
    const style = platformRenderStyle(platformThemeStyle(theme, p.kind));
    ctx.save();
    ctx.globalAlpha = openAlpha;
    ctx.filter = renderFilter(style.filter);
    drawImageBottom(assets.gate_intact, p.x, p.y + p.h, p.h + 18, p.w);
    if (assets.gate_post && p.w >= 56) {
      drawImageBottom(assets.gate_post, p.x - 8, p.y + p.h, p.h + 8, 16);
      drawImageBottom(assets.gate_post, p.x + p.w - 8, p.y + p.h, p.h + 8, 16);
    }
    ctx.globalAlpha = Math.min(openAlpha, 0.34);
    drawImageCentered(star, p.x + p.w / 2, p.y + p.h / 2, 14);
    ctx.restore();
  }

  function drawPlatforms() {
    const theme = currentPlatformTheme();
    for (const p of platforms) {
      if (!p.alive) continue;
      let drawY = p.y + (p.hit ? Math.sin(time * 0.5) * 2 : 0);
      let img = themedPlatformImage(p, theme);
      let h = p.h + 16;
      const style = platformThemeStyle(theme, p.kind);
      if (p.kind === 'sugarGate') {
        drawThemedGate(p, theme, 0.95, assets.star_purple);
        ctx.save();
        ctx.globalAlpha = 0.22 + Math.sin(time * 0.12 + p.x * 0.01) * 0.08;
        drawImageCentered(assets.star_purple, p.x + p.w / 2, p.y + p.h / 2, 14);
        ctx.restore();
        continue;
      }
      if (p.kind === 'blinkGate') {
        drawThemedGate(p, theme, p.open ? 0.25 : 0.95, assets.star_blue);
        continue;
      }
      if (p.kind === 'bounce') {
        drawThemedBouncePlatform(p, theme);
        continue;
      }
      if (p.kind === 'float') {
        drawThemedFloatPlatform(p, theme);
        continue;
      }
      if (p.kind === 'raft') drawY += Math.sin(time * 0.08 + p.x * 0.01) * 3;
      drawThemedPlatformSprite(img, p, drawY, h, style);
    }
  }

  function drawCheckpoints() {
    for (const cp of checkpoints) {
      const scaleH = cp.active ? 64 : 58;
      drawImageBottom(assets.cupcake_checkpoint, cp.x - 5, cp.y + 45, scaleH, 54);
      if (cp.active) {
        ctx.save();
        ctx.globalAlpha = 0.85 + Math.sin(time * 0.18) * 0.15;
        drawImageCentered(assets.star_pink, cp.x + 20, cp.y - 6, 22);
        ctx.restore();
      }
    }
  }

  function drawGoal() {
    drawImageBottom(assets.candy_arch, goal.x - 14, goal.y + goal.h, 118, 84);
  }

  function drawCandies() {
    for (const c of candies) {
      if (c.taken) continue;
      const bob = Math.sin(c.bob) * 5;
      drawImageCentered(assets[c.kind], c.x, c.y + bob, c.kind.startsWith('star_') ? 28 : 22);
    }
  }

  function drawSpecials() {
    for (const special of specials) {
      if (special.taken) continue;
      const bob = Math.sin(special.bob) * 6;
      ctx.save();
      ctx.globalAlpha = 0.24 + Math.sin(time * 0.12 + special.index) * 0.08;
      ctx.fillStyle = '#fff6c8';
      ctx.beginPath();
      ctx.arc(special.x, special.y + bob, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawImageCentered(assets[special.kind], special.x, special.y + bob, 34);
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      const frames = ENEMY_FRAMES[e.kind];
      const keys = e.alive ? frames.walk : frames.hurt;
      const frame = keys[Math.floor(time / 8) % keys.length];
      const alertAmp = e.alert ? 1.45 : 1;
      const hop = e.giant ? 0 : e.kind === 'gummy' ? Math.abs(Math.sin(time * 0.12)) * 8 * alertAmp : e.kind === 'jaw' ? Math.sin(time * 0.32) * 2 * alertAmp : e.kind === 'marsh' ? Math.abs(Math.sin(time * 0.18 + e.x * 0.03)) * (e.alert ? 5 : 2) : 0;
      const y = e.y + e.h - hop;
      const drawH = e.giant ? 78 : e.kind === 'jaw' ? 44 : e.kind === 'beetle' ? 42 : 48;
      const drawW = e.giant ? 78 : e.kind === 'jaw' ? 44 : 46;
      ctx.save();
      if (e.alert && !e.giant) ctx.filter = renderFilter('drop-shadow(0 0 8px rgba(255,245,220,0.8))');
      drawImageBottom(assets[frame], e.x - (e.giant ? 12 : 6), y + (e.giant ? 10 : 8), drawH, drawW, e.vx < 0 ? -1 : 1);
      if (e.alert && !e.giant) {
        ctx.globalAlpha = 0.45 + Math.sin(time * 0.25) * 0.15;
        drawImageCentered(assets.star_blue, e.x + e.w / 2, e.y - 6, 12);
      }
      ctx.restore();
    }
  }

  function currentMapHeroFrame() {
    const set = HERO_FRAMES[selectedHero];
    if (mapMarkerProgress < 1) {
      const frames = set.run.length > 3 ? [set.run[1], set.run[3]] : [set.run[0], set.run[set.run.length - 1]];
      return frames[Math.floor(time / 10) % frames.length];
    }
    return set.idle[0];
  }

  function currentHeroFrame() {
    const set = HERO_FRAMES[selectedHero];
    if (winTimer > 0 || gameState === 'ending') return set.celebrate[Math.floor(time / 10) % set.celebrate.length];
    if (player.hurtTimer > 0) return set.hurt[Math.floor(time / 8) % set.hurt.length];
    if (!player.onGround) {
      if (player.vy < 0) return set.jump[Math.floor(time / 10) % set.jump.length];
      return set.land[Math.floor(time / 10) % set.land.length];
    }
    if (player.landedTimer > 0) return set.land[Math.floor(time / 7) % set.land.length];
    if (Math.abs(player.vx) > 0.25) {
      if ((player.face > 0 && (keys.has('ArrowLeft') || keys.has('KeyA'))) || (player.face < 0 && (keys.has('ArrowRight') || keys.has('KeyD')))) return set.skid[0];
      return set.run[Math.floor(player.anim) % set.run.length];
    }
    return set.idle[Math.floor(time / 18) % set.idle.length];
  }

  function drawPlayer() {
    const frame = assets[currentHeroFrame()];
    const heroHeight = sugarTimer > 0 ? 84 : 78;
    const flair = allSpecialsComplete() || hasAllSpecialsInLevel(levelIndex);
    if (player.invuln > 0 && Math.floor(time / 5) % 2 === 0) ctx.globalAlpha = 0.45;
    if (sugarTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(time * 0.3) * 0.15;
      ctx.filter = renderFilter('drop-shadow(0 0 18px rgba(255, 239, 120, 0.95))');
      drawImageBottom(frame, player.x - 8, player.y + player.h + 6, heroHeight, undefined, player.face > 0 ? 1 : -1);
      ctx.restore();
    }
    if (flair) {
      ctx.save();
      ctx.globalAlpha = 0.24 + Math.sin(time * 0.18) * 0.08;
      ctx.filter = renderFilter('drop-shadow(0 0 12px rgba(255,242,122,0.95))');
      drawImageBottom(frame, player.x - 8, player.y + player.h + 6, heroHeight + 2, undefined, player.face > 0 ? 1 : -1);
      ctx.restore();
    }
    drawImageBottom(frame, player.x - 8, player.y + player.h + 6, heroHeight, undefined, player.face > 0 ? 1 : -1);
    if (flair) drawImageCentered(assets.star_pink, player.x + player.w / 2, player.y - 8, 14);
    ctx.globalAlpha = 1;
  }

  function drawArtBackground(img, layoutKey) {
    if (!img || !img.complete || img.naturalWidth <= 0) return false;
    const compact = isMobileCanvas();
    const layout = BACKGROUND_LAYOUTS[layoutKey] || BACKGROUND_LAYOUTS.worldMap;
    const extraScale = (compact ? layout.mobileScale : layout.scale) || 1;
    const focusX = compact ? (layout.mobileFocusX ?? layout.focusX ?? 0.5) : (layout.focusX ?? 0.5);
    const focusY = layout.focusY ?? 0.5;

    const baseScale = Math.max(W / img.width, H / img.height);
    const scale = baseScale * extraScale;
    const w = img.width * scale;
    const h = img.height * scale;

    const rawX = W * 0.5 - w * focusX;
    const rawY = H * 0.5 - h * focusY;
    const x = Math.min(0, Math.max(W - w, rawX));
    const y = Math.min(0, Math.max(H - h, rawY));
    ctx.drawImage(img, x, y, w, h);
    return true;
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / 55);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function refreshCanvasProfile() {
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const stage = canvas.parentElement;
    const rect = stage ? stage.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const minViewport = Math.min(window.innerWidth, window.innerHeight);
    compactCanvasCached = coarse || rect.width < 1180 || rect.height < 620 || minViewport < 760;
    coarsePointerCached = coarse;
    tabletCanvasCached = compactCanvasCached && minViewport >= 760;
    reducedEffectsActive = compactCanvasCached;
    canvasProfileReady = true;
  }

  function isMobileCanvas() {
    if (!canvasProfileReady) refreshCanvasProfile();
    return compactCanvasCached;
  }

  function reducedEffectsMode() {
    if (!canvasProfileReady) refreshCanvasProfile();
    return reducedEffectsActive;
  }

  function renderFilter(filterValue) {
    return reducedEffectsMode() ? 'none' : filterValue;
  }

  function updateText(element, key, value) {
    if (hudCache[key] === value) return;
    hudCache[key] = value;
    element.textContent = value;
  }

  function updateDomHud() {
    if (!level) return;
    const showHud = gameState === 'playing';
    const levelSpecialTotal = levelSpecialCount(levelIndex);
    const levelSpecialFound = collectedSpecialCount(levelIndex);
    const sideStage = isBranchStageIndex(levelIndex);
    const hiddenBonus = isHiddenBonusStageIndex(levelIndex);
    updateText(hudLevelName, 'levelName', level.name);
    updateText(hudLevelValue, 'levelValue', hiddenBonus ? 'Bonus' : sideStage ? 'Side' : `${levelIndex + 1}/${MAIN_LEVEL_COUNT}`);
    updateText(hudCandyValue, 'candy', String(score));
    updateText(hudTotalValue, 'totalCandy', String(totalCandy + score));
    updateText(hudHeartsValue, 'hearts', `${Math.max(0, player.hearts)}/${maxHearts}`);
    updateText(hudLivesValue, 'lives', String(lives));
    updateText(hudTimeValue, 'time', formatLevelTimer(levelTimer));
    updateText(hudSpecialsValue, 'specials', levelSpecialTotal > 0 ? `${levelSpecialFound}/${levelSpecialTotal}` : '—');
    updateText(hudTipText, 'tip', level.tip);
    updateText(hudLifeText, 'lifeText', `Next extra life at ${nextExtraLifeAt} total candy`);
    updateText(hudChapterText, 'chapter', level.chapter);
    const sugarWidth = `${Math.max(0, Math.min(100, sugarTimer > 0 ? 100 : sugar))}%`;
    if (hudCache.sugarWidth !== sugarWidth) {
      hudCache.sugarWidth = sugarWidth;
      hudSugarFill.style.width = sugarWidth;
    }
    if (hudCache.showHud !== showHud) {
      hudCache.showHud = showHud;
      canvas.parentElement.classList.toggle('hud-hidden', !showHud);
    }
  }

  function drawHUD() {
    updateDomHud();
  }

  function drawStoryBanner() {
    const compact = isMobileCanvas();
    if (compact) return;
    const alpha = Math.min(1, storyTimer / 40);
    ctx.save();
    ctx.globalAlpha = alpha;
    roundRect(120, 398, 720, 92, 22, 'rgba(74,38,29,.70)', 'rgba(255,255,255,.55)');
    ctx.fillStyle = '#fff8ea';
    ctx.font = '900 18px system-ui';
    ctx.fillText(level.story, 146, 435, 666);
    ctx.font = '800 14px system-ui';
    ctx.fillStyle = '#ffe28e';
    ctx.fillText('Keep moving through the candy world and stay on the safest path.', 146, 463);
    ctx.restore();
  }

  function drawWonderBanner() {
    const compact = isMobileCanvas();
    const alpha = Math.min(1, wonderTextTimer / 26);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (compact) {
      roundRect(82, H - 214, 796, 66, 22, 'rgba(255,248,239,.90)', 'rgba(255,255,255,.70)');
      ctx.fillStyle = '#d83787';
      ctx.font = '900 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Sweet Surprise', W / 2, H - 186);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 11px system-ui';
      ctx.fillText(wonderText, W / 2, H - 166, 720);
    } else {
      roundRect(164, 428, 632, 68, 20, 'rgba(255,248,239,.90)', 'rgba(255,255,255,.70)');
      ctx.fillStyle = '#d83787';
      ctx.font = '900 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Sweet Surprise', W / 2, 454);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 13px system-ui';
      ctx.fillText(wonderText, W / 2, 476, 560);
    }
    ctx.restore();
    ctx.textAlign = 'start';
  }

  function drawLevelIntro() {
    const compact = isMobileCanvas();
    if (compact) return;
    const alpha = Math.min(1, levelIntroTimer / 24);
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha + 0.05);
    {
      roundRect(200, 108, 560, 108, 26, 'rgba(255,255,255,.90)', '#ffffff');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d83787';
      ctx.font = '900 18px system-ui';
      ctx.fillText(level.chapter, W / 2, 140);
      ctx.font = '900 34px system-ui';
      ctx.fillText(level.name, W / 2, 176);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 17px system-ui';
      ctx.fillText('Cross the candy world and keep heading toward home.', W / 2, 205);
    }
    ctx.restore();
    ctx.textAlign = 'start';
  }

  function drawWorldMap() {
    const compact = isMobileCanvas();
    const reduced = reducedEffectsMode();
    const reveal = mapRevealTimer > 0 ? 1 - (mapRevealTimer / 42) : 1;
    const globalAllSpecials = allSpecialsComplete();
    const worldMap = currentWorldMapData();
    const mainNodes = worldMap.mainNodes || WORLD_MAP_NODES;
    const branchNodes = worldMap.branchNodes || WORLD_MAP_BRANCH_NODES;
    const mapBonusNode = worldMap.bonusNode || WORLD_MAP_BONUS_NODE;
    const nodeLayout = mainNodes.map(node => ({
      x: compact ? (node.mobileX ?? node.x) : node.x,
      y: compact ? (node.mobileY ?? node.y) : node.y,
      labelDy: compact ? (node.mobileLabelDy ?? node.labelDy ?? 38) : (node.labelDy ?? 42)
    }));
    const branchLayout = branchNodes.map(node => ({
      ...node,
      x: compact ? (node.mobileX ?? node.x) : node.x,
      y: compact ? (node.mobileY ?? node.y) : node.y
    }));
    const bonusNode = {
      ...mapBonusNode,
      x: compact ? (mapBonusNode.mobileX ?? mapBonusNode.x) : mapBonusNode.x,
      y: compact ? (mapBonusNode.mobileY ?? mapBonusNode.y) : mapBonusNode.y
    };
    const mainLayoutForStageIndex = stageIndex => {
      const nodeIndex = WORLD_MAP_NODES.findIndex((node, index) => mapNodeStageIndex(node, index) === stageIndex);
      return nodeIndex >= 0 ? nodeLayout[nodeIndex] : null;
    };
    const pointForMapIndex = index => {
      if (isBonusNodeId(index) || index === BONUS_STAGE_INDEX) return bonusNode;
      if (isBranchNodeId(index)) {
        return branchLayout.find(branch => branch.levelIndex === index - MAP_NODE_BRANCH_OFFSET) || nodeLayout[0];
      }
      return nodeLayout[index] || nodeLayout[0];
    };

    ctx.save();
    if (worldMapBackground.complete && worldMapBackground.naturalWidth > 0) {
      ctx.globalAlpha = 0.48 + reveal * 0.52;
      drawArtBackground(worldMapBackground, 'worldMap');
    } else {
      ctx.globalAlpha = 0.16 + reveal * 0.18;
      ctx.fillStyle = '#10142c';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 0.02 + reveal * 0.03;
    ctx.fillStyle = '#10142c';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = reveal;
    ctx.textAlign = 'center';
    ctx.lineCap = 'round';
    if (compact) {
      roundRect(24, 18, 238, 34, 15, 'rgba(255,248,239,.76)', 'rgba(255,255,255,.76)');
      ctx.fillStyle = '#d83787';
      ctx.font = '900 13px system-ui';
      ctx.fillText('World 1: Candy Meadow', 143, 40);
    }
    for (let i = 1; i < nodeLayout.length; i++) {
      const from = nodeLayout[i - 1];
      const to = nodeLayout[i];
      const openSegment = unlockedLevel >= mapNodeUnlockLevel(WORLD_MAP_NODES[i], i);
      ctx.strokeStyle = openSegment ? 'rgba(255,186,218,.94)' : 'rgba(255,255,255,.30)';
      ctx.lineWidth = compact ? (openSegment ? 10 : 8) : (openSegment ? 11 : 9);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      if (openSegment) {
        ctx.strokeStyle = 'rgba(255,248,239,.72)';
        ctx.lineWidth = compact ? 4 : 5;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    for (const branch of branchLayout) {
      if (branch.levelIndex > unlockedLevel) continue;
      const main = mainLayoutForStageIndex(branch.levelIndex);
      if (!main) continue;
      ctx.strokeStyle = rewardRouteUnlocked(branch.levelIndex) ? 'rgba(255,240,170,.72)' : 'rgba(255,255,255,.28)';
      ctx.lineWidth = compact ? 5 : 6;
      ctx.beginPath();
      ctx.moveTo(main.x, main.y);
      ctx.quadraticCurveTo((main.x + branch.x) / 2, Math.min(main.y, branch.y) - (compact ? 18 : 22), branch.x, branch.y);
      ctx.stroke();
    }

    for (const branch of branchLayout) {
      const nextMain = mainLayoutForStageIndex(branch.levelIndex + 1);
      if (!nextMain || branch.levelIndex + 1 > unlockedLevel || !rewardRouteUnlocked(branch.levelIndex)) continue;
      ctx.strokeStyle = 'rgba(255,240,170,.58)';
      ctx.lineWidth = compact ? 4 : 5;
      ctx.beginPath();
      ctx.moveTo(branch.x, branch.y);
      ctx.quadraticCurveTo((branch.x + nextMain.x) / 2, Math.min(branch.y, nextMain.y) - (compact ? 14 : 18), nextMain.x, nextMain.y);
      ctx.stroke();
    }

    if (globalAllSpecials) {
      const gateNode = nodeLayout[WORLD_MAP_NODES.length - 1];
      ctx.strokeStyle = 'rgba(255,242,122,.82)';
      ctx.lineWidth = compact ? 6 : 7;
      ctx.beginPath();
      ctx.moveTo(gateNode.x, gateNode.y);
      ctx.quadraticCurveTo((gateNode.x + bonusNode.x) / 2, bonusNode.y - (compact ? 14 : 18), bonusNode.x, bonusNode.y);
      ctx.stroke();
    }

    mainNodes.forEach((node, index) => {
      const pos = nodeLayout[index];
      const stageIndex = mapNodeStageIndex(node, index);
      const unlockLevel = mapNodeUnlockLevel(node, index);
      const unlocked = unlockedLevel >= unlockLevel;
      const completed = isBranchStageIndex(stageIndex)
        ? unlockedLevel > stageIndex - MAIN_LEVEL_COUNT
        : stageIndex < unlockedLevel;
      const isNext = index === mapMarkerToIndex;
      const specialTotal = levelSpecialCount(stageIndex);
      const specialFound = collectedSpecialCount(stageIndex);
      const allSpecials = specialTotal > 0 && specialFound === specialTotal;
      const medals = medalProgress[stageIndex] || { swift: false, steady: false, specialist: false };
      const plateFill = unlocked ? node.plate : 'rgba(240,234,238,.76)';
      const ringFill = unlocked ? node.color : '#d8c8d0';
      const plateW = compact ? (isNext ? 72 : 64) : 62;
      const plateH = compact ? (isNext ? 64 : 58) : 58;
      const iconSize = compact ? (node.icon === 'candy_arch' ? 32 : 23) : (node.icon === 'candy_arch' ? 34 : 24);

      roundRect(pos.x - plateW / 2, pos.y - plateH / 2, plateW, plateH, compact ? 18 : 20, plateFill, 'rgba(90,46,32,.12)');
      ctx.fillStyle = ringFill;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - 2, compact ? (isNext ? 21 : 17) : (isNext ? 21 : 18), 0, Math.PI * 2);
      ctx.fill();

      if (unlocked) {
        drawImageCentered(assets[node.icon], pos.x, pos.y - 4, iconSize);
        drawImageCentered(assets[node.badge], pos.x + (compact ? 15 : 14), pos.y - (compact ? 16 : 16), compact ? 12 : 13);
      } else {
        ctx.fillStyle = '#8f7f88';
        ctx.font = compact ? '900 11px system-ui' : '900 11px system-ui';
        ctx.fillText('LOCK', pos.x, pos.y + 2);
      }

      if (completed) {
        roundRect(pos.x - (compact ? 18 : 20), pos.y - (compact ? 40 : 44), compact ? 36 : 40, compact ? 12 : 14, 7, 'rgba(255,255,255,.88)', 'rgba(216,55,135,.18)');
        ctx.fillStyle = '#d83787';
        ctx.font = compact ? '900 8px system-ui' : '900 9px system-ui';
        ctx.fillText('CLEAR', pos.x, pos.y - (compact ? 31 : 34));
        roundRect(pos.x - (compact ? 28 : 32), pos.y + pos.labelDy + (compact ? 18 : 20), compact ? 56 : 64, compact ? 10 : 11, 6, 'rgba(255,232,170,.96)', 'rgba(216,55,135,.12)');
        ctx.fillStyle = '#a45627';
        ctx.font = compact ? '900 7px system-ui' : '900 8px system-ui';
        ctx.fillText('WORLD CLEAR', pos.x, pos.y + pos.labelDy + (compact ? 25 : 28));
      }

      if (isNext) {
        ctx.strokeStyle = '#fff27a';
        ctx.lineWidth = compact ? 5 : 5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - 2, compact ? 27 + Math.sin(mapPulse) * 1.6 : 25 + Math.sin(mapPulse) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      const badgeStep = compact ? 13 : 13;
      const badgeY = pos.y + pos.labelDy - (compact ? 11 : 10);
      for (let badgeIndex = 0; badgeIndex < specialTotal; badgeIndex++) {
        const badgeX = pos.x + (badgeIndex - (specialTotal - 1) / 2) * badgeStep;
        if (badgeIndex < specialFound) {
          drawImageCentered(assets[node.stamp], badgeX, badgeY, compact ? 9 : 10);
        } else {
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, compact ? 4 : 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      roundRect(pos.x - (compact ? 34 : 28), pos.y + pos.labelDy, compact ? 68 : 58, compact ? 18 : 15, 9, isNext ? 'rgba(255,242,122,.90)' : 'rgba(255,248,239,.78)', isNext ? 'rgba(216,55,135,.20)' : 'rgba(90,46,32,.10)');
      ctx.fillStyle = unlocked ? '#5a2e20' : '#7f7078';
      ctx.font = compact ? '900 11px system-ui' : '800 10px system-ui';
      ctx.fillText(node.label, pos.x, pos.y + pos.labelDy + (compact ? 13 : 11));

      const medalY = pos.y - (compact ? 20 : 24);
      const medalXStart = pos.x - (compact ? 14 : 18);
      [['swift', 'star_blue'], ['steady', 'bean_green'], ['specialist', 'star_pink']].forEach(([key, icon], medalIdx) => {
        if (!medals[key]) return;
        drawImageCentered(assets[icon], medalXStart + medalIdx * (compact ? 14 : 16), medalY, compact ? 8 : 10);
      });

      if (allSpecials) {
        roundRect(pos.x - (compact ? 18 : 20), pos.y + pos.labelDy + (compact ? 18 : 20), compact ? 36 : 40, compact ? 11 : 12, 6, 'rgba(255,255,255,.86)', 'rgba(255,242,122,.28)');
        ctx.fillStyle = '#d83787';
        ctx.font = compact ? '900 7px system-ui' : '900 8px system-ui';
        ctx.fillText('BONUS', pos.x, pos.y + pos.labelDy + (compact ? 26 : 29));
        drawImageCentered(assets.star_pink, pos.x + (compact ? 24 : 28), pos.y - (compact ? 28 : 32), compact ? 12 : 14);
      }
    });

    for (const branch of branchLayout) {
      if (branch.levelIndex > unlockedLevel) continue;
      const worldDone = hasAllSpecialsInLevel(branch.levelIndex);
      const branchUnlocked = rewardRouteUnlocked(branch.levelIndex);
      const branchSelected = mapMarkerToIndex === branchNodeId(branch.levelIndex);
      const branchHint = mapBranchHintTimer > 0;
      const plateW = compact ? 54 : 54;
      const plateH = compact ? 44 : 42;
      roundRect(branch.x - plateW / 2, branch.y - plateH / 2, plateW, plateH, compact ? 15 : 17, branchUnlocked ? branch.plate : 'rgba(240,234,238,.78)', 'rgba(90,46,32,.10)');
      ctx.fillStyle = branchUnlocked ? branch.color : '#d8c8d0';
      ctx.beginPath();
      ctx.arc(branch.x, branch.y - 4, compact ? 14 : 14, 0, Math.PI * 2);
      ctx.fill();
      if (branchHint) {
        ctx.save();
        ctx.strokeStyle = branchUnlocked ? 'rgba(255,242,122,.84)' : 'rgba(255,255,255,.62)';
        ctx.lineWidth = compact ? 3 : 4;
        ctx.beginPath();
        ctx.arc(branch.x, branch.y - 4, (compact ? 17 : 20) + Math.sin(mapPulse * 2 + branch.levelIndex) * (compact ? 1.4 : 1.8), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (branchSelected && branchUnlocked) {
        ctx.strokeStyle = '#fff27a';
        ctx.lineWidth = compact ? 4 : 5;
        ctx.beginPath();
        ctx.arc(branch.x, branch.y - 4, compact ? 17 + Math.sin(mapPulse) * 1.2 : 20 + Math.sin(mapPulse) * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (branchUnlocked) {
        drawImageCentered(assets[branch.icon], branch.x, branch.y - 5, compact ? 17 : 18);
      } else {
        ctx.fillStyle = '#8f7f88';
        ctx.font = compact ? '900 9px system-ui' : '900 9px system-ui';
        ctx.fillText('LOCK', branch.x, branch.y - 1);
      }
      roundRect(branch.x - (compact ? 31 : 30), branch.y + (compact ? 17 : 16), compact ? 62 : 60, compact ? 15 : 13, 7, 'rgba(255,248,239,.82)', 'rgba(90,46,32,.08)');
      ctx.fillStyle = '#5a2e20';
      ctx.font = compact ? '800 9px system-ui' : '800 8px system-ui';
      ctx.fillText(branch.label, branch.x, branch.y + (compact ? 28 : 25));
      ctx.fillStyle = !branchUnlocked ? '#8f7f88' : worldDone ? '#d83787' : '#a45627';
      ctx.font = compact ? '900 6px system-ui' : '900 7px system-ui';
      ctx.fillText(!branchUnlocked ? 'LOCKED' : worldDone ? 'OPEN' : 'SIDE', branch.x, branch.y + (compact ? 39 : 35));
    }

    if (globalAllSpecials) {
      roundRect(bonusNode.x - (compact ? 32 : 36), bonusNode.y - (compact ? 28 : 30), compact ? 64 : 72, compact ? 52 : 58, compact ? 18 : 20, bonusNode.plate, 'rgba(255,242,122,.20)');
      ctx.fillStyle = bonusNode.color;
      ctx.beginPath();
      ctx.arc(bonusNode.x, bonusNode.y - 5, compact ? 16 : 18, 0, Math.PI * 2);
      ctx.fill();
      drawImageCentered(assets[bonusNode.icon], bonusNode.x, bonusNode.y - 6, compact ? 18 : 22);
      if (medalCount(BONUS_STAGE_INDEX) > 0) drawImageCentered(assets.star_blue, bonusNode.x + (compact ? 20 : 24), bonusNode.y - (compact ? 22 : 26), compact ? 10 : 12);
      roundRect(bonusNode.x - (compact ? 34 : 40), bonusNode.y + (compact ? 12 : 14), compact ? 68 : 80, compact ? 14 : 16, 7, 'rgba(255,248,239,.88)', 'rgba(255,242,122,.24)');
      ctx.fillStyle = '#d83787';
      ctx.font = compact ? '900 8px system-ui' : '900 9px system-ui';
      ctx.fillText(bonusNode.label, bonusNode.x, bonusNode.y + (compact ? 22 : 26));
      ctx.fillStyle = '#a45627';
      ctx.font = compact ? '900 6px system-ui' : '900 7px system-ui';
      ctx.fillText('SECRET', bonusNode.x, bonusNode.y + (compact ? 31 : 36));
    }

    if (globalAllSpecials && mapLevelIndex === BONUS_STAGE_INDEX) {
      ctx.strokeStyle = '#fff27a';
      ctx.lineWidth = compact ? 4 : 5;
      ctx.beginPath();
      ctx.arc(bonusNode.x, bonusNode.y - 5, compact ? 22 + Math.sin(mapPulse) * 1.5 : 25 + Math.sin(mapPulse) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    const markerFrom = pointForMapIndex(mapMarkerFromIndex);
    const markerTo = pointForMapIndex(mapMarkerToIndex);
    const markerT = mapMarkerProgress;
    const markerX = markerFrom.x + (markerTo.x - markerFrom.x) * markerT;
    const markerY = markerFrom.y + (markerTo.y - markerFrom.y) * markerT - (compact ? 12 : 14) - Math.sin(markerT * Math.PI) * 2;
    const markerFlip = markerTo.x >= markerFrom.x ? 1 : -1;
    drawImageBottom(assets[currentMapHeroFrame()], markerX - (compact ? 18 : 20), markerY + (compact ? 18 : 22), compact ? 42 : 46, undefined, markerFlip);
    if (mapArrivalTimer > 0) {
      const sparkleAlpha = mapArrivalTimer / 24;
      const sparkleCount = reduced ? 4 : 7;
      for (let i = 0; i < sparkleCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkleCount + mapPulse * 1.2;
        const radius = (compact ? 14 : 18) + (1 - sparkleAlpha) * (compact ? 14 : 18);
        const sx = markerTo.x + Math.cos(angle) * radius;
        const sy = markerTo.y - 6 + Math.sin(angle) * radius;
        ctx.save();
        ctx.globalAlpha = sparkleAlpha;
        drawImageCentered(i % 2 ? assets.star_pink : assets.star_blue, sx, sy, compact ? 8 + sparkleAlpha * 6 : 10 + sparkleAlpha * 8);
        ctx.restore();
      }
    }

    if (compact) {
      roundRect(W / 2 - 176, H - 102, 352, 72, 16, 'rgba(255,248,239,.82)', '#ffffff');
      ctx.fillStyle = '#5a2e20';
      ctx.font = '900 13px system-ui';
      ctx.fillText(getStageData(mapLevelIndex).name, W / 2, H - 78);
      ctx.font = '800 11px system-ui';
      const routeText = isBonusNodeId(mapMarkerToIndex) ? 'Hidden world open' : isBranchNodeId(mapMarkerToIndex) ? 'Side stage ready' : rewardRouteUnlocked(mapLevelIndex) ? 'Side stage open' : 'Main trail active';
      ctx.fillText(routeText, W / 2, H - 60);
      ctx.font = '800 9px system-ui';
      ctx.fillStyle = '#7a3c65';
      ctx.fillText(mapBranchHintTimer > 0 ? 'Side stages are pulsing on the map.' : 'Tap Jump or Go to play. Unlock side stages by finding all specials.', W / 2, H - 43, 322);
      if (globalAllSpecials) {
        roundRect(W - 188, 18, 164, 34, 12, 'rgba(255,248,239,.78)', '#ffffff');
        ctx.fillStyle = '#d83787';
        ctx.font = '900 10px system-ui';
        ctx.fillText('Secret Badge Ready', W - 106, 40);
      }
    } else if (globalAllSpecials) {
      roundRect(W - 248, 18, 204, 36, 14, 'rgba(255,248,239,.72)', '#ffffff');
      ctx.fillStyle = '#d83787';
      ctx.font = '900 12px system-ui';
      ctx.fillText('Secret Ending Badge Ready', W - 146, 42);
    } else if (!isBonusStageIndex(mapLevelIndex) && rewardRouteUnlocked(mapLevelIndex)) {
      roundRect(W - 230, 18, 186, 36, 14, 'rgba(255,248,239,.72)', '#ffffff');
      ctx.fillStyle = '#a45627';
      ctx.font = '900 12px system-ui';
      ctx.fillText('Safe Route Open', W - 137, 42);
    } else if (!isBonusStageIndex(mapLevelIndex)) {
      roundRect(W - 244, 18, 200, 36, 14, 'rgba(255,248,239,.72)', '#ffffff');
      ctx.fillStyle = '#a45627';
      ctx.font = '900 12px system-ui';
      ctx.fillText('Challenge Route Active', W - 144, 42);
    }

    if (!compact) {
      roundRect(18, H - 42, 258, 26, 12, 'rgba(255,248,239,.68)', '#ffffff');
      ctx.fillStyle = '#7a3c65';
      ctx.font = '800 11px system-ui';
      ctx.fillText(mapBranchHintTimer > 0 ? 'Side stages are highlighted on the map.' : 'Unlock side stages by finding all specials in that world.', 147, H - 25, 236);
    }

    if (mapRevealTimer > 0) {
      roundRect(W / 2 - (compact ? 74 : 86), H - (compact ? 42 : 48), compact ? 148 : 172, 24, 12, 'rgba(255,248,239,.66)', '#ffffff');
      ctx.fillStyle = '#d83787';
      ctx.font = compact ? '900 11px system-ui' : '900 12px system-ui';
      ctx.fillText('Path opening...', W / 2, H - (compact ? 26 : 30));
    }
    ctx.textAlign = 'start';
    ctx.restore();
  }

  function drawWin() {
    const compact = isMobileCanvas();
    const bonusStage = isHiddenBonusStageIndex(levelIndex);
    const sideStage = isBranchStageIndex(levelIndex);
    const rewardLines = lastStageRewards.length ? lastStageRewards.slice(0, compact ? 3 : 5) : ['No new rewards this run.'];
    const clearTitle = bonusStage ? 'Bonus Clear!' : sideStage ? 'Side Stage Clear!' : levelIndex < MAIN_LEVEL_COUNT - 1 ? 'Chapter Clear!' : 'The Way Home Is Open!';
    const clearLead = bonusStage
      ? 'You found the hidden world and brought the Morning Star safely through.'
      : sideStage
        ? level.success
      : levelIndex < MAIN_LEVEL_COUNT - 1
        ? level.success
        : 'Hold steady. The final scene is next.';
    if (compact) {
      roundRect(84, H - 228, 792, 184, 24, 'rgba(255,245,252,.92)', '#ffffff');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d83787';
      ctx.font = '900 24px system-ui';
      ctx.fillText(clearTitle, W / 2, H - 188);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 14px system-ui';
      ctx.fillText(clearLead, W / 2, H - 164, 704);
      ctx.font = '700 12px system-ui';
      ctx.fillText(`Specials ${collectedSpecialCount(levelIndex)}/${levelSpecialCount(levelIndex)}  ·  Time left ${formatLevelTimer(levelTimer)}`, W / 2, H - 140);
      ctx.fillStyle = '#d83787';
      ctx.font = '900 11px system-ui';
      ctx.fillText('Rewards', W / 2, H - 118);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '700 11px system-ui';
      rewardLines.forEach((line, idx) => ctx.fillText(`• ${line}`, W / 2, H - 96 + idx * 14, 704));
      ctx.font = '700 12px system-ui';
      ctx.fillText('Tap Go to continue.', W / 2, H - 42);
      ctx.textAlign = 'start';
      return;
    }
    roundRect(160, 112, 640, 364, 28, 'rgba(255,245,252,.96)', '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d83787';
    ctx.font = compact ? '900 34px system-ui' : '900 42px system-ui';
    ctx.fillText(clearTitle, W / 2, 188);
    ctx.fillStyle = '#5a2e20';
    ctx.font = '800 22px system-ui';
    ctx.fillText(bonusStage ? 'You cleared the hidden Morning Star Run.' : `You cleared ${level.name}.`, W / 2, 230);
    ctx.font = '700 18px system-ui';
    ctx.fillText(clearLead, W / 2, 270, 540);
    ctx.font = '700 16px system-ui';
    ctx.fillText(`Specials found ${collectedSpecialCount(levelIndex)}/${levelSpecialCount(levelIndex)}  ·  Time left ${formatLevelTimer(levelTimer)}`, W / 2, 304);
    ctx.fillStyle = '#d83787';
    ctx.font = '900 18px system-ui';
    ctx.fillText('Rewards Unlocked', W / 2, 338);
    ctx.fillStyle = '#5a2e20';
    ctx.font = '700 17px system-ui';
    rewardLines.forEach((line, idx) => ctx.fillText(`• ${line}`, W / 2, 368 + idx * 22, 520));
    ctx.textAlign = 'start';
  }

  function drawEscape() {
    const compact = isMobileCanvas();
    const t = escapeTimer;
    const runPhase = Math.min(1, t / 120);
    const fadePhase = Math.max(0, (t - 136) / 88);
    const heroSet = HERO_FRAMES[selectedHero];
    const runFrame = assets[heroSet.run[Math.floor(t / 8) % heroSet.run.length]];
    const heroX = 120 + runPhase * (W - 320);
    const heroY = H - (compact ? 182 : 196) - Math.sin(t * 0.18) * 3;
    const archX = W - 164;
    const archY = H - (compact ? 152 : 166);
    const specialsFound = totalSpecialsFound();
    const specialsTotal = totalSpecialCount();

    ctx.save();
    ctx.globalAlpha = 0.88;
    roundRect(0, H - (compact ? 154 : 172), W, compact ? 154 : 172, 0, 'rgba(255,241,232,.82)', 'rgba(255,255,255,0)');
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.24 + Math.sin(t * 0.14) * 0.08;
    for (let i = 0; i < 5; i++) {
      drawImageCentered(i % 2 ? assets.star_blue : assets.star_pink, 160 + i * (compact ? 120 : 150), H - (compact ? 170 : 186), compact ? 14 : 16);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,248,239,.82)';
    ctx.lineWidth = compact ? 16 : 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(80, H - (compact ? 104 : 116));
    ctx.bezierCurveTo(W * 0.32, H - (compact ? 122 : 138), W * 0.64, H - (compact ? 78 : 90), W - 128, H - (compact ? 112 : 124));
    ctx.stroke();
    ctx.restore();

    drawImageBottom(assets.candy_arch, archX - 34, archY, compact ? 132 : 150, compact ? 98 : 112);
    drawImageBottom(runFrame, heroX, heroY, compact ? 84 : 92, undefined, 1);
    if (allSpecialsComplete()) {
      drawImageCentered(assets.star_pink, heroX + 30, heroY - 18, compact ? 18 : 20);
      drawImageCentered(assets.star_blue, heroX + 6, heroY - 8, compact ? 14 : 16);
    }

    ctx.save();
    ctx.globalAlpha = 1 - fadePhase * 0.9;
    roundRect(W / 2 - (compact ? 212 : 256), 52, compact ? 424 : 512, compact ? 82 : 92, 24, 'rgba(255,248,239,.90)', '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d83787';
    ctx.font = compact ? '900 20px system-ui' : '900 26px system-ui';
    ctx.fillText('Final Run To Safety', W / 2, compact ? 84 : 92);
    ctx.fillStyle = '#5a2e20';
    ctx.font = compact ? '800 12px system-ui' : '800 16px system-ui';
    ctx.fillText('The child sprints across the last sweet bridge as the way home opens.', W / 2, compact ? 110 : 122);
    ctx.font = compact ? '700 11px system-ui' : '700 14px system-ui';
    ctx.fillText(`Candy ${totalCandy} · Specials ${specialsFound}/${specialsTotal}`, W / 2, compact ? 128 : 142);
    ctx.restore();

    if (fadePhase > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, fadePhase);
      ctx.fillStyle = 'rgba(255,252,244,.92)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d83787';
      ctx.textAlign = 'center';
      ctx.font = compact ? '900 26px system-ui' : '900 34px system-ui';
      ctx.fillText('Home At Last', W / 2, H * 0.34);
      ctx.fillStyle = '#5a2e20';
      ctx.font = compact ? '800 14px system-ui' : '800 18px system-ui';
      ctx.fillText('The candy wind settles. Morning light is waiting on the other side.', W / 2, H * 0.34 + 38, compact ? 680 : 760);
      ctx.restore();
    }
  }

  function drawEnding() {
    const compact = isMobileCanvas();
    const found = totalSpecialsFound();
    const total = totalSpecialCount();
    const perfect = found === total;
    const worldsCleared = unlockedLevel + 1;
    const bonusRoutes = rewardProgress.filter(Boolean).length;
    if (compact) {
      roundRect(66, H - 226, 828, 182, 26, 'rgba(255,248,239,.94)', '#ffffff');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d83787';
      ctx.font = '900 24px system-ui';
      ctx.fillText(perfect ? 'Secret Ending' : 'Run Complete', W / 2, H - 164);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 14px system-ui';
      ctx.fillText(`Total candy ${totalCandy}`, W / 2, H - 136);
      ctx.fillText(`Worlds ${worldsCleared}/${LEVELS.length} · Specials ${found}/${total}`, W / 2, H - 118);
      ctx.fillText(`Bonus routes ${bonusRoutes} · Lives left ${lives}`, W / 2, H - 100);
      if (perfect) {
        ctx.fillStyle = '#d83787';
        ctx.font = '900 12px system-ui';
        ctx.fillText('Morning Star Badge unlocked', W / 2, H - 82);
      }
      ctx.font = '700 12px system-ui';
      ctx.fillStyle = '#5a2e20';
      ctx.fillText('You crossed every candy land, opened the last path, and made it home safely.', W / 2, H - 64, 740);
      ctx.fillText('Tap Again to replay from your latest chapter.', W / 2, H - 46);
      ctx.textAlign = 'start';
      return;
    }
    roundRect(92, 62, 776, 430, 30, 'rgba(255,248,239,.98)', '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d83787';
    ctx.font = compact ? '900 18px system-ui' : '900 20px system-ui';
    ctx.fillText(perfect ? 'Secret Ending' : 'Ending', W / 2, compact ? 100 : 116);
    ctx.font = compact ? '900 34px system-ui' : '900 40px system-ui';
    ctx.fillText('The Child Finds The Way Back', W / 2, compact ? 142 : 160);
    drawImageCentered(assets.candy_arch, W / 2, compact ? 214 : 232, compact ? 112 : 126, compact ? 82 : 92);
    ctx.fillStyle = '#5a2e20';
    ctx.font = compact ? '800 18px system-ui' : '800 20px system-ui';
    ctx.fillText(perfect ? 'With every special star-candy gathered, the path home shines brighter than ever.' : 'After crossing the kingdom heights, the child finally reaches the way home.', W / 2, compact ? 302 : 320);
    ctx.font = compact ? '700 16px system-ui' : '700 18px system-ui';
    ctx.fillText(perfect ? 'The Morning Star Badge marks a perfect candy-world run.' : 'Morning is close, but the candy world is finally behind them.', W / 2, compact ? 334 : 352);
    ctx.fillText(`Run complete · Total candy ${totalCandy} · Specials ${found}/${total}`, W / 2, compact ? 364 : 382);
    ctx.fillText(`Worlds cleared ${worldsCleared}/${LEVELS.length} · Bonus routes opened ${bonusRoutes} · Lives left ${lives}`, W / 2, compact ? 390 : 406);
    if (perfect) {
      ctx.fillStyle = '#d83787';
      ctx.font = compact ? '800 17px system-ui' : '800 18px system-ui';
      ctx.fillText('Secret badge unlocked: Morning Star', W / 2, compact ? 418 : 432);
      drawImageCentered(assets.star_pink, W / 2 + 168, compact ? 416 : 430, compact ? 18 : 20);
    }
    ctx.fillStyle = '#5a2e20';
    ctx.font = compact ? '700 15px system-ui' : '700 17px system-ui';
    ctx.fillText('Found rewards:', W / 2, compact ? 440 : 452);
    ctx.fillText(`Map stamps ${worldsCleared} · Bonus stamps ${rewardProgress.filter(Boolean).length} · Hidden routes ${bonusRoutes}`, W / 2, compact ? 464 : 476);
    ctx.fillStyle = '#d83787';
    ctx.font = compact ? '800 17px system-ui' : '800 18px system-ui';
    ctx.fillText('Press Enter to play again from your latest unlocked chapter.', W / 2, compact ? 492 : 504);
    ctx.textAlign = 'start';
  }

  function drawPause() {
    if (isMobileCanvas()) {
      roundRect(290, H - 136, 380, 84, 22, 'rgba(255,248,239,.9)', '#ffffff');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d83787';
      ctx.font = '900 22px system-ui';
      ctx.fillText('Paused', W / 2, H - 102);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 12px system-ui';
      ctx.fillText('Tap Go to keep playing.', W / 2, H - 78);
      ctx.textAlign = 'start';
      return;
    }
    roundRect(330, 208, 300, 124, 26, 'rgba(255,248,239,.96)', '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d83787';
    ctx.font = '900 34px system-ui';
    ctx.fillText('Paused', W / 2, 252);
    ctx.fillStyle = '#5a2e20';
    ctx.font = '800 18px system-ui';
    ctx.fillText('Tap Resume or press P to keep going.', W / 2, 292);
    ctx.textAlign = 'start';
  }

  function drawGameOver() {
    const compact = isMobileCanvas();
    if (compact) {
      roundRect(82, H - 188, 796, 144, 24, 'rgba(255,245,252,.92)', '#ffffff');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d83787';
      ctx.font = '900 26px system-ui';
      ctx.fillText('Out Of Lives', W / 2, H - 142);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 14px system-ui';
      ctx.fillText('Tap Reset to lock the world and start fresh.', W / 2, H - 106);
      ctx.textAlign = 'start';
      return;
    }
    roundRect(176, 140, 608, 250, 28, 'rgba(255,245,252,.96)', '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d83787';
    ctx.font = compact ? '900 34px system-ui' : '900 42px system-ui';
    ctx.fillText('Out Of Lives', W / 2, compact ? 196 : 214);
    ctx.fillStyle = '#5a2e20';
    ctx.font = compact ? '800 20px system-ui' : '800 22px system-ui';
    ctx.fillText('The candy world pushed back this time.', W / 2, compact ? 240 : 258);
    ctx.font = compact ? '700 17px system-ui' : '700 18px system-ui';
    ctx.fillText('Press Enter or tap Reset All to relock the worlds and start fresh.', W / 2, compact ? 286 : 304);
    ctx.textAlign = 'start';
  }

  function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  function drawableImage(img) {
    return img && typeof img.width === 'number' && typeof img.height === 'number';
  }

  function drawImageCentered(img, cx, cy, height, width = null, flip = 1) {
    if (!drawableImage(img)) return;
    const h = height;
    const safeHeight = img.height || 1;
    const w = width ?? img.width * (h / safeHeight);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flip, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawImageBottom(img, x, bottomY, height, width = null, flip = 1) {
    if (!drawableImage(img)) return;
    const h = height;
    const safeHeight = img.height || 1;
    const w = width ?? img.width * (h / safeHeight);
    ctx.save();
    if (flip === -1) {
      ctx.translate(x + w / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, bottomY - h, w, h);
    } else {
      ctx.drawImage(img, x, bottomY - h, w, h);
    }
    ctx.restore();
  }

  function startLoopWhenReady() {
    const levelBackgroundsReady = backgroundImageList.every(img => img.candyQuestSettled);
    if (!loopStarted && levelBackgroundsReady) {
      loopStarted = true;
      loop();
    }
  }

  function markBackgroundSettled(img) {
    img.candyQuestSettled = true;
    startLoopWhenReady();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  const saveState = readVersionedSave();
  unlockedLevel = saveState.legacy.unlockedLevel;
  selectedHero = saveState.legacy.selectedHero;
  specialProgress = saveState.legacy.specialProgress;
  rewardProgress = saveState.legacy.rewardProgress;
  medalProgress = saveState.legacy.medalProgress;
  updateHeroButton();
  updateFullscreenButton();
  updatePauseButton();
  updateUiMode();
  bootToGame();
  backgroundImageList.forEach(img => {
    img.onload = () => markBackgroundSettled(img);
    img.onerror = () => markBackgroundSettled(img);
    if (img.complete) markBackgroundSettled(img);
  });
})();
