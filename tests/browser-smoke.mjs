import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const timeoutMs = 15000;

const viewports = [
  { name: 'phone portrait', width: 390, height: 844, mobile: true },
  { name: 'phone landscape', width: 844, height: 390, mobile: true },
  { name: 'tablet portrait', width: 768, height: 1024, mobile: true },
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

async function waitForCondition(cdp, sessionId, expression, message) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, sessionId, expression)) return;
    await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
  }
  throw new Error(message);
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
