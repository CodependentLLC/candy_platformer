(() => {
  const WORLD_MAP_NODES = [
    { x: 118, y: 318, mobileX: 116, mobileY: 342, color: '#ff8fc8', icon: 'lollipop_pink', badge: 'bean_red', plate: '#fff0f7', label: 'Meadow', stamp: 'star_pink', labelDy: 42, mobileLabelDy: 38 },
    { x: 278, y: 262, mobileX: 252, mobileY: 282, color: '#f7b55a', icon: 'cookie_round', badge: 'star_purple', plate: '#fff3e3', label: 'Pretzel', stamp: 'star_purple', labelDy: 42, mobileLabelDy: 34 },
    { x: 404, y: 312, mobileX: 392, mobileY: 338, color: '#8ddfff', icon: 'icing_block2', badge: 'star_blue', plate: '#eefcff', label: 'Falls', stamp: 'star_blue', labelDy: 46, mobileLabelDy: 38 },
    { x: 590, y: 268, mobileX: 560, mobileY: 284, color: '#f6d56d', icon: 'wafer_platform', badge: 'bean_green', plate: '#fff8df', label: 'Woods', stamp: 'bean_green', labelDy: 42, mobileLabelDy: 34 },
    { x: 742, y: 258, mobileX: 708, mobileY: 292, color: '#ffb3d6', icon: 'cookie_block', badge: 'star_pink', plate: '#fff1f7', label: 'Cake', stamp: 'star_pink', labelDy: 46, mobileLabelDy: 38 },
    { x: 868, y: 168, mobileX: 822, mobileY: 194, color: '#79f0c3', icon: 'candy_arch', badge: 'star_blue', plate: '#effff9', label: 'Gate', stamp: 'candy_arch', labelDy: 40, mobileLabelDy: 32 }
  ];

  const WORLD_MAP_BRANCH_NODES = [
    { levelIndex: 0, x: 198, y: 222, mobileX: 182, mobileY: 238, color: '#ffd86a', plate: '#fff8dd', icon: 'lollipop_green', label: 'Grove' },
    { levelIndex: 1, x: 352, y: 190, mobileX: 330, mobileY: 208, color: '#ffc48a', plate: '#fff1e1', icon: 'wafer_bar', label: 'Jungle' },
    { levelIndex: 2, x: 492, y: 226, mobileX: 468, mobileY: 246, color: '#9de9ff', plate: '#eefcff', icon: 'marshmallow_2', label: 'Drift' },
    { levelIndex: 3, x: 666, y: 182, mobileX: 634, mobileY: 198, color: '#d8f37b', plate: '#f7ffe3', icon: 'wafer_platform', label: 'Loop' },
    { levelIndex: 4, x: 810, y: 168, mobileX: 776, mobileY: 184, color: '#ffb9de', plate: '#fff0f6', icon: 'gate_piece', label: 'Skyway' }
  ];

  const WORLD_MAP_BONUS_NODE = {
    x: 642, y: 104,
    mobileX: 610, mobileY: 122,
    color: '#fff27a',
    plate: '#fff9da',
    icon: 'star_pink',
    label: 'Morning Star'
  };

  const MAP_NODE_BRANCH_OFFSET = 100;
  const MAP_NODE_BONUS = 200;


  window.CandyQuestMap = {
    WORLD_MAP_NODES,
    WORLD_MAP_BRANCH_NODES,
    WORLD_MAP_BONUS_NODE,
    MAP_NODE_BRANCH_OFFSET,
    MAP_NODE_BONUS
  };
})();
