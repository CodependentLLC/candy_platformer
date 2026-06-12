(() => {
  const { P, B, M, R, V, G, TG, E, C, S, D, F, HN, WZ } = window.CandyQuestShapes;

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
        P(0, 452, 360, 80, 'icing'), P(220, 452, 360, 80, 'icing'), P(520, 410, 120, 28, 'icing'), P(640, 452, 210, 80, 'icing'), P(860, 420, 100, 24, 'icing'), P(420, 392, 160, 22, 'cookie'),
        V(520, 386, 116, 18, 354, 398, 0.42, 'float'), V(640, 352, 150, 20, 320, 372, 0.55, 'float'), P(740, 274, 110, 18, 'cookie'), P(860, 228, 110, 18, 'icing'),
        P(850, 352, 240, 20, 'cookie'), P(1000, 262, 92, 18, 'cookie'), P(1130, 420, 220, 24, 'cookie'),
        B(1220, 402, 80), V(1332, 350, 112, 18, 318, 362, 0.48, 'float'), P(1452, 322, 126, 18, 'cookie'), P(1540, 338, 140, 20, 'cookie'),
        P(1700, 420, 280, 90, 'icing'), V(1838, 282, 112, 18, 244, 296, 0.56, 'float'), P(1960, 238, 110, 18, 'icing'), P(2020, 318, 120, 18, 'cookie'),
        P(940, 300, 78, 18, 'break')
      ],
      candies: [
        C('bean_red', 152, 404), C('bean_orange', 252, 392), C('bean_yellow', 360, 386), C('star_pink', 455, 346), C('bean_yellow', 590, 368),
        C('bean_green', 692, 308), C('bean_blue', 748, 404), C('bean_orange', 858, 388), C('star_blue', 896, 308), C('bean_blue', 960, 292),
        C('bean_purple', 1010, 262), C('star_purple', 1175, 372), C('bean_yellow', 1255, 358), C('bean_green', 1340, 328), C('star_pink', 1410, 332),
        C('bean_red', 1492, 292), C('bean_red', 1560, 290), C('bean_blue', 1660, 360), C('star_blue', 1760, 374), C('bean_yellow', 1838, 304),
        C('bean_green', 1880, 246), C('star_pink', 1970, 204), C('bean_purple', 2020, 220), C('star_purple', 2050, 272), C('bean_orange', 2090, 248),
        C('star_blue', 2120, 272)
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
        C('star_blue', 135, 406), C('bean_purple', 355, 370), C('bean_green', 430, 370), C('star_purple', 595, 328), C('bean_orange', 760, 294),
        C('bean_yellow', 950, 278), C('bean_red', 1015, 278), C('bean_purple', 1138, 350), C('star_pink', 1218, 258), C('bean_blue', 1188, 348),
        C('star_blue', 1360, 348), C('bean_purple', 1510, 308), C('bean_blue', 1638, 260), C('star_pink', 1710, 256), C('bean_green', 1770, 256),
        C('bean_yellow', 1888, 364), C('star_purple', 1980, 384), C('bean_red', 2088, 352), C('bean_orange', 2190, 334), C('star_blue', 2350, 284)
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

  const BONUS_STAGES = [
    {
      name: 'Gummy Grove',
      theme: 'gummy',
      chapter: 'Side Stage · Meadow Secret',
      story: 'A softer gummy grove opens above the meadow, full of floating candy lifts and a hidden path that only appears after a perfect first world.',
      tip: 'Side route: stay calm on the floating lifts, then bounce through the gummy climb to the high arch.',
      success: 'You found the hidden gummy grove and rode the floating candy trail all the way through.',
      worldW: 1880,
      start: { x: 70, y: 392 },
      goal: { x: 1740, y: 234 },
      decor: [D(548, 260, 'lollipop_green', { h: 62, alpha: 0.76 }), D(1048, 214, 'candy_arch', { h: 60, alpha: 0.34 }), D(1600, 180, 'lollipop_pink', { h: 66, alpha: 0.72 })],
      platforms: [
        P(0, 452, 280, 80, 'icing'), P(320, 416, 160, 22, 'cookie'), V(510, 382, 110, 18, 348, 392, 0.48, 'float'),
        V(660, 334, 116, 18, 302, 344, 0.52, 'float'), P(820, 292, 110, 18, 'icing'), B(962, 392, 82),
        P(1080, 334, 150, 20, 'cookie'), V(1280, 300, 116, 18, 258, 312, 0.56, 'float'), P(1444, 248, 120, 18, 'icing'),
        P(1584, 322, 140, 20, 'cookie'), P(1684, 420, 196, 80, 'icing')
      ],
      candies: [
        C('bean_green', 148, 404), C('star_pink', 376, 382), C('bean_blue', 560, 344), C('star_blue', 718, 292),
        C('bean_purple', 872, 254), C('star_purple', 1000, 354), C('bean_orange', 1168, 294), C('star_blue', 1326, 252),
        C('bean_red', 1494, 208), C('star_pink', 1718, 280)
      ],
      specials: [],
      enemies: [E(402, 382, 'gummy', 90), E(1110, 300, 'marsh', 80), E(1520, 286, 'beetle', 90)],
      checkpoints: [{ x: 1020, y: 360, active: false }, { x: 1518, y: 268, active: false }],
      npcs: [F(196, 420, 'jelly_green', 'This grove only opens for careful explorers.')],
      signs: [HN(492, 388, 'Floating lifts rise in a slow rhythm.')],
      wonders: [WZ(648, 286, 170, 120, 'The secret grove hangs above the main road like a quiet candy balcony.', { color: '#ff9ed0' })]
    },
    {
      name: 'Jungle Jelly Run',
      theme: 'jungle',
      chapter: 'Side Stage · Pretzel Secret',
      story: 'Past the forked pretzel roads, a jelly jungle shortcut twists through leaning planks and quick moving shelves.',
      tip: 'Side route: use the tilting planks early, then chain them into the moving jungle shelves without rushing.',
      success: 'You cut through the jelly jungle and handled the forked shortcut cleanly.',
      worldW: 1960,
      start: { x: 70, y: 392 },
      goal: { x: 1822, y: 214 },
      decor: [D(624, 244, 'lollipop_orange', { h: 62, alpha: 0.72 }), D(1198, 198, 'candy_arch', { h: 58, alpha: 0.34 }), D(1646, 170, 'lollipop_purple', { h: 68, alpha: 0.72 })],
      platforms: [
        P(0, 452, 290, 80, 'choco'), P(312, 416, 150, 22, 'cookie'), P(522, 378, 132, 20, 'tilt'), P(702, 334, 124, 18, 'wafer'),
        M(852, 318, 126, 22, 852, 1012, 1.15), P(1038, 274, 126, 18, 'tilt'), P(1208, 226, 118, 18, 'wafer'),
        P(1362, 338, 146, 20, 'tilt'), B(1542, 388, 82), M(1648, 282, 126, 22, 1648, 1810, 1.18), P(1782, 420, 178, 80, 'icing')
      ],
      candies: [
        C('bean_red', 164, 404), C('star_purple', 390, 382), C('bean_green', 570, 336), C('star_blue', 734, 290),
        C('bean_blue', 920, 280), C('star_pink', 1082, 238), C('bean_orange', 1248, 190), C('star_blue', 1418, 296),
        C('bean_purple', 1570, 350), C('star_pink', 1718, 238)
      ],
      specials: [],
      enemies: [E(396, 382, 'beetle', 90), E(1112, 240, 'gummy', 90), E(1450, 304, 'jaw', 70)],
      checkpoints: [{ x: 1046, y: 296, active: false }, { x: 1590, y: 354, active: false }],
      npcs: [F(208, 420, 'jelly_orange', 'The shortcut is shorter, but it never sits still.')],
      signs: [HN(522, 346, 'Lean with the plank, then land centered.')],
      wonders: [WZ(1112, 214, 180, 120, 'A hidden fork lifts you into the jungle canopy above the pretzel roads.', { color: '#baf3aa' })]
    },
    {
      name: 'Marshmallow Driftway',
      theme: 'mallows',
      chapter: 'Side Stage · Falls Secret',
      story: 'Beyond the cold cliffs, a marshmallow driftway glides through the mist on moving rafts and slick frosting shelves.',
      tip: 'Side route: wait for the raft, keep centered, then ride the frosting slides into the upper mist.',
      success: 'You crossed the marshmallow driftway and stayed steady through the raft and slide climb.',
      worldW: 2040,
      start: { x: 70, y: 392 },
      goal: { x: 1890, y: 218 },
      decor: [D(732, 244, 'candy_arch', { h: 60, alpha: 0.32 }), D(1330, 212, 'lollipop_sprinkle', { h: 68, alpha: 0.72 }), D(1732, 176, 'lollipop_green', { h: 66, alpha: 0.68 })],
      platforms: [
        P(0, 452, 280, 80, 'icing'), P(324, 420, 154, 22, 'cookie'), R(520, 444, 128, 520, 760, 1.02), P(702, 390, 120, 18, 'slide', { slideDir: 0.24 }),
        P(874, 350, 138, 20, 'icing'), M(1056, 314, 128, 22, 1056, 1224, 1.14), P(1228, 258, 108, 18, 'slide', { slideDir: 0.28 }),
        B(1392, 392, 80), P(1490, 318, 142, 20, 'icing'), R(1660, 344, 124, 1660, 1810, 1.0), P(1828, 420, 212, 80, 'icing')
      ],
      candies: [
        C('bean_blue', 158, 404), C('star_pink', 382, 388), C('bean_green', 568, 396), C('star_blue', 760, 354),
        C('bean_orange', 930, 312), C('star_purple', 1112, 276), C('bean_red', 1282, 220), C('star_blue', 1412, 350),
        C('bean_purple', 1570, 282), C('star_pink', 1738, 294)
      ],
      specials: [],
      enemies: [E(382, 386, 'gummy', 90), E(930, 316, 'marsh', 80), E(1532, 286, 'beetle', 90)],
      checkpoints: [{ x: 1088, y: 336, active: false }, { x: 1600, y: 286, active: false }],
      npcs: [F(194, 420, 'jelly_blue', 'These rafts drift slower than the cold falls below.')],
      signs: [HN(522, 422, 'Stand still until the raft lines up.')],
      wonders: [WZ(648, 366, 190, 120, 'The driftway glows through the mist like a marshmallow bridge in the sky.', { color: '#a9ebff' })]
    },
    {
      name: 'Lantern Lollipop Loop',
      theme: 'lollipops',
      chapter: 'Side Stage · Woods Secret',
      story: 'Deep past the waffle maze, a looping lantern trail circles through syrup pockets and bright lollipop arches.',
      tip: 'Side route: move lightly through the syrup loop, then use the bounce lane to jump the last curve.',
      success: 'You solved the looping lantern trail and kept your pace through the syrup pockets.',
      worldW: 2140,
      start: { x: 70, y: 392 },
      goal: { x: 1980, y: 230 },
      decor: [D(602, 250, 'lollipop_swirl', { h: 70, alpha: 0.76 }), D(1124, 218, 'candy_arch', { h: 60, alpha: 0.34 }), D(1760, 172, 'lollipop_green', { h: 72, alpha: 0.70 })],
      platforms: [
        P(0, 452, 292, 80, 'wafer'), P(324, 418, 146, 22, 'cookie'), P(520, 384, 132, 20, 'syrup'), P(700, 340, 130, 20, 'wafer'),
        B(874, 392, 80), P(960, 314, 136, 20, 'syrup'), M(1134, 286, 126, 22, 1134, 1308, 1.1), P(1320, 238, 108, 18, 'wafer'),
        P(1460, 342, 136, 20, 'syrup'), B(1644, 370, 82), P(1746, 296, 126, 20, 'wafer'), P(1928, 420, 212, 80, 'icing')
      ],
      candies: [
        C('bean_green', 162, 404), C('star_blue', 390, 384), C('bean_purple', 560, 342), C('star_pink', 738, 302),
        C('bean_orange', 892, 350), C('star_blue', 1010, 274), C('bean_red', 1184, 246), C('star_purple', 1348, 200),
        C('bean_blue', 1512, 304), C('star_pink', 1786, 250)
      ],
      specials: [],
      enemies: [E(384, 384, 'marsh', 90), E(1080, 246, 'gummy', 80), E(1542, 308, 'jaw', 70)],
      checkpoints: [{ x: 1064, y: 306, active: false }, { x: 1700, y: 268, active: false }],
      npcs: [F(210, 420, 'jelly_green', 'The lantern loop is safer if you keep a steady pace.')],
      signs: [HN(514, 352, 'Syrup slows you. Use it before the bounce.')],
      wonders: [WZ(1420, 300, 210, 120, 'The hidden loop opens into a ring of candy lanterns high above the woods.', { color: '#ff9ad1' })]
    },
    {
      name: 'Sugar Skyway Sprint',
      theme: 'sky',
      chapter: 'Side Stage · Courtyard Secret',
      story: 'A pale skyway peels away from the courtyard towers and turns into a fast secret sprint across lifts, gates, and open air.',
      tip: 'Side route: time the lifts early, read the blink gates in the middle, then sprint the last sky bridge.',
      success: 'You raced the sugar skyway and cleared the secret sprint above the courtyard roofs.',
      worldW: 2240,
      start: { x: 70, y: 392 },
      goal: { x: 2080, y: 214 },
      decor: [D(702, 244, 'candy_arch', { h: 62, alpha: 0.32 }), D(1366, 204, 'lollipop_pink', { h: 68, alpha: 0.72 }), D(1888, 166, 'candy_arch', { h: 68, alpha: 0.34 })],
      platforms: [
        P(0, 452, 290, 80, 'icing'), P(322, 418, 150, 22, 'cookie'), V(540, 360, 110, 18, 318, 366, 0.56, 'elevator'),
        P(706, 324, 126, 18, 'icing'), TG(874, 258, 82, 90, 10, 64, 86), M(974, 298, 126, 22, 974, 1148, 1.1),
        P(1176, 254, 112, 18, 'icing'), V(1328, 330, 112, 18, 278, 330, 0.62, 'elevator'), TG(1468, 238, 78, 92, 34, 64, 82),
        B(1560, 380, 82), P(1680, 304, 136, 20, 'cookie'), TG(1860, 214, 80, 96, 58, 62, 82), P(1972, 420, 268, 80, 'icing')
      ],
      candies: [
        C('bean_yellow', 162, 404), C('star_pink', 392, 382), C('bean_blue', 566, 318), C('star_blue', 730, 282),
        C('bean_red', 916, 228), C('star_purple', 1040, 262), C('bean_green', 1214, 206), C('star_blue', 1370, 278),
        C('bean_orange', 1518, 332), C('star_pink', 1728, 264), C('star_purple', 1904, 176)
      ],
      specials: [],
      enemies: [E(392, 382, 'gummy', 90), E(1220, 214, 'beetle', 80), E(1700, 268, 'jaw', 70)],
      checkpoints: [{ x: 1030, y: 280, active: false }, { x: 1730, y: 276, active: false }],
      npcs: [F(202, 420, 'jelly_pink', 'This skyway is quick. Wait for the open beat.')],
      signs: [HN(542, 336, 'Ride the lift, then do not miss the gate rhythm.')],
      wonders: [WZ(1280, 250, 220, 120, 'The skyway opens far above the courtyard, with nothing below but candy clouds.', { color: '#9de9ff' })]
    },
    {
      name: 'Morning Star Run',
      theme: 'keep',
      chapter: 'Bonus Stage',
      story: 'A hidden candy trail opens beyond the map, lit by every special star-candy you found along the way.',
      tip: 'Bonus run: choose the gentle lower route or the faster high route, then bring the Morning Star safely home.',
      success: 'You found the hidden world, crossed the bonus trail, and claimed the Morning Star Run.',
      worldW: 2180,
      start: { x: 70, y: 392 },
      goal: { x: 2040, y: 214 },
      decor: [D(604, 254, 'candy_arch', { h: 64, alpha: 0.34, tint: 'rgba(255,242,122,0.45)' }), D(1388, 190, 'lollipop_swirl', { h: 72, alpha: 0.74 }), D(1924, 160, 'candy_arch', { h: 72, alpha: 0.36, tint: 'rgba(255,242,122,0.52)' })],
      platforms: [
        P(0, 452, 300, 80, 'icing'), P(330, 406, 150, 22, 'cookie'), P(520, 368, 130, 20, 'float', { minY: 340, maxY: 386, speed: 0.5, dir: 1 }),
        P(696, 406, 180, 22, 'icing'), P(710, 294, 118, 18, 'slide', { slideDir: 0.26 }), P(872, 348, 136, 20, 'tilt'),
        M(1042, 314, 126, 22, 1042, 1218, 1.16), P(1218, 252, 102, 18, 'wafer'), P(1340, 396, 180, 22, 'syrup'),
        B(1560, 382, 84), TG(1660, 250, 86, 96, 16, 66, 84), P(1766, 214, 118, 18, 'cookie'),
        P(1888, 172, 104, 18, 'icing'), P(1980, 420, 190, 80, 'icing')
      ],
      candies: [
        C('star_blue', 160, 406), C('bean_green', 390, 370), C('star_pink', 554, 330), C('bean_blue', 768, 260), C('star_purple', 930, 306),
        C('bean_orange', 1110, 272), C('star_blue', 1266, 214), C('bean_red', 1450, 358), C('star_pink', 1596, 330), C('star_purple', 1822, 176), C('star_blue', 1998, 142)
      ],
      specials: [],
      enemies: [E(408, 372, 'gummy', 110), E(880, 312, 'beetle', 90), E(1456, 362, 'marsh', 90), E(1792, 180, 'jaw', 80)],
      checkpoints: [{ x: 1188, y: 286, active: false }, { x: 1780, y: 206, active: false }],
      npcs: [F(224, 420, 'jelly_pink', 'You opened the hidden world!'), F(1884, 194, 'jelly_blue', 'The Morning Star path leads home.')],
      signs: [HN(676, 388, 'Low route is safer. High route is faster.'), HN(1654, 226, 'Bonus gates still follow a rhythm.')],
      wonders: [WZ(688, 272, 180, 120, 'A secret sky-road opens, with two routes instead of one.', { color: '#fff27a' }), WZ(1840, 150, 180, 110, 'The Morning Star glows brighter than the rest of the candy sky.', { heart: 1, color: '#fff27a' })]
    }
  ];

  const MAIN_LEVEL_COUNT = LEVELS.length;
  const SIDE_STAGE_COUNT = BONUS_STAGES.length - 1;
  const BONUS_STAGE_INDEX = MAIN_LEVEL_COUNT + SIDE_STAGE_COUNT;
  const ALL_STAGE_COUNT = MAIN_LEVEL_COUNT + BONUS_STAGES.length;


  window.CandyQuestLevels = {
    LEVELS,
    BONUS_STAGES,
    MAIN_LEVEL_COUNT,
    SIDE_STAGE_COUNT,
    BONUS_STAGE_INDEX,
    ALL_STAGE_COUNT
  };
})();
