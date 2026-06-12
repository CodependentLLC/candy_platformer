(() => {
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


  window.CandyQuestShapes = { P, B, M, R, V, G, TG, E, C, S, D, F, HN, WZ };
})();
