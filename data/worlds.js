(() => {
  const WORLDS = [
    {
      id: 'world-1',
      name: 'Candy Meadow',
      shortName: 'World 1',
      description: 'The first candy-world trail from Lollipop Meadow to the kingdom gate.',
      mainStageIds: [
        'world-1-lollipop-meadow',
        'world-1-pretzel-path',
        'world-1-ice-cream-falls',
        'world-1-waffle-woods',
        'world-1-cake-courtyard',
        'world-1-kingdom-gate'
      ],
      sideStageIds: [
        'world-1-gummy-grove',
        'world-1-jungle-jelly-run',
        'world-1-marshmallow-driftway',
        'world-1-lantern-lollipop-loop',
        'world-1-sugar-skyway-sprint',
        'world-1-morning-star-run'
      ],
      mapId: 'world-1-map',
      unlock: {
        type: 'availableAtStart',
        description: 'World 1 is available when a new adventure begins.'
      }
    }
  ];

  window.CandyQuestWorlds = {
    WORLDS
  };
})();
