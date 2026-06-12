(() => {
  const WORLD_MAP_NODES = [
    { x: 118, y: 318, mobileX: 112, mobileY: 348, color: '#ff8fc8', icon: 'lollipop_pink', badge: 'bean_red', plate: '#fff0f7', label: 'Meadow', stamp: 'star_pink', labelDy: 42, mobileLabelDy: 46 },
    { x: 278, y: 262, mobileX: 252, mobileY: 292, color: '#f7b55a', icon: 'cookie_round', badge: 'star_purple', plate: '#fff3e3', label: 'Pretzel', stamp: 'star_purple', labelDy: 42, mobileLabelDy: 42 },
    { x: 404, y: 312, mobileX: 390, mobileY: 344, color: '#8ddfff', icon: 'icing_block2', badge: 'star_blue', plate: '#eefcff', label: 'Falls', stamp: 'star_blue', labelDy: 46, mobileLabelDy: 46 },
    { x: 590, y: 268, mobileX: 536, mobileY: 292, color: '#f6d56d', icon: 'wafer_platform', badge: 'bean_green', plate: '#fff8df', label: 'Woods', stamp: 'bean_green', labelDy: 42, mobileLabelDy: 42 },
    { x: 742, y: 258, mobileX: 682, mobileY: 336, color: '#ffb3d6', icon: 'cookie_block', badge: 'star_pink', plate: '#fff1f7', label: 'Cake', stamp: 'star_pink', labelDy: 46, mobileLabelDy: 46 },
    { x: 868, y: 168, mobileX: 824, mobileY: 244, color: '#79f0c3', icon: 'candy_arch', badge: 'star_blue', plate: '#effff9', label: 'Gate', stamp: 'candy_arch', labelDy: 40, mobileLabelDy: 40 }
  ];

  const WORLD_MAP_BRANCH_NODES = [
    { levelIndex: 0, x: 198, y: 222, mobileX: 174, mobileY: 246, color: '#ffd86a', plate: '#fff8dd', icon: 'lollipop_green', label: 'Grove' },
    { levelIndex: 1, x: 352, y: 190, mobileX: 322, mobileY: 204, color: '#ffc48a', plate: '#fff1e1', icon: 'wafer_bar', label: 'Jungle' },
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
