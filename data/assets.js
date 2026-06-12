(() => {
  const LEVEL_BACKGROUNDS = {
    meadow: { haze: 'rgba(255, 255, 255, 0.10)' },
    licorice: { haze: 'rgba(255, 255, 255, 0.10)' },
    falls: { haze: 'rgba(255, 255, 255, 0.12)' },
    woods: { haze: 'rgba(255, 255, 255, 0.08)' },
    courtyard: { haze: 'rgba(255, 255, 255, 0.10)' },
    keep: { haze: 'rgba(255, 255, 255, 0.08)' },
    gummy: { haze: 'rgba(255, 255, 255, 0.10)' },
    jungle: { haze: 'rgba(255, 255, 255, 0.08)' },
    mallows: { haze: 'rgba(255, 255, 255, 0.12)' },
    lollipops: { haze: 'rgba(255, 255, 255, 0.10)' },
    sky: { haze: 'rgba(255, 255, 255, 0.08)' }
  };

  const THEME_AMBIENCE = {
    meadow: { colors: ['#fff6de', '#ff9ed0', '#87ddff'], count: 20, driftX: -0.18, driftY: 0.02, sparkle: 0.26, gumdrops: 0.10 },
    licorice: { colors: ['#fff2d5', '#f7c471', '#ff8ab8'], count: 18, driftX: -0.15, driftY: 0.015, sparkle: 0.22, gumdrops: 0.08 },
    falls: { colors: ['#fef9ff', '#89e4ff', '#c6f4ff'], count: 22, driftX: -0.12, driftY: 0.04, sparkle: 0.38, gumdrops: 0.06 },
    woods: { colors: ['#fff1c7', '#baf3aa', '#8fddff'], count: 18, driftX: -0.10, driftY: 0.025, sparkle: 0.24, gumdrops: 0.08 },
    courtyard: { colors: ['#fff0db', '#ffb0d4', '#fff5a4'], count: 18, driftX: -0.14, driftY: 0.018, sparkle: 0.32, gumdrops: 0.08 },
    keep: { colors: ['#fef8e0', '#87f0cc', '#9bdfff'], count: 20, driftX: -0.16, driftY: 0.02, sparkle: 0.34, gumdrops: 0.05 },
    gummy: { colors: ['#ffe5f5', '#ff8dc5', '#8de4ff'], count: 20, driftX: -0.14, driftY: 0.024, sparkle: 0.28, gumdrops: 0.14 },
    jungle: { colors: ['#fff3c9', '#baf3aa', '#8ddfff'], count: 18, driftX: -0.10, driftY: 0.022, sparkle: 0.22, gumdrops: 0.10 },
    mallows: { colors: ['#fff8ef', '#ffd2ef', '#a9ebff'], count: 22, driftX: -0.12, driftY: 0.028, sparkle: 0.34, gumdrops: 0.08 },
    lollipops: { colors: ['#fff3da', '#ff9ad1', '#8fd7ff'], count: 20, driftX: -0.16, driftY: 0.018, sparkle: 0.24, gumdrops: 0.12 },
    sky: { colors: ['#fff9e5', '#ffd2ef', '#9de9ff'], count: 18, driftX: -0.18, driftY: 0.014, sparkle: 0.30, gumdrops: 0.06 }
  };

  const BACKGROUND_LAYOUTS = {
    meadow: { scale: 1.02, focusX: 0.32, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.30 },
    licorice: { scale: 1.03, focusX: 0.36, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.34 },
    falls: { scale: 1.04, focusX: 0.46, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.44 },
    woods: { scale: 1.03, focusX: 0.56, focusY: 0.53, mobileScale: 1.0, mobileFocusX: 0.54 },
    courtyard: { scale: 1.03, focusX: 0.62, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.60 },
    keep: { scale: 1.04, focusX: 0.72, focusY: 0.47, mobileScale: 1.0, mobileFocusX: 0.70 },
    gummy: { scale: 1.02, focusX: 0.36, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.34 },
    jungle: { scale: 1.04, focusX: 0.42, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.40 },
    mallows: { scale: 1.03, focusX: 0.46, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.44 },
    lollipops: { scale: 1.02, focusX: 0.34, focusY: 0.50, mobileScale: 1.0, mobileFocusX: 0.32 },
    sky: { scale: 1.02, focusX: 0.50, focusY: 0.46, mobileScale: 1.0, mobileFocusX: 0.48 },
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


  window.CandyQuestAssets = {
    LEVEL_BACKGROUNDS,
    THEME_AMBIENCE,
    BACKGROUND_LAYOUTS,
    HERO_FRAMES,
    ENEMY_FRAMES,
    assetNames
  };
})();
