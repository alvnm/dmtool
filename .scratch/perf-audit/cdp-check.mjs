/* Auditoría móvil + consola vía Chrome DevTools Protocol (sin dependencias).
   Uso: node cdp-check.mjs <url1> <url2> ...
   Env: WIDTH=375 TABS=8  (TABS = nº de pestañas de la app a recorrer)
        COOKIES=<fichero Netscape>  (inyecta sesión autenticada) */
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const PROFILE = process.env.CDP_PROFILE ?? 'C:\\Temp\\cdp-audit-profile';
const WIDTH = Number(process.env.WIDTH ?? 375);
const TABS = Number(process.env.TABS ?? 0);

const measureExpr = `(() => {
  const de = document.documentElement;
  const vw = window.innerWidth;
  const cw = de.clientWidth; // ancho visible real (sin scrollbar)
  const inScroller = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ov = getComputedStyle(p).overflowX;
      if (ov === 'auto' || ov === 'scroll') return true;
    }
    return false;
  };
  const overflowing = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > cw + 1 || r.left < -1) {
      if (inScroller(el)) continue; // dentro de un contenedor con scroll propio
      overflowing.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 70),
        left: Math.round(r.left),
        right: Math.round(r.right),
        txt: (el.innerText || '').replace(/\\s+/g, ' ').slice(0, 60),
      });
    }
    if (overflowing.length >= 8) break;
  }
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paints = Object.fromEntries(performance.getEntriesByType('paint').map(p => [p.name, Math.round(p.startTime)]));
  const res = performance.getEntriesByType('resource');
  const byType = {};
  let transfer = 0;
  for (const r of res) {
    const ext = (r.name.split('?')[0].split('.').pop() || '').toLowerCase();
    const k = ['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'json', 'woff2'].includes(ext) ? ext : 'other';
    byType[k] = (byType[k] || 0) + (r.encodedBodySize || 0);
    transfer += r.encodedBodySize || 0;
  }
  const main = document.querySelector('main');
  const top = res
    .map(r => ({
      url: decodeURIComponent(r.name.split('/').slice(-1)[0]).slice(0, 64),
      kb: Math.round((r.encodedBodySize || 0) / 1024),
      ms: Math.round(r.duration),
    }))
    .sort((a, b) => b.kb - a.kb)
    .slice(0, 8);
  return {
    title: document.title,
    scrollW: de.scrollWidth,
    clientW: cw,
    pageScrollsHorizontally: de.scrollWidth > cw + 1,
    innerW: vw,
    overflowing,
    dcl: Math.round(nav.domContentLoadedEventEnd || 0),
    loadEvt: Math.round(nav.loadEventEnd || 0),
    fcp: paints['first-contentful-paint'] ?? null,
    resources: res.length,
    transferKB: Math.round(transfer / 1024),
    transferByType: byType,
    topResources: top,
    mainChars: main ? (main.innerText || '').length : 0,
    // Ojo: dentro de este template literal hay que usar \\s, si no JS evalúa
    // \s como "s" y la regex borra todas las letras s del texto medido.
    text: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 120),
  };
})()`;

/** Clica la pestaña i-ésima de la barra de navegación móvil y devuelve su etiqueta. */
const clickTabExpr = (i) => `(() => {
  const bar = document.querySelector('[class*="touch-pan-x"]') || document.querySelector('nav');
  const btns = bar ? Array.from(bar.querySelectorAll('button')) : [];
  const b = btns[${i}];
  if (!b) return { clicked: false, index: ${i} };
  b.click();
  return { clicked: true, index: ${i}, label: (b.innerText || '').trim() };
})()`;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function httpJson(path) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
  return res.json();
}

async function waitForTargets() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await httpJson('/json/list');
      const page = list.find(t => t.type === 'page');
      if (page) return page;
    } catch { /* aún arrancando */ }
    await wait(250);
  }
  throw new Error('Chrome no expuso el endpoint de depuración.');
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  consoleIssues() {
    const issues = [];
    for (const e of this.events) {
      if (e.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(e.params.type)) {
        const text = (e.params.args || []).map(a => a.value ?? a.description ?? a.unserializableValue ?? '').join(' ');
        issues.push(`console.${e.params.type}: ${text.slice(0, 200)}`);
      } else if (e.method === 'Runtime.exceptionThrown') {
        const d = e.params.exceptionDetails;
        issues.push(`excepción: ${d.text} ${d.exception?.description?.slice(0, 200) ?? ''}`);
      } else if (e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level)) {
        const en = e.params.entry;
        issues.push(`log.${en.level}: ${String(en.text).slice(0, 160)}${en.url ? ' -> ' + en.url : ''}`);
      } else if (e.method === 'Network.responseReceived' && e.params.response.status >= 400) {
        issues.push(`http ${e.params.response.status}: ${e.params.response.url}`);
      }
    }
    return issues;
  }
}

async function measure(cdp) {
  const { result } = await cdp.send('Runtime.evaluate', { expression: measureExpr, returnByValue: true });
  return result.value;
}

async function main() {
  const urls = process.argv.slice(2);
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `--window-size=${WIDTH},812`,
    'about:blank',
  ], { stdio: 'ignore' });

  const page = await waitForTargets();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const cdp = new Cdp(ws);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 812, deviceScaleFactor: 2, mobile: true });

  // Sesión autenticada: volcado del cookiejar de curl (formato Netscape).
  if (process.env.COOKIES) {
    const jar = await readFile(process.env.COOKIES, 'utf8');
    for (const rawLine of jar.split('\n')) {
      const line = rawLine.replace(/\r$/, ''); // cookiejar con CRLF en Windows
      if (!line.trim()) continue;
      // curl marca las httpOnly con el prefijo #HttpOnly_ antes del dominio.
      const cleaned = line.startsWith('#HttpOnly_') ? line.slice('#HttpOnly_'.length) : line;
      if (cleaned.startsWith('#')) continue;
      const parts = cleaned.split('\t');
      if (parts.length < 7) continue;
      const [domain, , path, secure, , name, ...valueParts] = parts;
      const base = urls[0].replace(/\/[^/]*$/, '/');
      await cdp.send('Network.setCookie', {
        name,
        value: valueParts.join('\t'),
        domain: domain.replace(/^\./, ''),
        url: base,
        path: path || '/',
        // secure solo si la URL auditada es https (sobre http se rechaza).
        secure: secure === 'TRUE' && base.startsWith('https:'),
        httpOnly: true,
      }).catch((e) => console.error(`[cookie ${name}] ${e.message}`));
    }
    console.error(`[cookies] ${process.env.COOKIES} inyectado`);
  }

  for (const url of urls) {
    try {
      cdp.events.length = 0;
      await cdp.send('Page.navigate', { url });
      await wait(4000); // load + hidratación + carga inicial de datos
      const first = await measure(cdp);
      console.log(JSON.stringify({ url, width: WIDTH, ...first, issues: cdp.consoleIssues() }, null, 2));

      if (TABS > 0) {
        for (let i = 0; i < TABS; i++) {
          const { result } = await cdp.send('Runtime.evaluate', { expression: clickTabExpr(i), returnByValue: true });
          if (!result.value.clicked) break;
          await wait(1800); // dynamic import + render de la pestaña
          const m = await measure(cdp);
          console.log(JSON.stringify({
            tab: result.value.label,
            scrollW: m.scrollW,
            clientW: m.clientW,
            scrollsHorizontally: m.pageScrollsHorizontally,
            mainChars: m.mainChars,
            overflow: m.overflowing,
            issues: cdp.consoleIssues(),
          }));
        }
      }
    } catch (err) {
      console.log(JSON.stringify({ url, error: String(err) }));
    }
    console.log('----');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });