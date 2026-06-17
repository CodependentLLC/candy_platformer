import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const timeoutMs = 15000;

const viewports = [
  { name: 'phone portrait 375x667', width: 375, height: 667, mobile: true },
  { name: 'phone portrait 390x844', width: 390, height: 844, mobile: true },
  { name: 'phone landscape 667x375', width: 667, height: 375, mobile: true },
  { name: 'phone landscape 844x390', width: 844, height: 390, mobile: true },
  { name: 'tablet portrait', width: 768, height: 1024, mobile: true },
  { name: 'tablet landscape', width: 1024, height: 768, mobile: true },
  { name: 'desktop', width: 1366, height: 768, mobile: false }
];

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findBrowserBin() {
  const candidates = [
    process.env.BROWSER_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  return candidates.find(candidate => existsSync(candidate));
}

function startStaticServer() {
  const server = createServer((req, res) => {
    try {
      const rawPath = new URL(req.url || '/', 'http://127.0.0.1').pathname;
      const requestPath = decodeURIComponent(rawPath === '/' ? '/index.html' : rawPath);
      const filePath = resolve(root, `.${requestPath}`);
      if (filePath !== root && !filePath.startsWith(root + sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
      createReadStream(filePath).pipe(res);
    } catch (error) {
      res.writeHead(500);
      res.end(error.message);
    }
  });
  return new Promise(resolveServer => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveServer({ server, url: `http://127.0.0.1:${port}/index.html` });
    });
  });
}

function waitForDevToolsUrl(browser) {
  return new Promise((resolveUrl, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for browser DevTools endpoint.')), timeoutMs);
    browser.stderr.setEncoding('utf8');
    browser.stderr.on('data', chunk => {
      const match = chunk.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolveUrl(match[1]);
      }
    });
    browser.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Browser exited before smoke test could run. Exit code: ${code}`));
    });
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener('message', event => this.handleMessage(event));
  }

  open() {
    return new Promise((resolveOpen, reject) => {
      this.ws.addEventListener('open', resolveOpen, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}, sessionId = null) {
    const id = this.nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    this.ws.send(JSON.stringify(message));
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject });
    });
  }

  on(method, handler) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(handler);
  }

  waitFor(method, predicate = () => true) {
    return new Promise(resolveEvent => {
      const handler = message => {
        if (!predicate(message)) return;
        resolveEvent(message);
      };
      this.on(method, handler);
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result || {});
      return;
    }
    const handlers = this.handlers.get(message.method) || [];
    for (const handler of handlers) handler(message);
  }

  close() {
    this.ws.close();
  }
}

async function withTimeout(promise, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function evaluate(cdp, sessionId, expression) {
  const { result } = await cdp.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression
  }, sessionId);
  if (result.subtype === 'error') throw new Error(result.description || 'Runtime evaluation failed.');
  return result.value;
}

async function click(cdp, sessionId, selector) {
  return evaluate(cdp, sessionId, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return { ok: false, reason: 'missing' };
    if (element.disabled) return { ok: false, reason: 'disabled' };
    element.click();
    return { ok: true };
  })()`);
}

async function holdKey(cdp, sessionId, code, durationMs = 120) {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: code, autoRepeat: false }, sessionId);
  await new Promise(resolveDelay => setTimeout(resolveDelay, durationMs));
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: code }, sessionId);
}

async function waitForCondition(cdp, sessionId, expression, message) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, sessionId, expression)) return;
    await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
  }
  throw new Error(message);
}

async function assertMenuLayout(cdp, sessionId, viewportName, stepName) {
  const layout = await evaluate(cdp, sessionId, `(() => {
    const overlay = document.querySelector('#menuOverlay');
    const card = document.querySelector('.menu-card');
    const activeView = ['#menuHeroView', '#menuActionView', '#menuWorldView']
      .map(selector => document.querySelector(selector))
      .find(view => view && !view.hidden);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tolerance = 2;
    const rectOf = element => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
    };
    const cardRect = card ? rectOf(card) : null;
    const activeButtons = activeView
      ? [...activeView.querySelectorAll('button')].filter(button => {
          const style = getComputedStyle(button);
          const rect = button.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })
      : [];
    const clippedButtons = activeButtons
      .map(button => ({ id: button.id || button.textContent.trim(), rect: rectOf(button) }))
      .filter(({ rect }) => (
        rect.left < -tolerance ||
        rect.top < -tolerance ||
        rect.right > viewportWidth + tolerance ||
        rect.bottom > viewportHeight + tolerance
      ));
    const scrollNeeded = !!card && card.scrollHeight > card.clientHeight + 2;
    const centered = !!cardRect && (
      Math.abs((cardRect.left + cardRect.width / 2) - viewportWidth / 2) <= Math.max(28, viewportWidth * 0.08) &&
      (scrollNeeded || Math.abs((cardRect.top + cardRect.height / 2) - viewportHeight / 2) <= Math.max(28, viewportHeight * 0.08))
    );
    return {
      overlayVisible: !!overlay && !overlay.hidden && getComputedStyle(overlay).display !== 'none',
      activeViewId: activeView?.id || '',
      cardRect,
      cardWithinViewport: !!cardRect &&
        cardRect.left >= -tolerance &&
        cardRect.top >= -tolerance &&
        cardRect.right <= viewportWidth + tolerance &&
        cardRect.bottom <= viewportHeight + tolerance,
      clippedButtons,
      scrollNeeded,
      centered
    };
  })()`);
  assert(layout.overlayVisible, `${stepName} menu overlay is not visible at ${viewportName}.`);
  assert(layout.activeViewId, `${stepName} has no active menu view at ${viewportName}.`);
  assert(layout.cardWithinViewport, `${stepName} menu card is clipped at ${viewportName}: ${JSON.stringify(layout.cardRect)}`);
  assert(layout.clippedButtons.length === 0, `${stepName} has clipped buttons at ${viewportName}: ${layout.clippedButtons.map(button => button.id).join(', ')}`);
  assert(layout.centered, `${stepName} menu card is not centered/readable at ${viewportName}: ${JSON.stringify(layout.cardRect)}`);
}

async function navigateToGame(cdp, sessionId, url, message) {
  const loaded = cdp.waitFor('Page.loadEventFired', pageMessage => pageMessage.sessionId === sessionId);
  await cdp.send('Page.navigate', { url }, sessionId);
  await withTimeout(loaded, message);
  await new Promise(resolveDelay => setTimeout(resolveDelay, 750));
}

async function reloadGame(cdp, sessionId, message) {
  const loaded = cdp.waitFor('Page.loadEventFired', pageMessage => pageMessage.sessionId === sessionId);
  await cdp.send('Page.reload', {}, sessionId);
  await withTimeout(loaded, message);
  await new Promise(resolveDelay => setTimeout(resolveDelay, 750));
}

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise(resolveExit => {
    const timer = setTimeout(resolveExit, 2000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolveExit();
    });
  });
}

async function openWorldOneMap(cdp, sessionId) {
  let action = await click(cdp, sessionId, '#menuButton');
  if (!action.ok) {
    action = await click(cdp, sessionId, '#menuBoyButton');
    assert(action.ok, `Could not choose hero before opening World Select: ${action.reason || 'unknown'}`);
  }
  action = await click(cdp, sessionId, '#menuBoyButton');
  if (!action.ok) {
    const inActionMenu = await evaluate(cdp, sessionId, `(() => {
      const actionView = document.querySelector('#menuActionView');
      return !!actionView && !actionView.hidden;
    })()`);
    assert(inActionMenu, `Could not reach action menu before opening World Select: ${action.reason || 'unknown'}`);
  }
  action = await click(cdp, sessionId, '#mapButton');
  assert(action.ok, `Could not click World Select: ${action.reason || 'unknown'}`);
  await waitForCondition(
    cdp,
    sessionId,
    `(() => {
      const worldView = document.querySelector('#menuWorldView');
      const worldOne = document.querySelector('#worldOneButton');
      return !!worldView && !worldView.hidden && !!worldOne && !worldOne.disabled;
    })()`,
    'World Select did not open with a playable World 1 card.'
  );
  action = await click(cdp, sessionId, '#worldOneButton');
  assert(action.ok, `Could not open World 1 map: ${action.reason || 'unknown'}`);
  await waitForCondition(
    cdp,
    sessionId,
    `(() => document.querySelector('.game-wrap')?.classList.contains('map-mode'))()`,
    'World 1 map did not open.'
  );
}

async function runWorldMapNavigationSmoke(cdp, sessionId, url) {
  await navigateToGame(cdp, sessionId, url, 'Timed out waiting for map navigation smoke page load.');

  await evaluate(cdp, sessionId, `(() => {
    localStorage.setItem('candy-platformer-selected-hero', 'boy');
    localStorage.setItem('candy-platformer-unlocked-level', '5');
    localStorage.setItem('candy-platformer-special-progress', JSON.stringify([
      [false, false, false],
      [true, true, true],
      [true, true, true],
      [true, true, true],
      [false, false, false],
      [false, false, false]
    ]));
    localStorage.setItem('candy-platformer-reward-progress', JSON.stringify([false, false, false, false, false, false]));
    localStorage.removeItem('candy-platformer-save-v1');
  })()`);

  await reloadGame(cdp, sessionId, 'Timed out waiting for seeded map navigation smoke reload.');

  await openWorldOneMap(cdp, sessionId);

  const expectedRouteWithUnlockedOptionalBranches = [
    { label: 'Meadow', stageName: 'Lollipop Meadow' },
    { label: 'Grove', stageName: 'Gummy Grove' },
    { label: 'Pretzel', stageName: 'Pretzel Path' },
    { label: 'Jungle', stageName: 'Jungle Jelly Run' },
    { label: 'Drift', stageName: 'Marshmallow Driftway' },
    { label: 'Falls', stageName: 'Ice Cream Falls' },
    { label: 'Woods', stageName: 'Waffle Woods' },
    { label: 'Loop', stageName: 'Lantern Lollipop Loop' },
    { label: 'Cake', stageName: 'Cake Courtyard' },
    { label: 'Skyway', stageName: 'Sugar Skyway Sprint' },
    { label: 'Gate', stageName: 'Kingdom Gate' }
  ];
  const visited = [];

  for (let routeIndex = 0; routeIndex < expectedRouteWithUnlockedOptionalBranches.length; routeIndex += 1) {
    if (routeIndex > 0) {
      await holdKey(cdp, sessionId, 'ArrowRight', 40);
      await new Promise(resolveDelay => setTimeout(resolveDelay, 650));
    }

    await holdKey(cdp, sessionId, 'Enter', 80);
    await waitForCondition(
      cdp,
      sessionId,
      `(() => document.querySelector('.game-wrap')?.classList.contains('play-mode'))()`,
      `Selecting ${expectedRouteWithUnlockedOptionalBranches[routeIndex].label} did not start gameplay.`
    );
    const stageName = await evaluate(cdp, sessionId, `document.querySelector('#hudLevelName')?.textContent || ''`);
    assert(
      stageName === expectedRouteWithUnlockedOptionalBranches[routeIndex].stageName,
      `Expected ${expectedRouteWithUnlockedOptionalBranches[routeIndex].label} to load "${expectedRouteWithUnlockedOptionalBranches[routeIndex].stageName}", got "${stageName}".`
    );
    visited.push(expectedRouteWithUnlockedOptionalBranches[routeIndex].label);

    if (routeIndex < expectedRouteWithUnlockedOptionalBranches.length - 1) {
      await openWorldOneMap(cdp, sessionId);
    }
  }

  assert(
    visited.join(', ') === expectedRouteWithUnlockedOptionalBranches.map(node => node.label).join(', '),
    `World 1 optional route-positioned map navigation order mismatch: ${visited.join(' -> ')}`
  );
}

async function runPersistenceSmoke(cdp, sessionId, url) {
  const storageBlock = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new Error('localStorage unavailable for smoke test'); }
      });
    `
  }, sessionId);
  await navigateToGame(cdp, sessionId, url, 'Timed out waiting for no-localStorage smoke load.');
  const noStorageBoot = await evaluate(cdp, sessionId, `(() => {
    const overlay = document.querySelector('#menuOverlay');
    const heroView = document.querySelector('#menuHeroView');
    return {
      menuLoaded: !!overlay && !overlay.hidden,
      heroSelectVisible: !!heroView && !heroView.hidden,
      playMode: document.querySelector('.game-wrap')?.classList.contains('play-mode') || false
    };
  })()`);
  assert(noStorageBoot.menuLoaded && noStorageBoot.heroSelectVisible, 'Game did not boot safely when localStorage was unavailable.');
  assert(!noStorageBoot.playMode, 'Game should not auto-start when localStorage is unavailable.');
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: storageBlock.identifier }, sessionId);

  await navigateToGame(cdp, sessionId, url, 'Timed out waiting for corrupt-save smoke load.');
  await evaluate(cdp, sessionId, `(() => {
    localStorage.clear();
    localStorage.setItem('candy-platformer-unlocked-level', '999');
    localStorage.setItem('candy-platformer-selected-hero', 'dragon');
    localStorage.setItem('candy-platformer-special-progress', '{bad json');
    localStorage.setItem('candy-platformer-reward-progress', JSON.stringify([true]));
    localStorage.setItem('candy-platformer-medal-progress', JSON.stringify([{ swift: true }, null, 'bad row']));
    localStorage.setItem('candy-platformer-options', '{bad json');
  })()`);
  await reloadGame(cdp, sessionId, 'Timed out waiting for corrupt-save smoke reload.');
  const corruptSaveState = await evaluate(cdp, sessionId, `(() => ({
    menuLoaded: !!document.querySelector('#menuOverlay') && !document.querySelector('#menuOverlay').hidden,
    selectedHero: document.querySelector('#menuSelectedHeroText')?.textContent || '',
    girlActive: document.querySelector('#menuGirlButton')?.classList.contains('active') || false,
    boyActive: document.querySelector('#menuBoyButton')?.classList.contains('active') || false
  }))()`);
  assert(corruptSaveState.menuLoaded, 'Game did not boot with corrupt localStorage values.');
  assert(corruptSaveState.boyActive && !corruptSaveState.girlActive, 'Corrupt hero save should fall back to Boy.');

  await evaluate(cdp, sessionId, `(() => {
    localStorage.clear();
    localStorage.setItem('candy-platformer-unlocked-level', '2');
    localStorage.setItem('candy-platformer-selected-hero', 'girl');
    localStorage.setItem('candy-platformer-special-progress', JSON.stringify([[true], [true, true, true]]));
    localStorage.setItem('candy-platformer-reward-progress', JSON.stringify([true]));
    localStorage.setItem('candy-platformer-medal-progress', JSON.stringify([{ swift: true }, null, { specialist: true }]));
  })()`);
  await reloadGame(cdp, sessionId, 'Timed out waiting for partial-save smoke reload.');
  const partialSaveState = await evaluate(cdp, sessionId, `(() => ({
    girlActive: document.querySelector('#menuGirlButton')?.classList.contains('active') || false,
    selectedHeroText: document.querySelector('#menuSelectedHeroText')?.textContent || ''
  }))()`);
  assert(partialSaveState.girlActive && partialSaveState.selectedHeroText.includes('Girl'), 'Hero selection did not persist from a partial save.');

  await openWorldOneMap(cdp, sessionId);
  await holdKey(cdp, sessionId, 'ArrowRight', 40);
  await new Promise(resolveDelay => setTimeout(resolveDelay, 650));
  await holdKey(cdp, sessionId, 'ArrowRight', 40);
  await new Promise(resolveDelay => setTimeout(resolveDelay, 650));
  await holdKey(cdp, sessionId, 'Enter', 80);
  await waitForCondition(
    cdp,
    sessionId,
    `(() => document.querySelector('.game-wrap')?.classList.contains('play-mode'))()`,
    'Partial save did not allow map stage selection after refresh.'
  );
  const partialStage = await evaluate(cdp, sessionId, `document.querySelector('#hudLevelName')?.textContent || ''`);
  assert(partialStage === 'Pretzel Path', `Expected partial old numeric save to load Pretzel Path after refresh, got "${partialStage}".`);

  await reloadGame(cdp, sessionId, 'Timed out waiting for refresh-during-level smoke reload.');
  const refreshedDuringLevel = await evaluate(cdp, sessionId, `(() => ({
    menuLoaded: !!document.querySelector('#menuOverlay') && !document.querySelector('#menuOverlay').hidden,
    heroSelectVisible: !!document.querySelector('#menuHeroView') && !document.querySelector('#menuHeroView').hidden
  }))()`);
  assert(refreshedDuringLevel.menuLoaded && refreshedDuringLevel.heroSelectVisible, 'Refresh during level did not return to a safe hero menu.');

  await openWorldOneMap(cdp, sessionId);
  await reloadGame(cdp, sessionId, 'Timed out waiting for refresh-during-map smoke reload.');
  const refreshedDuringMap = await evaluate(cdp, sessionId, `(() => ({
    menuLoaded: !!document.querySelector('#menuOverlay') && !document.querySelector('#menuOverlay').hidden,
    heroSelectVisible: !!document.querySelector('#menuHeroView') && !document.querySelector('#menuHeroView').hidden
  }))()`);
  assert(refreshedDuringMap.menuLoaded && refreshedDuringMap.heroSelectVisible, 'Refresh during map did not return to a safe hero menu.');

  let action = await click(cdp, sessionId, '#menuGirlButton');
  assert(action.ok, `Could not reopen action menu before reset: ${action.reason || 'unknown'}`);
  action = await click(cdp, sessionId, '#resetProgressButton');
  assert(action.ok, `Could not click Reset Progress: ${action.reason || 'unknown'}`);
  await new Promise(resolveDelay => setTimeout(resolveDelay, 300));
  const resetState = await evaluate(cdp, sessionId, `(() => ({
    unlocked: localStorage.getItem('candy-platformer-unlocked-level'),
    specials: localStorage.getItem('candy-platformer-special-progress'),
    rewards: localStorage.getItem('candy-platformer-reward-progress'),
    medals: localStorage.getItem('candy-platformer-medal-progress'),
    versioned: localStorage.getItem('candy-platformer-save-v1'),
    hero: localStorage.getItem('candy-platformer-selected-hero'),
    menuLoaded: !!document.querySelector('#menuOverlay') && !document.querySelector('#menuOverlay').hidden
  }))()`);
  assert(resetState.menuLoaded, 'Reset Progress did not return to menu.');
  assert(resetState.unlocked === null && resetState.specials === null && resetState.rewards === null && resetState.medals === null && resetState.versioned === null, 'Reset Progress did not clear all progress keys.');
  assert(resetState.hero === 'girl', 'Reset Progress should not clear selected hero preference.');

  for (const branchCase of [
    { saveLevel: '1', steps: 1, expected: 'Gummy Grove', label: 'Grove' },
    { saveLevel: '2', steps: 3, expected: 'Jungle Jelly Run', label: 'Jungle' }
  ]) {
    await evaluate(cdp, sessionId, `(() => {
      localStorage.clear();
      localStorage.setItem('candy-platformer-selected-hero', 'boy');
      localStorage.setItem('candy-platformer-unlocked-level', ${JSON.stringify(branchCase.saveLevel)});
      localStorage.setItem('candy-platformer-special-progress', JSON.stringify([
        [false, false, false],
        [false, false, false],
        [false, false, false],
        [false, false, false],
        [false, false, false],
        [false, false, false]
      ]));
    })()`);
    await reloadGame(cdp, sessionId, `Timed out waiting for ${branchCase.label} branch-main refresh smoke reload.`);
    await openWorldOneMap(cdp, sessionId);
    for (let step = 0; step < branchCase.steps; step += 1) {
      await holdKey(cdp, sessionId, 'ArrowRight', 40);
      await new Promise(resolveDelay => setTimeout(resolveDelay, 650));
    }
    await holdKey(cdp, sessionId, 'Enter', 80);
    await waitForCondition(
      cdp,
      sessionId,
      `(() => document.querySelector('.game-wrap')?.classList.contains('play-mode'))()`,
      `${branchCase.label} branch-main node did not start gameplay after refresh.`
    );
    const stageName = await evaluate(cdp, sessionId, `document.querySelector('#hudLevelName')?.textContent || ''`);
    assert(stageName === branchCase.expected, `Expected refreshed ${branchCase.label} save to load "${branchCase.expected}", got "${stageName}".`);
  }
}

async function run() {
  assert(typeof WebSocket === 'function', 'Node must provide global WebSocket support for this dependency-free smoke test.');

  const browserBin = findBrowserBin();
  assert(browserBin, 'No Chromium-family browser found. Set BROWSER_BIN to a Chrome, Chromium, Edge, or Brave executable.');

  const { server, url } = await startStaticServer();
  const userDataDir = mkdtempSync(join(tmpdir(), 'candy-quest-smoke-'));
  const browser = spawn(browserBin, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  try {
    const devToolsUrl = await waitForDevToolsUrl(browser);
    const cdp = new CdpClient(devToolsUrl);
    await cdp.open();

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const pageErrors = [];
    const consoleErrors = [];

    cdp.on('Runtime.exceptionThrown', message => {
      if (message.sessionId !== sessionId) return;
      const details = message.params.exceptionDetails;
      pageErrors.push(details.exception?.description || details.text || 'Uncaught page error');
    });

    cdp.on('Runtime.consoleAPICalled', message => {
      if (message.sessionId !== sessionId || message.params.type !== 'error') return;
      const args = message.params.args || [];
      consoleErrors.push(args.map(arg => arg.value || arg.description || arg.type).join(' '));
    });

    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Page.enable', {}, sessionId);

    await runPersistenceSmoke(cdp, sessionId, url);

    for (const viewport of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.mobile ? 2 : 1,
        mobile: viewport.mobile
      }, sessionId);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile }, sessionId);

      const loaded = cdp.waitFor('Page.loadEventFired', message => message.sessionId === sessionId);
      await cdp.send('Page.navigate', { url }, sessionId);
      await withTimeout(loaded, `Timed out waiting for index.html to load at ${viewport.name}.`);
      await new Promise(resolveDelay => setTimeout(resolveDelay, 750));

      const boot = await evaluate(cdp, sessionId, `(() => {
        const checks = [
          ['#gameCanvas', !!document.querySelector('#gameCanvas')],
          ['#menuOverlay', !!document.querySelector('#menuOverlay')],
          ['#menuHeroView', !!document.querySelector('#menuHeroView')],
          ['#menuBoyButton', !!document.querySelector('#menuBoyButton')],
          ['#menuGirlButton', !!document.querySelector('#menuGirlButton')],
          ['#menuActionView', !!document.querySelector('#menuActionView')],
          ['#mapButton', !!document.querySelector('#mapButton')],
          ['#menuWorldView', !!document.querySelector('#menuWorldView')],
          ['#worldOneButton', !!document.querySelector('#worldOneButton')],
          ['#startButton', !!document.querySelector('#startButton')],
          ['touch controls', document.querySelectorAll('.touch-controls button').length >= 3]
        ];
        const overlay = document.querySelector('#menuOverlay');
        const heroView = document.querySelector('#menuHeroView');
        return {
          href: location.href,
          readyState: document.readyState,
          menuLoaded: overlay && !overlay.hidden,
          heroSelectVisible: heroView && !heroView.hidden,
          missing: checks.filter(([, ok]) => !ok).map(([name]) => name)
        };
      })()`);

      assert(boot.href.startsWith('http://127.0.0.1:'), `Expected local server URL at ${viewport.name}, got ${boot.href}`);
      assert(boot.readyState === 'complete', `Expected document readyState complete at ${viewport.name}, got ${boot.readyState}`);
      assert(boot.missing.length === 0, `Missing expected elements at ${viewport.name}: ${boot.missing.join(', ')}`);
      assert(boot.menuLoaded, `Menu overlay did not load at ${viewport.name}.`);
      assert(boot.heroSelectVisible, `Hero select was not visible at ${viewport.name}.`);
      await assertMenuLayout(cdp, sessionId, viewport.name, 'Hero select');

      let action = await click(cdp, sessionId, '#menuBoyButton');
      assert(action.ok, `Could not click Boy hero at ${viewport.name}: ${action.reason || 'unknown'}`);
      await waitForCondition(
        cdp,
        sessionId,
        `(() => {
          const actionView = document.querySelector('#menuActionView');
          return !!actionView && !actionView.hidden;
        })()`,
        `Action menu did not open at ${viewport.name}.`
      );
      await assertMenuLayout(cdp, sessionId, viewport.name, 'Action menu');

      action = await click(cdp, sessionId, '#mapButton');
      assert(action.ok, `Could not click World Select at ${viewport.name}: ${action.reason || 'unknown'}`);
      await waitForCondition(
        cdp,
        sessionId,
        `(() => {
          const worldView = document.querySelector('#menuWorldView');
          const worldOne = document.querySelector('#worldOneButton');
          return !!worldView && !worldView.hidden && !!worldOne && !worldOne.disabled;
        })()`,
        `World Select did not open with a playable World 1 card at ${viewport.name}.`
      );
      await assertMenuLayout(cdp, sessionId, viewport.name, 'World Select');

      action = await click(cdp, sessionId, '#backToActionsButton');
      assert(action.ok, `Could not click World Select back button at ${viewport.name}: ${action.reason || 'unknown'}`);
      await waitForCondition(
        cdp,
        sessionId,
        `(() => {
          const actionView = document.querySelector('#menuActionView');
          return !!actionView && !actionView.hidden;
        })()`,
        `Action menu did not reopen from World Select at ${viewport.name}.`
      );

      action = await click(cdp, sessionId, '#startButton');
      assert(action.ok, `Could not click Start Adventure at ${viewport.name}: ${action.reason || 'unknown'}`);
      await waitForCondition(
        cdp,
        sessionId,
        `(() => document.querySelector('.game-wrap')?.classList.contains('play-mode'))()`,
        `Gameplay did not start at ${viewport.name}.`
      );

      const gameplay = await evaluate(cdp, sessionId, `(() => {
        const controls = [...document.querySelectorAll('.touch-controls button')];
        const visibleControls = controls.filter(button => {
          const style = getComputedStyle(button);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        const overlay = document.querySelector('#menuOverlay');
        return {
          touchButtonCount: controls.length,
          visibleTouchButtonCount: visibleControls.length,
          menuHidden: !!overlay && overlay.hidden,
          playMode: document.querySelector('.game-wrap')?.classList.contains('play-mode') || false
        };
      })()`);
      assert(gameplay.playMode, `Game wrapper is not in play mode at ${viewport.name}.`);
      assert(gameplay.menuHidden, `Menu overlay is still visible during gameplay at ${viewport.name}.`);
      assert(gameplay.touchButtonCount >= 3, `Expected touch controls in gameplay at ${viewport.name}.`);
      if (viewport.mobile) {
        assert(gameplay.visibleTouchButtonCount >= 3, `Expected visible touch controls on mobile gameplay at ${viewport.name}.`);
      }
    }

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false }, sessionId);
    await runWorldMapNavigationSmoke(cdp, sessionId, url);

    assert(pageErrors.length === 0, `Uncaught page errors during boot:\n${pageErrors.join('\n')}`);
    assert(consoleErrors.length === 0, `Console errors during smoke:\n${consoleErrors.join('\n')}`);

    cdp.close();
    console.log(`Browser smoke passed for ${viewports.map(viewport => viewport.name).join(', ')}.`);
  } finally {
    browser.kill();
    await waitForExit(browser);
    server.close();
    rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

run().catch(error => {
  console.error(error.message);
  process.exit(1);
});
