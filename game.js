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
  const menuBoyButton = document.getElementById('menuBoyButton');
  const menuGirlButton = document.getElementById('menuGirlButton');
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
  const saveKey = 'candy-platformer-unlocked-level';
  const heroSaveKey = 'candy-platformer-selected-hero';
  const specialSaveKey = 'candy-platformer-special-progress';
  const rewardSaveKey = 'candy-platformer-reward-progress';
  let unlockedLevel = 0;
  let hasActiveRun = false;
  let menuReturnState = 'map';

  const assets = {};
  const worldMapBackground = new Image();
  worldMapBackground.src = 'assets/world_map.png';
  const backgroundFiles = {
    meadow: 'lollipop.png',
    licorice: 'pretzel.png',
    falls: 'icecream.png',
    woods: 'wafflewoods.png',
    courtyard: 'cake.png',
    keep: 'kingdom.png'
  };
  const backgroundImages = Object.fromEntries(
    Object.entries(backgroundFiles).map(([theme, file]) => {
      const img = new Image();
      img.src = `assets/backgrounds/${file}`;
      return [theme, img];
    })
  );

  function updateFullscreenButton() {
    const active = document.fullscreenElement === canvas.parentElement;
    fullscreenButton.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
    fullscreenButton.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function updatePauseButton() {
    const compact = isMobileCanvas();
    if (gameState === 'gameover') {
      pauseButton.textContent = compact ? 'Try' : 'Try Again';
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
  }

  function updateMenuButtons() {
    const resumable = hasActiveRun && ['playing', 'map'].includes(menuReturnState);
    resumeButton.disabled = !resumable;
  }

  function updateUiMode() {
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
      if (Number.isInteger(parsed)) return Math.max(0, Math.min(LEVELS.length - 1, parsed));
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

  function setHero(nextHero) {
    selectedHero = nextHero === 'girl' ? 'girl' : 'boy';
    persistSelectedHero();
    updateHeroButton();
  }

  function openMenu() {
    if (gameState !== 'menu') menuReturnState = gameState;
    gameState = 'menu';
    paused = false;
    updatePauseButton();
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
    const targetIndex = Math.max(0, Math.min(unlockedLevel, mapLevelIndex));
    loadLevel(targetIndex);
    hasActiveRun = true;
    menuReturnState = 'map';
    gameState = 'map';
    paused = false;
    mapLevelIndex = targetIndex;
    mapMarkerFromIndex = targetIndex;
    mapMarkerToIndex = targetIndex;
    mapMarkerProgress = 1;
    mapRevealTimer = 0;
    mapArrivalTimer = 0;
    updatePauseButton();
    updateUiMode();
    sound('click');
  }

  function selectMapNode(nextIndex) {
    const clamped = Math.max(0, Math.min(unlockedLevel, nextIndex));
    if (clamped === mapLevelIndex) return;
    mapLevelIndex = clamped;
    mapMarkerFromIndex = mapMarkerToIndex;
    mapMarkerToIndex = clamped;
    mapMarkerProgress = 0;
    mapMoveCooldown = 12;
    sound('click');
  }

  function setUnlockedLevel(nextLevel) {
    const clamped = Math.max(0, Math.min(LEVELS.length - 1, nextLevel));
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

  function sound(kind) {
    const ac = ensureAudio();
    if (!ac) return;
    const map = {
      jump: [520, 0.07, 'triangle', 0.05],
      bounce: [680, 0.10, 'sine', 0.06],
      collect: [880, 0.07, 'sine', 0.05],
      sugar: [980, 0.25, 'sawtooth', 0.04],
      stomp: [240, 0.12, 'square', 0.045],
      hurt: [150, 0.18, 'sawtooth', 0.04],
      checkpoint: [740, 0.16, 'triangle', 0.055],
      win: [660, 0.25, 'sine', 0.06],
      gate: [360, 0.16, 'square', 0.045],
      click: [440, 0.06, 'triangle', 0.035],
      life: [1040, 0.18, 'triangle', 0.05],
      ending: [580, 0.35, 'sine', 0.06]
    };
    const [freq, dur, type, gain] = map[kind] || map.click;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (kind === 'collect' || kind === 'checkpoint' || kind === 'win' || kind === 'life' || kind === 'ending') {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + dur);
    } else if (kind === 'hurt' || kind === 'stomp' || kind === 'gate') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.55), now + dur);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
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

  const LEVEL_BACKGROUNDS = {
    meadow: { haze: 'rgba(255, 255, 255, 0.10)' },
    licorice: { haze: 'rgba(255, 255, 255, 0.10)' },
    falls: { haze: 'rgba(255, 255, 255, 0.12)' },
    woods: { haze: 'rgba(255, 255, 255, 0.08)' },
    courtyard: { haze: 'rgba(255, 255, 255, 0.10)' },
    keep: { haze: 'rgba(255, 255, 255, 0.08)' }
  };

  const THEME_AMBIENCE = {
    meadow: { colors: ['#fff6de', '#ff9ed0', '#87ddff'], count: 20, driftX: -0.18, driftY: 0.02, sparkle: 0.26, gumdrops: 0.10 },
    licorice: { colors: ['#fff2d5', '#f7c471', '#ff8ab8'], count: 18, driftX: -0.15, driftY: 0.015, sparkle: 0.22, gumdrops: 0.08 },
    falls: { colors: ['#fef9ff', '#89e4ff', '#c6f4ff'], count: 22, driftX: -0.12, driftY: 0.04, sparkle: 0.38, gumdrops: 0.06 },
    woods: { colors: ['#fff1c7', '#baf3aa', '#8fddff'], count: 18, driftX: -0.10, driftY: 0.025, sparkle: 0.24, gumdrops: 0.08 },
    courtyard: { colors: ['#fff0db', '#ffb0d4', '#fff5a4'], count: 18, driftX: -0.14, driftY: 0.018, sparkle: 0.32, gumdrops: 0.08 },
    keep: { colors: ['#fef8e0', '#87f0cc', '#9bdfff'], count: 20, driftX: -0.16, driftY: 0.02, sparkle: 0.34, gumdrops: 0.05 }
  };

  const BACKGROUND_LAYOUTS = {
    meadow: { scale: 1.02, focusX: 0.32, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.30 },
    licorice: { scale: 1.03, focusX: 0.36, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.34 },
    falls: { scale: 1.04, focusX: 0.46, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.44 },
    woods: { scale: 1.03, focusX: 0.56, focusY: 0.53, mobileScale: 1.0, mobileFocusX: 0.54 },
    courtyard: { scale: 1.03, focusX: 0.62, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.60 },
    keep: { scale: 1.04, focusX: 0.72, focusY: 0.47, mobileScale: 1.0, mobileFocusX: 0.70 },
    worldMap: { scale: 1.0, focusX: 0.50, focusY: 0.52, mobileScale: 1.0, mobileFocusX: 0.50 }
  };

  const HERO_FRAMES = {
    boy: {
      idle: ['boy_idle_1','boy_idle_2','boy_idle_3','boy_idle_4'],
      run: ['boy_run_1','boy_run_2','boy_run_3','boy_run_4','boy_run_5','boy_run_6','boy_run_7','boy_run_8'],
      jump: ['boy_jump_1','boy_jump_2'],
      land: ['boy_land','boy_crouch'],
      skid: ['boy_skid_1','boy_skid_2'],
      celebrate: ['boy_celebrate_1','boy_celebrate_2','boy_celebrate_3','boy_celebrate_4'],
      hurt: ['boy_hurt_1','boy_hurt_2']
    },
    girl: {
      idle: ['girl_idle_1','girl_idle_2','girl_idle_3','girl_idle_4','girl_idle_5'],
      run: ['girl_run_1','girl_run_2','girl_run_3','girl_run_4','girl_run_5','girl_run_6','girl_run_7','girl_run_8'],
      jump: ['girl_jump_1','girl_jump_2','girl_jump_3'],
      land: ['girl_land','girl_crouch'],
      skid: ['girl_skid_1'],
      celebrate: ['girl_celebrate_1','girl_celebrate_2','girl_celebrate_3','girl_celebrate_4'],
      hurt: ['girl_hurt_1','girl_hurt_2']
    }
  };

  const ENEMY_FRAMES = {
    gummy: { walk:['gummy_walk_1','gummy_walk_2','gummy_walk_3','gummy_walk_4'], hurt:['gummy_squish_1','gummy_squish_2'] },
    marsh: { walk:['marsh_walk_1','marsh_walk_2','marsh_walk_3','marsh_walk_4'], hurt:['marsh_squish_1','marsh_squish_2'] },
    beetle:{ walk:['beetle_walk_1','beetle_walk_2','beetle_walk_3','beetle_walk_4','beetle_walk_5','beetle_walk_6'], hurt:['beetle_squish_1','beetle_squish_2'] },
    jaw:   { walk:['jaw_roll_1','jaw_roll_2','jaw_roll_3','jaw_roll_4'], hurt:['jaw_break_1','jaw_break_2'] }
  };

  const assetNames = [
    ...Object.values(HERO_FRAMES).flatMap(group => Object.values(group).flat()),
    ...Object.values(ENEMY_FRAMES).flatMap(group => Object.values(group).flat()),
    'icing_long','icing_block','icing_block2','icing_corner','choco_long','choco_block','choco_block2','choco_double',
    'cookie_long','cookie_round','cookie_block','cookie_cracked_1','cookie_cracked_2','cookie_cracked_3','cupcake_checkpoint',
    'wafer_long','wafer_block','wafer_block2','wafer_block3','wafer_broken','wafer_platform','wafer_moving','wafer_bar',
    'crystal','bean_purple','bean_red','bean_orange','bean_yellow','bean_green','bean_blue',
    'gumdrop_green','gumdrop_blue','gumdrop_pink','gumdrop_orange','gumdrop_purple','marshmallow_1','marshmallow_2',
    'jelly_orange','jelly_green','jelly_pink','star_blue','star_pink','star_purple',
    'gate_intact','gate_piece','gate_broken','frosting_ground','candy_arch','lollipop_orange','lollipop_sprinkle','lollipop_swirl','lollipop_green','lollipop_pink','lollipop_purple'
  ];

  for (const name of assetNames) {
    const folder = HERO_FRAMES.boy.idle.includes(name) || HERO_FRAMES.boy.run.includes(name) || HERO_FRAMES.boy.jump.includes(name) || HERO_FRAMES.boy.land.includes(name) || HERO_FRAMES.boy.skid.includes(name) || HERO_FRAMES.boy.celebrate.includes(name) || HERO_FRAMES.boy.hurt.includes(name) || HERO_FRAMES.girl.idle.includes(name) || HERO_FRAMES.girl.run.includes(name) || HERO_FRAMES.girl.jump.includes(name) || HERO_FRAMES.girl.land.includes(name) || HERO_FRAMES.girl.skid.includes(name) || HERO_FRAMES.girl.celebrate.includes(name) || HERO_FRAMES.girl.hurt.includes(name)
      ? 'heroes' : (name.includes('gummy_') || name.includes('marsh_') || name.includes('beetle_') || name.includes('jaw_')) ? 'enemies' : 'tiles';
    assets[name] = createImage(`assets/${folder}/${name}.png`);
  }

  function P(x, y, w, h, kind, extra = {}) { return { x, y, w, h, kind, alive: true, hit: 0, ...extra }; }
  function B(x, y, w = 80) { return P(x, y, w, 18, 'bounce'); }
  function M(x, y, w, h, minX, maxX, speed) { return P(x, y, w, h, 'moving', { minX, maxX, speed, dir: 1 }); }
  function R(x, y, w, minX, maxX, speed) { return P(x, y, w, 18, 'raft', { minX, maxX, speed, dir: 1 }); }
  function V(x, y, w, h, minY, maxY, speed, kind = 'float') { return P(x, y, w, h, kind, { minY, maxY, speed, dir: 1 }); }
  function G(x, y, w, h = 110) { return P(x, y, w, h, 'sugarGate'); }
  function TG(x, y, w, h = 110, phase = 0, openFor = 80, closedFor = 90) { return P(x, y, w, h, 'blinkGate', { phase, openFor, closedFor, open: false }); }
  function E(x, y, kind, range, speed = null) {
    const baseSpeed = speed ?? (kind === 'jaw' ? 1.55 : kind === 'beetle' ? 1.2 : kind === 'marsh' ? 1.0 : 0.95);
    return {
      x, y, w: 48, h: 36, kind,
      spawnX: x, spawnY: y,
      minX: x - range / 2, maxX: x + range / 2,
      baseSpeed, vx: baseSpeed,
      alive: true, hurtTimer: 0, respawnTimer: 0
    };
  }
  function C(kind, x, y) { return [kind, x, y]; }
  function S(kind, x, y) { return [kind, x, y]; }
  function D(x, y, img, extra = {}) { return { x, y, img, ...extra }; }
  function F(x, y, frame, text = '') { return { x, y, frame, text }; }
  function HN(x, y, text) { return { x, y, text }; }
  function WZ(x, y, w, h, text, extra = {}) { return { x, y, w, h, text, done: false, ...extra }; }

  const LEVELS = [
    {
      name: 'Lollipop Meadow',
      theme: 'meadow',
      chapter: 'Chapter 1 of 6',
      story: 'The child lands in a bright lollipop field, pauses in awe, and takes the first careful steps through a world that feels sweet, strange, and safe.',
      tip: 'First arrival: learn the gentle floating lifts early, mix them with bounce pads in the middle, then trust the high final trail.',
      success: 'You learned the meadow lifts, mixed them with the safer jumps, and rode the high trail deeper into the candy world.',
      worldW: 2280,
      start: { x: 70, y: 392 },
      goal: { x: 2150, y: 250 },
      decor: [D(694, 360, 'lollipop_swirl', { h: 84, alpha: 0.82 }), D(922, 236, 'candy_arch', { h: 66, alpha: 0.42 }), D(1964, 206, 'lollipop_green', { h: 72, alpha: 0.78 })],
      platforms: [
        P(0, 452, 330, 80, 'icing'), P(250, 436, 300, 96, 'icing'), P(420, 392, 160, 22, 'cookie'),
        V(520, 386, 116, 18, 354, 398, 0.42, 'float'), V(640, 352, 150, 20, 320, 372, 0.55, 'float'), P(740, 274, 110, 18, 'cookie'), P(860, 228, 110, 18, 'icing'),
        P(850, 352, 240, 20, 'cookie'), P(1000, 262, 92, 18, 'cookie'), P(1130, 420, 220, 24, 'cookie'),
        B(1220, 402, 80), V(1332, 350, 112, 18, 318, 362, 0.48, 'float'), P(1452, 322, 126, 18, 'cookie'), P(1540, 338, 140, 20, 'cookie'),
        P(1700, 420, 280, 90, 'icing'), V(1838, 282, 112, 18, 244, 296, 0.56, 'float'), P(1960, 238, 110, 18, 'icing'), P(2020, 318, 120, 18, 'cookie'),
        P(940, 300, 78, 18, 'break')
      ],
      candies: [
        C('bean_red', 152, 404), C('bean_orange', 252, 392), C('star_pink', 455, 346), C('bean_green', 692, 308), C('star_blue', 896, 308),
        C('bean_blue', 978, 308), C('bean_purple', 1010, 262), C('star_purple', 1175, 372), C('bean_yellow', 1255, 358), C('star_pink', 1410, 332),
        C('bean_red', 1560, 290), C('star_blue', 1760, 374), C('bean_green', 1880, 246), C('star_purple', 2050, 272), C('star_blue', 2120, 272)
      ],
      specials: [S('star_pink', 796, 232), S('star_blue', 1048, 222), S('star_purple', 2015, 196)],
      enemies: [E(770, 320, 'gummy', 150), E(1320, 386, 'marsh', 120), E(1880, 254, 'gummy', 100)],
      checkpoints: [{ x: 1060, y: 344, active: false }, { x: 1765, y: 250, active: false }],
      npcs: [F(212, 420, 'jelly_pink', 'Welcome to the sweet trail!'), F(1708, 404, 'marsh_walk_2', 'The high path feels safer from up here.')],
      signs: [HN(468, 390, 'Float up to the pink lift.'), HN(1208, 396, 'Bounce high, then keep the calm rhythm.')],
      wonders: [WZ(520, 330, 150, 110, 'The first lift rises slowly. It feels more magical than scary.', { color: '#ff9ed0' }), WZ(1660, 360, 210, 110, 'A cupcake clearing gives you a safe breath before the high trail.', { heart: 1, color: '#fff27a' })]
    },
    {
      name: 'Pretzel Path',
      theme: 'licorice',
      chapter: 'Chapter 2 of 6',
      story: 'The bright meadow fades behind you as the road splits and twists, making Pretzel Path feel like the first place you could truly get lost.',
      tip: 'Forked roads: learn the tilting planks early, combine them with moving footing in the middle, then dash the collapsing bridge.',
      success: 'You read the leaning roads, handled the moving planks, and escaped the falling bridge out of Pretzel Path.',
      worldW: 2540,
      start: { x: 70, y: 390 },
      goal: { x: 2410, y: 275 },
      decor: [D(632, 258, 'lollipop_orange', { h: 68, alpha: 0.64 }), D(1772, 178, 'candy_arch', { h: 62, alpha: 0.38 }), D(2248, 224, 'lollipop_purple', { h: 70, alpha: 0.72 })],
      platforms: [
        P(0, 452, 290, 80, 'choco'), P(320, 412, 165, 22, 'cookie'), P(540, 372, 145, 20, 'tilt'), P(610, 284, 110, 18, 'wafer'),
        P(730, 332, 135, 20, 'tilt'), P(780, 232, 110, 18, 'cookie'), M(910, 320, 128, 22, 910, 1090, 1.2),
        P(1145, 392, 155, 20, 'cookie'), B(1320, 392, 80), P(1450, 350, 150, 20, 'tilt'),
        P(1605, 248, 110, 18, 'wafer'), M(1660, 300, 128, 22, 1660, 1860, 1.25), P(1768, 206, 100, 18, 'tilt'),
        P(1886, 402, 96, 18, 'cookie'), P(1998, 390, 92, 18, 'cookie'), P(2106, 378, 92, 18, 'cookie'), P(2214, 366, 92, 18, 'cookie'), P(2230, 252, 110, 18, 'choco'),
        P(2310, 330, 150, 20, 'choco'), P(2390, 420, 170, 80, 'icing'), P(1210, 300, 78, 18, 'break'), P(2000, 330, 82, 18, 'break')
      ],
      candies: [
        C('star_blue', 135, 406), C('bean_purple', 355, 370), C('bean_green', 430, 370), C('star_purple', 595, 328), C('bean_yellow', 950, 278),
        C('bean_red', 1015, 278), C('star_pink', 1218, 258), C('bean_blue', 1188, 348), C('star_blue', 1360, 348), C('bean_purple', 1510, 308),
        C('star_pink', 1710, 256), C('bean_green', 1770, 256), C('star_purple', 1980, 384), C('bean_orange', 2190, 334), C('star_blue', 2350, 284)
      ],
      specials: [S('star_purple', 665, 242), S('star_blue', 828, 188), S('star_pink', 1818, 162)],
      enemies: [E(390, 378, 'beetle', 110), E(760, 290, 'gummy', 120), E(1490, 316, 'marsh', 120), E(2200, 342, 'jaw', 100)],
      checkpoints: [{ x: 1165, y: 336, active: false }, { x: 2040, y: 366, active: false }],
      npcs: [F(602, 266, 'gummy_walk_2', 'These roads lean. Slow steps help.'), F(2306, 314, 'jelly_orange', 'You found the way out!')],
      signs: [HN(536, 346, 'Tilting planks push your feet sideways.'), HN(1878, 382, 'Run. The cookie road will not wait.')],
      wonders: [WZ(700, 266, 160, 110, 'The forked road shifts underfoot, but the candy markers still guide you.', { color: '#f7c471' }), WZ(1988, 336, 220, 110, 'A soft pretzel lantern glows over a safe pocket before the bridge sprint.', { heart: 1, color: '#fff27a' })]
    },
    {
      name: 'Ice Cream Falls',
      theme: 'falls',
      chapter: 'Chapter 3 of 6',
      story: 'The air cools as the cliffs rise around you, and Ice Cream Falls becomes the moment the journey starts to feel higher, colder, and farther from the meadow below.',
      tip: 'Weather shift: catch the raft early, combine it with slick icing in the middle, then finish the high cold climb on sliding ledges.',
      success: 'You learned the raft, carried that rhythm into the slick climb, and cleared the cold upper ledges above the falls.',
      worldW: 2840,
      start: { x: 70, y: 390 },
      goal: { x: 2705, y: 248 },
      decor: [D(1450, 220, 'candy_arch', { h: 70, alpha: 0.38 }), D(2068, 214, 'lollipop_sprinkle', { h: 74, alpha: 0.74 }), D(2310, 176, 'lollipop_green', { h: 70, alpha: 0.68 })],
      platforms: [
        P(0, 452, 280, 80, 'icing'), P(320, 408, 155, 22, 'choco'), P(520, 365, 160, 20, 'cookie'), B(730, 395, 80),
        P(860, 430, 170, 22, 'icing'), R(952, 446, 132, 952, 1224, 1.02), P(1094, 392, 116, 18, 'slide', { slideDir: 0.22 }), M(1100, 368, 130, 22, 1100, 1270, 1.15), P(1320, 330, 150, 20, 'slide', { slideDir: 0.26 }),
        P(1448, 246, 108, 18, 'icing'), P(1598, 210, 102, 18, 'icing'), P(1712, 176, 100, 18, 'icing'),
        P(1540, 392, 180, 22, 'icing'), B(1775, 392, 82), P(1930, 350, 160, 20, 'cookie'), P(2060, 238, 100, 18, 'slide', { slideDir: 0.24 }),
        M(2175, 300, 132, 22, 2175, 2365, 1.3), P(2295, 206, 100, 18, 'slide', { slideDir: 0.3 }), P(2408, 168, 96, 18, 'slide', { slideDir: 0.28 }),
        P(2410, 256, 120, 20, 'icing'), P(2570, 306, 120, 20, 'icing'), P(2650, 420, 220, 84, 'icing'), P(1460, 286, 82, 18, 'break'), P(2050, 304, 82, 18, 'break')
      ],
      candies: [
        C('star_pink', 140, 406), C('bean_green', 360, 366), C('bean_blue', 420, 366), C('star_blue', 565, 320), C('bean_purple', 742, 350),
        C('star_purple', 1138, 320), C('bean_red', 1385, 286), C('star_blue', 1605, 344), C('bean_yellow', 1798, 350), C('star_pink', 1990, 308),
        C('bean_orange', 2235, 258), C('star_purple', 2465, 214), C('bean_green', 2620, 264), C('star_blue', 2740, 264)
      ],
      specials: [S('star_blue', 1498, 204), S('star_purple', 1650, 166), S('star_pink', 2346, 164)],
      enemies: [E(350, 374, 'gummy', 120), E(612, 330, 'marsh', 110), E(1600, 356, 'beetle', 150), E(2460, 220, 'jaw', 90), E(2600, 270, 'gummy', 90)],
      checkpoints: [{ x: 1180, y: 350, active: false }, { x: 2280, y: 282, active: false }],
      npcs: [F(886, 404, 'jelly_blue', 'The raft drifts better if you stay centered.'), F(2438, 230, 'marsh_walk_3', 'Cold air, but the path is almost above the clouds.')],
      signs: [HN(954, 426, 'Wait for the raft. Then ride the slide.'), HN(2056, 214, 'The upper icing gets slicker from here.')],
      wonders: [WZ(952, 392, 180, 120, 'The candy raft glides out from the frosting mist. It feels like a moving secret.', { color: '#8ddfff' }), WZ(2240, 186, 210, 120, 'A sparkling overlook opens above the falls. Everything below feels tiny now.', { heart: 1, color: '#fff27a' })]
    },
    {
      name: 'Waffle Woods',
      theme: 'woods',
      chapter: 'Chapter 4 of 6',
      story: 'The trail narrows into a maze of waffle trunks and syrup gaps, where every clearing feels hidden and every wrong turn feels deeper inside the woods.',
      tip: 'Maze beat: learn the sticky syrup early, combine it with moving and bounce routes in the middle, then clear the final syrup maze.',
      success: 'You learned how the syrup slows the woods, used it with the moving routes, and solved the last sticky maze.',
      worldW: 3080,
      start: { x: 70, y: 390 },
      goal: { x: 2940, y: 230 },
      decor: [D(1208, 228, 'candy_arch', { h: 64, alpha: 0.40 }), D(1692, 306, 'lollipop_orange', { h: 68, alpha: 0.72 }), D(2508, 218, 'candy_arch', { h: 60, alpha: 0.36 })],
      platforms: [
        P(0, 452, 280, 80, 'wafer'), P(320, 414, 150, 22, 'cookie'), P(520, 378, 130, 20, 'syrup'), P(700, 338, 130, 20, 'cookie'),
        M(900, 310, 130, 22, 900, 1070, 1.15), P(1100, 388, 160, 22, 'choco'), P(1180, 258, 110, 18, 'wafer'), P(1325, 348, 150, 20, 'cookie'),
        P(1336, 214, 108, 18, 'wafer'), B(1510, 392, 82), P(1660, 338, 145, 20, 'syrup'), P(1748, 234, 108, 18, 'wafer'),
        M(1870, 284, 128, 22, 1870, 2040, 1.2), P(2090, 420, 190, 22, 'syrup'), P(2204, 246, 104, 18, 'wafer'), P(2320, 372, 150, 20, 'cookie'),
        B(2525, 372, 80), P(2485, 250, 104, 18, 'wafer'), P(2660, 316, 130, 20, 'syrup'), P(2830, 272, 125, 20, 'syrup'), P(2900, 420, 180, 82, 'icing'),
        P(1215, 306, 82, 18, 'break'), P(2170, 328, 82, 18, 'break'), P(2725, 262, 82, 18, 'break')
      ],
      candies: [
        C('star_blue', 136, 406), C('bean_red', 352, 376), C('bean_orange', 430, 376), C('star_pink', 560, 336), C('bean_green', 742, 300),
        C('star_purple', 950, 260), C('bean_blue', 1165, 340), C('star_blue', 1380, 300), C('bean_purple', 1532, 348), C('star_pink', 1705, 292),
        C('bean_yellow', 1935, 236), C('star_purple', 2150, 384), C('bean_orange', 2365, 328), C('star_blue', 2550, 330), C('bean_green', 2700, 274), C('star_pink', 2890, 232)
      ],
      specials: [S('star_blue', 1232, 216), S('star_purple', 1388, 172), S('star_pink', 2536, 208)],
      enemies: [E(382, 380, 'marsh', 110), E(722, 294, 'beetle', 110), E(1390, 314, 'gummy', 120), E(1730, 294, 'jaw', 120), E(2370, 338, 'beetle', 120), E(2860, 238, 'jaw', 90)],
      checkpoints: [{ x: 1265, y: 328, active: false }, { x: 1825, y: 262, active: false }, { x: 2240, y: 352, active: false }],
      npcs: [F(1110, 372, 'jelly_green', 'Syrup slows the path, but it also gives you time.'), F(2252, 230, 'gummy_walk_3', 'This clearing is hidden from the busy maze.')],
      signs: [HN(516, 350, 'Sticky syrup means shorter jumps.'), HN(2094, 392, 'A quiet clearing waits ahead.')],
      wonders: [WZ(514, 334, 170, 110, 'The syrup path catches your steps and the whole woods go hushed for a moment.', { color: '#baf3aa' }), WZ(2140, 360, 220, 120, 'A hidden clearing opens with enough space to breathe before the final maze.', { heart: 1, color: '#fff27a' })]
    },
    {
      name: 'Cake Courtyard',
      theme: 'courtyard',
      chapter: 'Chapter 5 of 6',
      story: 'The world stops feeling wild and starts feeling guarded as cake towers, frosting ledges, and blocked lanes warn that something important lies ahead.',
      tip: 'Guarded approach: learn the first lift early, combine lifts with blocked lanes in the middle, then survive the final timed gate run.',
      success: 'You learned the lifts, broke through the guarded middle, and survived the final gate run into the last ascent.',
      worldW: 3360,
      start: { x: 70, y: 390 },
      goal: { x: 3220, y: 210 },
      decor: [D(1522, 266, 'candy_arch', { h: 68, alpha: 0.40 }), D(1810, 146, 'lollipop_pink', { h: 74, alpha: 0.70 }), D(2608, 216, 'candy_arch', { h: 62, alpha: 0.38 })],
      platforms: [
        P(0, 452, 300, 80, 'icing'), P(350, 418, 165, 22, 'cookie'), P(560, 372, 140, 20, 'choco'), V(760, 352, 116, 18, 320, 372, 0.5, 'elevator'),
        P(950, 406, 180, 22, 'icing'), B(1160, 392, 80), P(1290, 348, 150, 20, 'cookie'), G(1510, 296, 84, 90),
        V(1588, 338, 108, 18, 204, 338, 0.78, 'elevator'), TG(1716, 214, 70, 86, 26, 64, 86), M(1680, 308, 132, 22, 1680, 1815, 1.02), P(1762, 204, 106, 18, 'icing'), P(1895, 246, 150, 20, 'cookie'),
        P(1965, 168, 100, 18, 'cookie'), P(2068, 134, 96, 18, 'icing'), P(2120, 390, 190, 22, 'choco'), V(2268, 338, 112, 18, 286, 338, 0.56, 'elevator'), B(2345, 376, 82), P(2490, 330, 140, 20, 'icing'),
        P(2574, 236, 96, 18, 'icing'), TG(2700, 274, 82, 88, 0, 64, 78), P(2768, 300, 92, 18, 'icing'), TG(2928, 214, 76, 92, 38, 64, 86), M(2868, 286, 120, 22, 2868, 3005, 1.05), P(3060, 232, 140, 20, 'cookie'),
        P(3185, 420, 190, 80, 'icing'), P(1030, 306, 82, 18, 'break'), P(2240, 320, 82, 18, 'break')
      ],
      candies: [
        C('star_purple', 148, 406), C('bean_green', 392, 382), C('bean_blue', 470, 382), C('star_blue', 600, 330), C('bean_purple', 812, 282),
        C('star_pink', 1000, 358), C('bean_red', 1178, 348), C('star_blue', 1360, 300), C('bean_yellow', 1580, 240), C('star_purple', 1725, 250),
        C('bean_orange', 1940, 198), C('star_blue', 2180, 344), C('bean_green', 2365, 330), C('star_pink', 2565, 284), C('bean_blue', 2725, 206), C('star_purple', 2898, 232), C('star_blue', 3138, 184)
      ],
      specials: [S('star_pink', 1632, 240), S('star_blue', 1814, 160), S('star_purple', 2620, 194)],
      enemies: [E(430, 384, 'gummy', 100), E(812, 286, 'beetle', 90), E(1360, 314, 'marsh', 90), E(1990, 202, 'jaw', 72), E(2180, 354, 'beetle', 100), E(3100, 188, 'jaw', 70)],
      checkpoints: [{ x: 1410, y: 320, active: false }, { x: 2470, y: 304, active: false }, { x: 2890, y: 266, active: false }, { x: 3120, y: 206, active: false }],
      npcs: [F(952, 386, 'jelly_pink', 'The courtyard looks stern, but the lifts are still on your side.'), F(3080, 212, 'marsh_walk_4', 'The last gate is almost open!')],
      signs: [HN(744, 322, 'Lift up. Wait for the safe lane.'), HN(2688, 246, 'Blink gates open in a rhythm. Do not rush the wrong beat.')],
      wonders: [WZ(742, 306, 170, 120, 'The first frosting lift rises like a hidden stage above the courtyard.', { color: '#ffb3d6' }), WZ(2860, 250, 210, 120, 'Lanterns flicker over a calm landing before the final gate rhythm.', { heart: 1, color: '#fff27a' })]
    },
    {
      name: 'Kingdom Gate',
      theme: 'keep',
      chapter: 'Chapter 6 of 6',
      story: 'High above the candy roofs, the child finally sees the way home and begins the last steep climb toward the kingdom gate.',
      tip: 'Final ascent: learn the blink gates early, combine them with moving ledges in the middle, then survive the chase through the final gate test.',
      success: 'You read the blinking gates, handled them with the moving climb, and survived the last chase to earn the way home.',
      worldW: 3600,
      start: { x: 70, y: 390 },
      goal: { x: 3455, y: 160 },
      decor: [D(1328, 246, 'candy_arch', { h: 70, alpha: 0.36 }), D(2482, 226, 'candy_arch', { h: 70, alpha: 0.34 }), D(3342, 118, 'lollipop_swirl', { h: 76, alpha: 0.72 })],
      platforms: [
        P(0, 452, 290, 80, 'choco'), P(340, 416, 165, 22, 'cookie'), P(555, 370, 135, 20, 'choco'), TG(760, 288, 76, 92, 24, 72, 92), P(848, 330, 132, 18, 'choco'),
        B(950, 392, 82), P(1100, 350, 150, 20, 'cookie'), TG(1320, 274, 92, 110, 0), P(1470, 236, 140, 20, 'cookie'),
        P(1622, 188, 106, 18, 'cookie'), M(1680, 286, 132, 22, 1680, 1860, 1.2), TG(1836, 214, 74, 90, 28, 66, 86), P(1910, 414, 180, 22, 'cookie'),
        P(2140, 370, 145, 20, 'choco'), B(2320, 360, 82), P(2372, 210, 100, 18, 'cookie'), TG(2470, 250, 92, 110, 60), P(2630, 212, 140, 20, 'cookie'),
        P(2780, 170, 104, 18, 'choco'), M(2840, 248, 132, 22, 2840, 3025, 1.24), P(3075, 318, 150, 20, 'choco'),
        TG(3250, 200, 90, 110, 120), P(3332, 138, 102, 18, 'cookie'), P(3370, 176, 190, 20, 'icing'), P(3420, 420, 180, 84, 'icing'),
        P(1180, 306, 82, 18, 'break'), P(2030, 330, 82, 18, 'break'), P(2950, 282, 82, 18, 'break')
      ],
      candies: [
        C('star_blue', 150, 406), C('bean_red', 390, 382), C('bean_orange', 470, 382), C('star_purple', 600, 328), C('bean_green', 800, 282),
        C('star_pink', 968, 352), C('bean_blue', 1150, 300), C('star_blue', 1370, 236), C('bean_purple', 1520, 188), C('star_pink', 1738, 228),
        C('bean_yellow', 1950, 384), C('star_purple', 2200, 326), C('bean_orange', 2330, 314), C('star_blue', 2495, 208), C('bean_green', 2660, 164),
        C('star_pink', 2888, 196), C('bean_red', 3125, 274), C('star_purple', 3295, 148), C('star_blue', 3445, 120)
      ],
      specials: [S('star_blue', 1674, 144), S('star_pink', 2832, 126), S('star_purple', 3380, 96)],
      enemies: [{ ...E(248, 384, 'jaw', 900, 2.2), giant: true, chase: true, triggerX: 520, noRespawn: true, noStomp: true, w: 78, h: 54 }, E(420, 384, 'marsh', 100), E(782, 294, 'beetle', 110), E(1180, 314, 'gummy', 110), E(1540, 194, 'jaw', 90), E(1985, 378, 'beetle', 110), E(2195, 334, 'marsh', 110), E(2675, 170, 'jaw', 90), E(3120, 282, 'beetle', 120)],
      checkpoints: [{ x: 1440, y: 310, active: false }, { x: 2550, y: 286, active: false }, { x: 3330, y: 170, active: false }],
      npcs: [F(1108, 344, 'jelly_orange', 'The lights in the gate walls mean you are close now.'), F(3340, 156, 'jelly_blue', 'Go. Home is right there.')],
      signs: [HN(744, 300, 'Blinking candy gates teach the rhythm.'), HN(3226, 184, 'One last climb. Then run for safety.')],
      wonders: [WZ(738, 274, 170, 120, 'The first blinking gate hums instead of roaring. The climb still feels hopeful.', { color: '#79f0c3' }), WZ(3278, 156, 200, 120, 'The final lights gather around the home arch. Even the candy wind feels gentle now.', { heart: 1, color: '#fff27a' })]
    }
  ];

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
  let wonderText = '';
  let wonderTextTimer = 0;

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
    const cfg = THEME_AMBIENCE[theme] || THEME_AMBIENCE.meadow;
    ambientParticles = Array.from({ length: cfg.count }, () => buildAmbientParticle(theme));
  }

  function grantLevelReward(i) {
    if (rewardProgress[i] || !hasAllSpecialsInLevel(i)) return;
    rewardProgress[i] = true;
    persistRewardProgress();
    lives = Math.min(maxLives + 4, lives + 1);
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

  const WORLD_MAP_NODES = [
    { x: 118, y: 318, mobileX: 116, mobileY: 342, color: '#ff8fc8', icon: 'lollipop_pink', badge: 'bean_red', plate: '#fff0f7', label: 'Meadow', stamp: 'star_pink', labelDy: 42, mobileLabelDy: 38 },
    { x: 278, y: 262, mobileX: 252, mobileY: 282, color: '#f7b55a', icon: 'cookie_round', badge: 'star_purple', plate: '#fff3e3', label: 'Pretzel', stamp: 'star_purple', labelDy: 42, mobileLabelDy: 34 },
    { x: 404, y: 312, mobileX: 392, mobileY: 338, color: '#8ddfff', icon: 'icing_block2', badge: 'star_blue', plate: '#eefcff', label: 'Falls', stamp: 'star_blue', labelDy: 46, mobileLabelDy: 38 },
    { x: 590, y: 268, mobileX: 560, mobileY: 284, color: '#f6d56d', icon: 'wafer_platform', badge: 'bean_green', plate: '#fff8df', label: 'Woods', stamp: 'bean_green', labelDy: 42, mobileLabelDy: 34 },
    { x: 742, y: 258, mobileX: 708, mobileY: 292, color: '#ffb3d6', icon: 'cookie_block', badge: 'star_pink', plate: '#fff1f7', label: 'Cake', stamp: 'star_pink', labelDy: 46, mobileLabelDy: 38 },
    { x: 868, y: 168, mobileX: 822, mobileY: 194, color: '#79f0c3', icon: 'candy_arch', badge: 'star_blue', plate: '#effff9', label: 'Gate', stamp: 'candy_arch', labelDy: 40, mobileLabelDy: 32 }
  ];

  const WORLD_MAP_BRANCH_NODES = [
    { levelIndex: 0, x: 198, y: 222, mobileX: 182, mobileY: 238, color: '#ffd86a', plate: '#fff8dd', icon: 'lollipop_green', label: 'Sky Lift' },
    { levelIndex: 1, x: 352, y: 190, mobileX: 330, mobileY: 208, color: '#ffc48a', plate: '#fff1e1', icon: 'wafer_bar', label: 'Fork Run' },
    { levelIndex: 2, x: 492, y: 226, mobileX: 468, mobileY: 246, color: '#9de9ff', plate: '#eefcff', icon: 'marshmallow_2', label: 'Raft Trail' },
    { levelIndex: 3, x: 666, y: 182, mobileX: 634, mobileY: 198, color: '#d8f37b', plate: '#f7ffe3', icon: 'wafer_platform', label: 'Hidden Glen' },
    { levelIndex: 4, x: 810, y: 168, mobileX: 776, mobileY: 184, color: '#ffb9de', plate: '#fff0f6', icon: 'gate_piece', label: 'Candle Run' }
  ];

  const WORLD_MAP_BONUS_NODE = {
    x: 642, y: 104,
    mobileX: 610, mobileY: 122,
    color: '#fff27a',
    plate: '#fff9da',
    icon: 'star_pink',
    label: 'Morning Star'
  };

  menuButton.addEventListener('click', openMenu);

  heroButton.addEventListener('click', () => {
    setHero(selectedHero === 'boy' ? 'girl' : 'boy');
    burst(player.x + player.w / 2, player.y + player.h / 2, 10, selectedHero === 'boy' ? '#72ddff' : '#ff74ba');
    sound('click');
  });

  menuBoyButton.addEventListener('click', () => { setHero('boy'); sound('click'); });
  menuGirlButton.addEventListener('click', () => { setHero('girl'); sound('click'); });
  resumeButton.addEventListener('click', resumeRun);
  startButton.addEventListener('click', startAdventure);
  mapButton.addEventListener('click', openWorldMap);

  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
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
      resetRun(0);
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
    const clamped = Math.max(0, Math.min(unlockedLevel, nextLevel));
    menuReturnState = 'map';
    mapLevelIndex = clamped;
    mapPulse = 0;
    mapMoveCooldown = 0;
    mapRevealTimer = 42;
    mapArrivalTimer = 0;
    mapMarkerFromIndex = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
    mapMarkerToIndex = clamped;
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
    loadLevel(Math.max(0, Math.min(LEVELS.length - 1, startLevel)));
    gameState = 'playing';
    introTimer = 0;
    updatePauseButton();
    updateUiMode();
  }

  function bootToGame() {
    loadLevel(0);
    hasActiveRun = false;
    menuReturnState = 'menu';
    gameState = 'menu';
    paused = false;
    mapLevelIndex = 0;
    mapMarkerFromIndex = 0;
    mapMarkerToIndex = 0;
    mapMarkerProgress = 1;
    mapMoveCooldown = 0;
    mapRevealTimer = 0;
    mapArrivalTimer = 0;
    updatePauseButton();
    updateUiMode();
  }

  addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyR','Enter'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (gameState === 'menu' && e.code === 'Enter') startAdventure();
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
    if (e.code === 'Enter' && gameState === 'gameover') resetRun(0);
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
      resetRun(0);
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
    level = LEVELS[i];
    levelDecor = level.decor.map(d => ({ ...d }));
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
    snapSpawnToGround();
    cameraX = 0;
    score = 0;
    sugar = 0;
    sugarTimer = 0;
    levelTimer = levelTimeLimit;
    particles.length = 0;
    resetAmbientParticles(level.theme);
    addRewardRouteContent(i);
    winTimer = 0;
    shake = 0;
    levelIntroTimer = 150;
    storyTimer = 180;
  }

  function bankLevelCandy() {
    totalCandy += score;
    score = 0;
    while (totalCandy >= nextExtraLifeAt) {
      lives = Math.min(maxLives + 4, lives + 1);
      nextExtraLifeAt += 45;
      burst(player.x + player.w / 2, player.y, 28, '#fff27a');
      sound('life');
    }
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function isSafePlatform(p) {
    return ['icing', 'choco', 'wafer', 'float', 'elevator', 'slide', 'raft'].includes(p.kind);
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

  function snapSpawnToGround() {
    const feetX = player.x + player.w / 2;
    let landingY = null;
    for (const p of platforms) {
      if (!p.alive || p.kind === 'sugarGate' || p.kind === 'break') continue;
      const supported = feetX >= p.x + 4 && feetX <= p.x + p.w - 4;
      if (!supported) continue;
      const top = p.y - player.h;
      const closeToStart = Math.abs(top - player.y) <= 18;
      if (!closeToStart) continue;
      if (landingY === null || top < landingY) landingY = top;
    }
    if (landingY !== null) {
      player.y = landingY;
      player.onGround = true;
      player.vy = 0;
      player.coyote = coyoteFrames;
      player.lastSafe = { x: player.x, y: player.y };
    }
  }

  function update() {
    time += 1;
    updateParticles();
    updateAmbientParticles();
    if (gameState === 'map') {
      mapPulse += 0.05;
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
        if (mapLeft && mapLevelIndex > 0) {
          selectMapNode(mapLevelIndex - 1);
        } else if (mapRight && mapLevelIndex < unlockedLevel) {
          selectMapNode(mapLevelIndex + 1);
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
        if (levelIndex < LEVELS.length - 1) {
          setUnlockedLevel(levelIndex + 1);
          enterWorldMap(levelIndex + 1);
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
        if (isSafePlatform(landing)) player.lastSafe = { x: player.x, y: player.y };
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

    for (const cp of checkpoints) {
      const pad = { x: cp.x, y: cp.y, w: 46, h: 46 };
      if (!cp.active && rectsOverlap(player, pad)) {
        cp.active = true;
        player.lastSafe = { x: player.x, y: player.y };
        player.hearts = Math.min(maxHearts, player.hearts + 1);
        burst(cp.x + 22, cp.y + 12, 14, '#fff27a');
        sound('checkpoint');
      }
    }

    if (rectsOverlap(player, goal)) {
      bankLevelCandy();
      winTimer = 1;
      burst(player.x + player.w / 2, player.y, 60, '#fff27a');
      chordWin();
    }

    if (player.y > H + 120) loseLife('fall');

    if (player.invuln > 0) player.invuln--;
    if (player.landedTimer > 0) player.landedTimer--;
    if (player.hurtTimer > 0) player.hurtTimer--;
    if (levelIntroTimer > 0) levelIntroTimer--;
    if (storyTimer > 0) storyTimer--;
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
    if (reason === 'fall') sound('hurt');
  }

  function respawn() {
    levelTimer = levelTimeLimit;
    player.x = player.lastSafe.x;
    player.y = player.lastSafe.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    snapSpawnToGround();
    player.invuln = 132;
    player.hurtTimer = 0;
    player.hearts = maxHearts;
    sugar = Math.max(0, sugar - 20);
    burst(player.x + player.w / 2, H - 10, 14, '#71dfff');
  }

  function burst(x, y, count, color) {
    const colors = [color, '#79f0c3', '#ff74ba', '#fff5dc', '#71dfff', '#f7a14a'];
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 7 - 1,
        r: 2 + Math.random() * 4,
        life: 28 + Math.random() * 34,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }
  }

  function updateParticles() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.11;
      p.life--;
    }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  }

  function updateAmbientParticles() {
    if (!level) return;
    const cfg = THEME_AMBIENCE[level.theme] || THEME_AMBIENCE.meadow;
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
    while (ambientParticles.length < cfg.count) ambientParticles.push(buildAmbientParticle(level.theme));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    drawBackground();
    drawAmbientParticles();
    ctx.save();
    ctx.translate(-cameraX, 0);
    drawDecor();
    drawPlatforms();
    drawCheckpoints();
    drawGoal();
    drawCandies();
    drawSpecials();
    drawEnemies();
    drawPlayer();
    drawParticles();
    ctx.restore();
    drawHUD();
    if (gameState === 'map') drawWorldMap();
    if (levelIntroTimer > 0 && gameState === 'playing' && winTimer === 0) drawLevelIntro();
    if (storyTimer > 0 && gameState === 'playing' && winTimer === 0) drawStoryBanner();
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
    for (let i = 0; i < 4; i++) {
      const x = ((i * 420 - time * 0.14) % (W + 520)) - 140;
      ctx.beginPath();
      ctx.ellipse(x, 88 + (i % 2) * 36, 74, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#fffaf1';
    for (let i = 0; i < 3; i++) {
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
        ctx.filter = `drop-shadow(0 0 10px ${d.tint})`;
      } else if (d.img.includes('arch')) {
        ctx.filter = 'drop-shadow(0 0 10px rgba(255,255,255,0.25))';
      }
      drawImageBottom(img, d.x, d.y, d.h || 72, d.w, d.flip || 1);
      if (d.img.includes('arch') && Math.sin(time * 0.06 + d.x * 0.03) > 0.68) {
        ctx.globalAlpha = 0.4;
        drawImageCentered(assets.star_pink, d.x + 26, d.y - 14, 16);
      }
      ctx.restore();
    }
  }

  function drawPlatforms() {
    for (const p of platforms) {
      if (!p.alive) continue;
      let drawY = p.y + (p.hit ? Math.sin(time * 0.5) * 2 : 0);
      let img = assets.icing_long;
      let h = p.h + 16;
      if (p.kind === 'icing') img = p.w > 260 ? assets.icing_long : assets.icing_block2;
      if (p.kind === 'choco') img = p.w > 200 ? assets.choco_long : assets.choco_double;
      if (p.kind === 'cookie') {
        if (p.crumbleTimer >= 52) img = assets.cookie_cracked_3;
        else if (p.crumbleTimer >= 30) img = assets.cookie_cracked_2;
        else if (p.crumbleTimer >= 12) img = assets.cookie_cracked_1;
        else img = p.w > 160 ? assets.cookie_long : assets.cookie_block;
      }
      if (p.kind === 'wafer') img = p.w > 200 ? assets.wafer_long : assets.wafer_platform;
      if (p.kind === 'syrup') img = p.w > 140 ? assets.choco_long : assets.choco_double;
      if (p.kind === 'tilt') img = assets.wafer_bar;
      if (p.kind === 'slide') img = assets.icing_block2;
      if (p.kind === 'moving') img = assets.wafer_moving;
      if (p.kind === 'raft') img = assets.marshmallow_2;
      if (p.kind === 'elevator') img = assets.icing_block;
      if (p.kind === 'break') img = p.hit ? assets.cookie_cracked_2 : assets.cookie_cracked_1;
      if (p.kind === 'sugarGate') {
        drawImageBottom(assets.gate_intact, p.x, p.y + p.h, p.h + 18, p.w);
        ctx.save();
        ctx.globalAlpha = 0.22 + Math.sin(time * 0.12 + p.x * 0.01) * 0.08;
        drawImageCentered(assets.star_purple, p.x + p.w / 2, p.y + p.h / 2, 14);
        ctx.restore();
        continue;
      }
      if (p.kind === 'blinkGate') {
        ctx.save();
        ctx.globalAlpha = p.open ? 0.25 : 0.95;
        drawImageBottom(assets.gate_intact, p.x, p.y + p.h, p.h + 18, p.w);
        ctx.globalAlpha = p.open ? 0.14 : 0.3;
        drawImageCentered(assets.star_blue, p.x + p.w / 2, p.y + p.h / 2, 14);
        ctx.restore();
        continue;
      }
      if (p.kind === 'bounce') {
        const pulse = Math.sin(time * 0.18 + p.x * 0.02) * 2;
        drawImageBottom(assets.marshmallow_1, p.x - 4, p.y + p.h + 6 + pulse, 40 - pulse * 0.5, p.w + 8);
        continue;
      }
      if (p.kind === 'float') {
        drawImageBottom(assets.lollipop_pink, p.x + p.w / 2 - 24, p.y + p.h + 18, 52, 48);
        drawImageBottom(assets.cookie_round, p.x, p.y + p.h + 10, 34, p.w);
        continue;
      }
      if (p.kind === 'raft') drawY += Math.sin(time * 0.08 + p.x * 0.01) * 3;
      drawImageBottom(img, p.x, drawY + p.h + 12, h, p.w);
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
      if (e.alert && !e.giant) ctx.filter = 'drop-shadow(0 0 8px rgba(255,245,220,0.8))';
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
      ctx.filter = 'drop-shadow(0 0 18px rgba(255, 239, 120, 0.95))';
      drawImageBottom(frame, player.x - 8, player.y + player.h + 6, heroHeight, undefined, player.face > 0 ? 1 : -1);
      ctx.restore();
    }
    if (flair) {
      ctx.save();
      ctx.globalAlpha = 0.24 + Math.sin(time * 0.18) * 0.08;
      ctx.filter = 'drop-shadow(0 0 12px rgba(255,242,122,0.95))';
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

  function isMobileCanvas() {
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const stage = canvas.parentElement;
    const rect = stage ? stage.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    return coarse || rect.width < 1180 || rect.height < 620 || Math.min(window.innerWidth, window.innerHeight) < 760;
  }

  function updateDomHud() {
    if (!level) return;
    const showHud = gameState === 'playing';
    const levelSpecialTotal = levelSpecialCount(levelIndex);
    const levelSpecialFound = collectedSpecialCount(levelIndex);
    hudLevelName.textContent = level.name;
    hudLevelValue.textContent = `${levelIndex + 1}/${LEVELS.length}`;
    hudCandyValue.textContent = String(score);
    hudTotalValue.textContent = String(totalCandy + score);
    hudHeartsValue.textContent = `${Math.max(0, player.hearts)}/${maxHearts}`;
    hudLivesValue.textContent = String(lives);
    hudTimeValue.textContent = formatLevelTimer(levelTimer);
    hudSpecialsValue.textContent = `${levelSpecialFound}/${levelSpecialTotal}`;
    hudTipText.textContent = level.tip;
    hudLifeText.textContent = `Next extra life at ${nextExtraLifeAt} total candy`;
    hudChapterText.textContent = level.chapter;
    hudSugarFill.style.width = `${Math.max(0, Math.min(100, sugarTimer > 0 ? 100 : sugar))}%`;
    canvas.parentElement.classList.toggle('hud-hidden', !showHud);
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
    const reveal = mapRevealTimer > 0 ? 1 - (mapRevealTimer / 42) : 1;
    const globalAllSpecials = allSpecialsComplete();
    const nodeLayout = WORLD_MAP_NODES.map(node => ({
      x: compact ? (node.mobileX ?? node.x) : node.x,
      y: compact ? (node.mobileY ?? node.y) : node.y,
      labelDy: compact ? (node.mobileLabelDy ?? node.labelDy ?? 38) : (node.labelDy ?? 42)
    }));
    const branchLayout = WORLD_MAP_BRANCH_NODES.map(node => ({
      ...node,
      x: compact ? (node.mobileX ?? node.x) : node.x,
      y: compact ? (node.mobileY ?? node.y) : node.y
    }));
    const bonusNode = {
      ...WORLD_MAP_BONUS_NODE,
      x: compact ? (WORLD_MAP_BONUS_NODE.mobileX ?? WORLD_MAP_BONUS_NODE.x) : WORLD_MAP_BONUS_NODE.x,
      y: compact ? (WORLD_MAP_BONUS_NODE.mobileY ?? WORLD_MAP_BONUS_NODE.y) : WORLD_MAP_BONUS_NODE.y
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
    ctx.strokeStyle = 'rgba(240,178,207,.82)';
    ctx.lineWidth = compact ? 8 : 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nodeLayout[0].x, nodeLayout[0].y);
    for (let i = 1; i < nodeLayout.length; i++) ctx.lineTo(nodeLayout[i].x, nodeLayout[i].y);
    ctx.stroke();

    for (const branch of branchLayout) {
      if (!rewardRouteUnlocked(branch.levelIndex)) continue;
      const main = nodeLayout[branch.levelIndex];
      ctx.strokeStyle = 'rgba(255,240,170,.72)';
      ctx.lineWidth = compact ? 5 : 6;
      ctx.beginPath();
      ctx.moveTo(main.x, main.y);
      ctx.quadraticCurveTo((main.x + branch.x) / 2, Math.min(main.y, branch.y) - (compact ? 18 : 22), branch.x, branch.y);
      ctx.stroke();
    }

    if (globalAllSpecials) {
      const gateNode = nodeLayout[5];
      ctx.strokeStyle = 'rgba(255,242,122,.82)';
      ctx.lineWidth = compact ? 6 : 7;
      ctx.beginPath();
      ctx.moveTo(gateNode.x, gateNode.y);
      ctx.quadraticCurveTo((gateNode.x + bonusNode.x) / 2, bonusNode.y - (compact ? 14 : 18), bonusNode.x, bonusNode.y);
      ctx.stroke();
    }

    WORLD_MAP_NODES.forEach((node, index) => {
      const pos = nodeLayout[index];
      const unlocked = index <= unlockedLevel;
      const completed = index < unlockedLevel;
      const isNext = index === mapLevelIndex;
      const specialTotal = levelSpecialCount(index);
      const specialFound = collectedSpecialCount(index);
      const allSpecials = specialTotal > 0 && specialFound === specialTotal;
      const plateFill = unlocked ? node.plate : 'rgba(240,234,238,.76)';
      const ringFill = unlocked ? node.color : '#d8c8d0';
      const plateW = compact ? 56 : 62;
      const plateH = compact ? 52 : 58;
      const iconSize = compact ? (node.icon === 'candy_arch' ? 28 : 20) : (node.icon === 'candy_arch' ? 34 : 24);

      roundRect(pos.x - plateW / 2, pos.y - plateH / 2, plateW, plateH, compact ? 18 : 20, plateFill, 'rgba(90,46,32,.12)');
      ctx.fillStyle = ringFill;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - 2, compact ? (isNext ? 18 : 15) : (isNext ? 21 : 18), 0, Math.PI * 2);
      ctx.fill();

      if (unlocked) {
        drawImageCentered(assets[node.icon], pos.x, pos.y - 4, iconSize);
        drawImageCentered(assets[node.badge], pos.x + (compact ? 12 : 14), pos.y - (compact ? 14 : 16), compact ? 11 : 13);
      } else {
        ctx.fillStyle = '#8f7f88';
        ctx.font = compact ? '900 10px system-ui' : '900 11px system-ui';
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
        ctx.lineWidth = compact ? 4 : 5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - 2, compact ? 22 + Math.sin(mapPulse) * 1.5 : 25 + Math.sin(mapPulse) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      const badgeStep = compact ? 11 : 13;
      const badgeY = pos.y + pos.labelDy - (compact ? 9 : 10);
      for (let badgeIndex = 0; badgeIndex < specialTotal; badgeIndex++) {
        const badgeX = pos.x + (badgeIndex - (specialTotal - 1) / 2) * badgeStep;
        if (badgeIndex < specialFound) {
          drawImageCentered(assets[node.stamp], badgeX, badgeY, compact ? 8 : 10);
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

      roundRect(pos.x - (compact ? 26 : 28), pos.y + pos.labelDy, compact ? 52 : 58, 15, 8, 'rgba(255,248,239,.72)', 'rgba(90,46,32,.10)');
      ctx.fillStyle = '#5a2e20';
      ctx.font = compact ? '800 9px system-ui' : '800 10px system-ui';
      ctx.fillText(node.label, pos.x, pos.y + pos.labelDy + 11);

      if (allSpecials) {
        roundRect(pos.x - (compact ? 18 : 20), pos.y + pos.labelDy + (compact ? 18 : 20), compact ? 36 : 40, compact ? 11 : 12, 6, 'rgba(255,255,255,.86)', 'rgba(255,242,122,.28)');
        ctx.fillStyle = '#d83787';
        ctx.font = compact ? '900 7px system-ui' : '900 8px system-ui';
        ctx.fillText('BONUS', pos.x, pos.y + pos.labelDy + (compact ? 26 : 29));
        drawImageCentered(assets.star_pink, pos.x + (compact ? 24 : 28), pos.y - (compact ? 28 : 32), compact ? 12 : 14);
      }
    });

    for (const branch of branchLayout) {
      if (!rewardRouteUnlocked(branch.levelIndex)) continue;
      const worldDone = hasAllSpecialsInLevel(branch.levelIndex);
      const plateW = compact ? 48 : 54;
      const plateH = compact ? 38 : 42;
      roundRect(branch.x - plateW / 2, branch.y - plateH / 2, plateW, plateH, compact ? 15 : 17, branch.plate, 'rgba(90,46,32,.10)');
      ctx.fillStyle = branch.color;
      ctx.beginPath();
      ctx.arc(branch.x, branch.y - 4, compact ? 12 : 14, 0, Math.PI * 2);
      ctx.fill();
      drawImageCentered(assets[branch.icon], branch.x, branch.y - 5, compact ? 15 : 18);
      roundRect(branch.x - (compact ? 26 : 30), branch.y + (compact ? 14 : 16), compact ? 52 : 60, compact ? 12 : 13, 6, 'rgba(255,248,239,.76)', 'rgba(90,46,32,.08)');
      ctx.fillStyle = '#5a2e20';
      ctx.font = compact ? '800 7px system-ui' : '800 8px system-ui';
      ctx.fillText(branch.label, branch.x, branch.y + (compact ? 22 : 25));
      ctx.fillStyle = worldDone ? '#d83787' : '#a45627';
      ctx.font = compact ? '900 6px system-ui' : '900 7px system-ui';
      ctx.fillText(worldDone ? 'OPEN' : 'ROUTE', branch.x, branch.y + (compact ? 31 : 35));
    }

    if (globalAllSpecials) {
      roundRect(bonusNode.x - (compact ? 32 : 36), bonusNode.y - (compact ? 28 : 30), compact ? 64 : 72, compact ? 52 : 58, compact ? 18 : 20, bonusNode.plate, 'rgba(255,242,122,.20)');
      ctx.fillStyle = bonusNode.color;
      ctx.beginPath();
      ctx.arc(bonusNode.x, bonusNode.y - 5, compact ? 16 : 18, 0, Math.PI * 2);
      ctx.fill();
      drawImageCentered(assets[bonusNode.icon], bonusNode.x, bonusNode.y - 6, compact ? 18 : 22);
      roundRect(bonusNode.x - (compact ? 34 : 40), bonusNode.y + (compact ? 12 : 14), compact ? 68 : 80, compact ? 14 : 16, 7, 'rgba(255,248,239,.88)', 'rgba(255,242,122,.24)');
      ctx.fillStyle = '#d83787';
      ctx.font = compact ? '900 8px system-ui' : '900 9px system-ui';
      ctx.fillText(bonusNode.label, bonusNode.x, bonusNode.y + (compact ? 22 : 26));
      ctx.fillStyle = '#a45627';
      ctx.font = compact ? '900 6px system-ui' : '900 7px system-ui';
      ctx.fillText('SECRET', bonusNode.x, bonusNode.y + (compact ? 31 : 36));
    }

    const markerFrom = nodeLayout[mapMarkerFromIndex];
    const markerTo = nodeLayout[mapMarkerToIndex];
    const markerT = mapMarkerProgress;
    const markerX = markerFrom.x + (markerTo.x - markerFrom.x) * markerT;
    const markerY = markerFrom.y + (markerTo.y - markerFrom.y) * markerT - (compact ? 12 : 14) - Math.sin(markerT * Math.PI) * 2;
    const markerFlip = markerTo.x >= markerFrom.x ? 1 : -1;
    drawImageBottom(assets[currentMapHeroFrame()], markerX - (compact ? 18 : 20), markerY + (compact ? 18 : 22), compact ? 42 : 46, undefined, markerFlip);
    if (mapArrivalTimer > 0) {
      const sparkleAlpha = mapArrivalTimer / 24;
      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7 + mapPulse * 1.2;
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
      roundRect(18, H - 58, 196, 40, 12, 'rgba(255,248,239,.62)', '#ffffff');
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 10px system-ui';
      ctx.fillText(LEVELS[mapLevelIndex].name, 116, H - 40);
      ctx.font = '800 9px system-ui';
      const routeText = rewardRouteUnlocked(mapLevelIndex) ? 'Bonus route open' : `Specials ${collectedSpecialCount(mapLevelIndex)}/${levelSpecialCount(mapLevelIndex)}`;
      ctx.fillText(routeText, 116, H - 26);
      if (globalAllSpecials) {
        roundRect(W - 182, H - 54, 160, 34, 12, 'rgba(255,248,239,.72)', '#ffffff');
        ctx.fillStyle = '#d83787';
        ctx.font = '900 10px system-ui';
        ctx.fillText('Secret Badge Ready', W - 102, H - 32);
      }
    } else if (globalAllSpecials) {
      roundRect(W - 248, 18, 204, 36, 14, 'rgba(255,248,239,.72)', '#ffffff');
      ctx.fillStyle = '#d83787';
      ctx.font = '900 12px system-ui';
      ctx.fillText('Secret Ending Badge Ready', W - 146, 42);
    } else if (rewardRouteUnlocked(mapLevelIndex)) {
      roundRect(W - 230, 18, 186, 36, 14, 'rgba(255,248,239,.72)', '#ffffff');
      ctx.fillStyle = '#a45627';
      ctx.font = '900 12px system-ui';
      ctx.fillText('Bonus Route Open', W - 137, 42);
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
    if (compact) {
      roundRect(90, H - 164, 780, 120, 24, 'rgba(255,245,252,.92)', '#ffffff');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d83787';
      ctx.font = '900 24px system-ui';
      ctx.fillText(levelIndex < LEVELS.length - 1 ? 'Chapter Clear!' : 'The Way Home Is Open!', W / 2, H - 126);
      ctx.fillStyle = '#5a2e20';
      ctx.font = '800 14px system-ui';
      ctx.fillText(levelIndex < LEVELS.length - 1 ? level.success : 'Hold steady. The final scene is next.', W / 2, H - 102, 700);
      ctx.font = '700 12px system-ui';
      ctx.fillText(`Specials found ${collectedSpecialCount(levelIndex)}/${levelSpecialCount(levelIndex)}`, W / 2, H - 80);
      ctx.fillText('Tap Go to continue.', W / 2, H - 62);
      ctx.textAlign = 'start';
      return;
    }
    roundRect(176, 140, 608, 250, 28, 'rgba(255,245,252,.96)', '#ffffff');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d83787';
    ctx.font = compact ? '900 34px system-ui' : '900 42px system-ui';
    if (levelIndex < LEVELS.length - 1) {
      ctx.fillText('Chapter Clear!', W / 2, compact ? 196 : 214);
      ctx.fillStyle = '#5a2e20';
      ctx.font = compact ? '800 20px system-ui' : '800 22px system-ui';
      ctx.fillText(`You cleared ${level.name}.`, W / 2, compact ? 240 : 258);
      ctx.font = compact ? '700 17px system-ui' : '700 18px system-ui';
      ctx.fillText(level.success, W / 2, compact ? 286 : 304, compact ? 700 : 520);
      ctx.fillText(`Specials found ${collectedSpecialCount(levelIndex)}/${levelSpecialCount(levelIndex)}`, W / 2, compact ? 320 : 334);
      ctx.fillText('The next candy trail is opening...', W / 2, compact ? 350 : 362);
    } else {
      ctx.fillText('The Way Home Is Open!', W / 2, compact ? 196 : 214);
      ctx.fillStyle = '#5a2e20';
      ctx.font = compact ? '800 20px system-ui' : '800 22px system-ui';
      ctx.fillText('The way home is finally within reach.', W / 2, compact ? 240 : 258);
      ctx.font = compact ? '700 17px system-ui' : '700 18px system-ui';
      ctx.fillText('Hold steady. The final scene is next.', W / 2, compact ? 286 : 304);
    }
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
      ctx.fillText('Tap Try to restart from Chapter 1.', W / 2, H - 106);
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
    ctx.fillText('Press Enter to start a fresh run from Chapter 1.', W / 2, compact ? 286 : 304);
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
    const levelBackgroundsReady = Object.values(backgroundImages).every(img => img.complete && img.naturalWidth > 0);
    if (!loopStarted && levelBackgroundsReady) {
      loopStarted = true;
      loop();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  unlockedLevel = readUnlockedLevel();
  selectedHero = readSelectedHero();
  specialProgress = readSpecialProgress();
  rewardProgress = readRewardProgress();
  updateHeroButton();
  updateFullscreenButton();
  updatePauseButton();
  updateUiMode();
  bootToGame();
  Object.values(backgroundImages).forEach(img => {
    img.onload = startLoopWhenReady;
  });
  if (Object.values(backgroundImages).every(img => img.complete && img.naturalWidth > 0)) startLoopWhenReady();
})();
