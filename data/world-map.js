(() => {
  const WORLD_MAP_NODES = [
    { x: 100, y: 318, mobileX: 92, mobileY: 354, color: '#ff8fc8', icon: 'lollipop_pink', badge: 'bean_red', plate: '#fff0f7', label: 'Meadow', stamp: 'star_pink', labelDy: 42, mobileLabelDy: 46, stageIndex: 0, unlockLevel: 0 },
    // Grove and Jungle still live in BONUS_STAGES for save/stage-index compatibility, but they are now World 1 main-path stops.
    { x: 215, y: 256, mobileX: 200, mobileY: 286, color: '#ffd86a', icon: 'lollipop_green', badge: 'bean_green', plate: '#fff8dd', label: 'Grove', stamp: 'bean_green', labelDy: 42, mobileLabelDy: 42, stageIndex: 6, unlockLevel: 1 },
    { x: 330, y: 314, mobileX: 302, mobileY: 344, color: '#f7b55a', icon: 'cookie_round', badge: 'star_purple', plate: '#fff3e3', label: 'Pretzel', stamp: 'star_purple', labelDy: 42, mobileLabelDy: 42, stageIndex: 1, unlockLevel: 1 },
    { x: 445, y: 252, mobileX: 410, mobileY: 246, color: '#ffc48a', icon: 'wafer_bar', badge: 'star_purple', plate: '#fff1e1', label: 'Jungle', stamp: 'star_purple', labelDy: 42, mobileLabelDy: 42, stageIndex: 7, unlockLevel: 2 },
    { x: 555, y: 312, mobileX: 512, mobileY: 344, color: '#8ddfff', icon: 'icing_block2', badge: 'star_blue', plate: '#eefcff', label: 'Falls', stamp: 'star_blue', labelDy: 46, mobileLabelDy: 46, stageIndex: 2, unlockLevel: 2 },
    { x: 665, y: 268, mobileX: 615, mobileY: 292, color: '#f6d56d', icon: 'wafer_platform', badge: 'bean_green', plate: '#fff8df', label: 'Woods', stamp: 'bean_green', labelDy: 42, mobileLabelDy: 42, stageIndex: 3, unlockLevel: 3 },
    { x: 780, y: 292, mobileX: 720, mobileY: 336, color: '#ffb3d6', icon: 'cookie_block', badge: 'star_pink', plate: '#fff1f7', label: 'Cake', stamp: 'star_pink', labelDy: 46, mobileLabelDy: 46, stageIndex: 4, unlockLevel: 4 },
    { x: 890, y: 168, mobileX: 830, mobileY: 244, color: '#79f0c3', icon: 'candy_arch', badge: 'star_blue', plate: '#effff9', label: 'Gate', stamp: 'candy_arch', labelDy: 40, mobileLabelDy: 40, stageIndex: 5, unlockLevel: 5 }
  ];

  const WORLD_MAP_BRANCH_NODES = [
    { levelIndex: 2, x: 492, y: 226, mobileX: 468, mobileY: 250, color: '#9de9ff', plate: '#eefcff', icon: 'marshmallow_2', label: 'Drift' },
    { levelIndex: 3, x: 666, y: 182, mobileX: 608, mobileY: 204, color: '#d8f37b', plate: '#f7ffe3', icon: 'wafer_platform', label: 'Loop' },
    { levelIndex: 4, x: 810, y: 168, mobileX: 754, mobileY: 226, color: '#ffb9de', plate: '#fff0f6', icon: 'gate_piece', label: 'Skyway' }
  ];

  const WORLD_MAP_BONUS_NODE = {
    x: 642, y: 104,
    mobileX: 610, mobileY: 130,
    color: '#fff27a',
    plate: '#fff9da',
    icon: 'star_pink',
    label: 'Morning Star'
  };

  const MAP_NODE_BRANCH_OFFSET = 100;
  const MAP_NODE_BONUS = 200;

  const WORLD_MAPS = {
    'world-1-map': {
      mapId: 'world-1-map',
      mainNodes: WORLD_MAP_NODES,
      branchNodes: WORLD_MAP_BRANCH_NODES,
      bonusNode: WORLD_MAP_BONUS_NODE
    }
  };

  window.CandyQuestMap = {
    WORLD_MAPS,
    WORLD_MAP_NODES,
    WORLD_MAP_BRANCH_NODES,
    WORLD_MAP_BONUS_NODE,
    MAP_NODE_BRANCH_OFFSET,
    MAP_NODE_BONUS
  };
})();
