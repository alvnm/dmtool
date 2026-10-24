/* Compara innerText vs textContent: ¿faltan caracteres renderizados? */
import { spawn } from 'node:child_process';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9344;
const PROFILE = 'C:\\Temp\\cdp-text-profile';
const URL_ARG = process.argv[2] || 'http://127.0.0.1:3100/login';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function httpJson(path) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
  return res.json();
}

async function waitForTargets() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await httpJson('/json/list');
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch { /* arrancando */ }
    await wait(250);
  }
  throw new Error('sin endpoint de depuración');
}

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--window-size=375,812', 'about:blank',
], { stdio: 'ignore' });

const page = await waitForTargets();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
});
const send = (method, params = {}) => {
  const mid = ++id;
  ws.send(JSON.stringify({ id: mid, method, params }));
  return new Promise((resolve, reject) => pending.set(mid, { resolve, reject }));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: URL_ARG });
await wait(4000);

const expr = `(() => {
  const out = [];
  const walk = (el) => {
    const hasElementKids = [...el.children].length > 0;
    if (!hasElementKids) {
      const inner = el.innerText;
      const content = el.textContent;
      if (content && content.trim() && inner !== content) {
        const cs = getComputedStyle(el);
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 60),
          textContent: content.slice(0, 160),
          innerText: (inner ?? '(null)').slice(0, 160),
          visibility: cs.visibility, display: cs.display, opacity: cs.opacity,
          fontFamily: cs.fontFamily.slice(0, 60),
          color: cs.color,
        });
      }
    }
    for (const c of el.children) walk(c);
  };
  walk(document.body);
  // Cabeceras principales con sus estilos
  const heads = [...document.querySelectorAll('h1,h2,p,label,button')].slice(0, 6).map(el => {
    const cs = getComputedStyle(el);
    return { tag: el.tagName.toLowerCase(), text: (el.textContent || '').slice(0, 80), font: cs.fontFamily.slice(0, 50), size: cs.fontSize };
  });
  const bodyInner = document.body.innerText;
  const target = [...document.querySelectorAll('p')].find(p => (p.textContent||'').includes('Dungeon Masters'));
  return {
    mismatches: out,
    heads,
    bodyInnerSnippet: bodyInner.replace(/\\s+/g,' ').slice(0, 140),
    bodyHasFull: bodyInner.includes('Masters: inicia sesión'),
    target: target ? {
      textContent: target.textContent,
      innerText: target.innerText,
      childNodes: target.childNodes.length,
      kids: [...target.children].map(c => ({tag: c.tagName, cls: c.className, inner: c.innerText, vis: getComputedStyle(c).visibility, disp: getComputedStyle(c).display})),
      offsetParent: target.offsetParent ? target.offsetParent.tagName + '.' + target.offsetParent.className : null,
    } : null,
    fontsStatus: document.fonts.status,
    loadedFonts: [...document.fonts].map(f => f.family + ':' + f.status).slice(0, 8),
  };
})()`;

const { result } = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(JSON.stringify(result.value, null, 2));

ws.close();
chrome.kill();
process.exit(0);
