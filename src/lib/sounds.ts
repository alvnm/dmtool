/**
 * Soundboard del DM: efectos sintetizados con WebAudio.
 *
 * Sin archivos de audio (nada que descargar, sin licencias) y funciona
 * offline. Los efectos en bucle devuelven un handle con `stop()`; el panel
 * para todo al cerrarse o con el botón "Detener todo".
 */

export interface SoundHandle {
  stop: () => void;
}

export interface SoundDef {
  id: string;
  label: string;
  icon: string;
  /** true = suena en bucle hasta pararlo. */
  loop: boolean;
}

export const SOUND_LIBRARY: SoundDef[] = [
  { id: 'thunder', label: 'Trueno', icon: '🌩️', loop: false },
  { id: 'roar', label: 'Rugido', icon: '🐉', loop: false },
  { id: 'bell', label: 'Campana', icon: '🔔', loop: false },
  { id: 'sword', label: 'Acero', icon: '⚔️', loop: false },
  { id: 'wind', label: 'Viento', icon: '🌬️', loop: true },
  { id: 'rain', label: 'Lluvia', icon: '🌧️', loop: true },
  { id: 'fire', label: 'Fogata', icon: '🔥', loop: true },
];

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
const active = new Set<SoundHandle>();

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 2), ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

function noiseSource(ac: AudioContext): AudioBufferSourceNode {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  return src;
}

/** Envuelve un handle para poder parar todo desde fuera. */
function track(handle: SoundHandle): SoundHandle {
  active.add(handle);
  const wrapped: SoundHandle = {
    stop: () => {
      handle.stop();
      active.delete(wrapped);
    },
  };
  // Sustituye la referencia interna por la envuelta.
  active.delete(handle);
  active.add(wrapped);
  return wrapped;
}

function oneShot(stopFns: Array<() => void>, autoStopMs?: number): SoundHandle {
  let stopped = false;
  const handle: SoundHandle = {
    stop: () => {
      if (stopped) return;
      stopped = true;
      stopFns.forEach(fn => {
        try {
          fn();
        } catch {
          /* el nodo ya estaba parado */
        }
      });
    },
  };
  if (autoStopMs) setTimeout(() => handle.stop(), autoStopMs);
  return track(handle);
}

function loopHandle(nodes: { stop: () => void }[], gain: GainNode): SoundHandle {
  let stopped = false;
  return track({
    stop: () => {
      if (stopped) return;
      stopped = true;
      const now = gain.context.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(0.0001, now, 0.05);
      } catch {
        /* contexto cerrado */
      }
      setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch { /* ya parado */ } }), 250);
    },
  });
}

/** Trueno: barrido de ruido grave con retumbe. */
function thunder(ac: AudioContext): SoundHandle {
  const now = ac.currentTime;
  const src = noiseSource(ac);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400, now);
  lp.frequency.exponentialRampToValueAtTime(70, now + 2.6);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.9, now + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 3);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start(now);
  src.stop(now + 3.1);

  const sub = ac.createOscillator();
  sub.frequency.setValueAtTime(65, now);
  sub.frequency.exponentialRampToValueAtTime(35, now + 2.4);
  const subGain = ac.createGain();
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.6, now + 0.12);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
  sub.connect(subGain).connect(ac.destination);
  sub.start(now);
  sub.stop(now + 2.7);

  return oneShot([() => src.stop(), () => sub.stop()], 3200);
}

/** Rugido de bestia: sierra grave con envolvente de filtro. */
function roar(ac: AudioContext): SoundHandle {
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 1.4);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(900, now);
  lp.frequency.exponentialRampToValueAtTime(220, now + 1.4);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.5, now + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

  const src = noiseSource(ac);
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.25, now + 0.12);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

  osc.connect(lp).connect(g).connect(ac.destination);
  src.connect(lp);
  src.connect(noiseGain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 1.6);
  src.start(now);
  src.stop(now + 1.6);

  return oneShot([() => osc.stop(), () => src.stop()], 1700);
}

/** Campana: parciales sencillos con caída exponencial. */
function bell(ac: AudioContext): SoundHandle {
  const now = ac.currentTime;
  const partials: Array<[number, number, number]> = [
    [523.25, 0.5, 3.2],
    [784, 0.28, 2.4],
    [1046.5, 0.16, 1.6],
  ];
  const stops: Array<() => void> = [];
  partials.forEach(([freq, amp, dur]) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(amp, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.1);
    stops.push(() => osc.stop());
  });
  return oneShot(stops, 3400);
}

/** Choque de acero: dos golpes metálicos cortos. */
function sword(ac: AudioContext): SoundHandle {
  const now = ac.currentTime;
  const stops: Array<() => void> = [];
  [0, 0.14].forEach(offset => {
    const src = noiseSource(ac);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3400, now + offset);
    bp.Q.value = 6;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now + offset);
    g.gain.exponentialRampToValueAtTime(0.7, now + offset + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
    src.connect(bp).connect(g).connect(ac.destination);
    src.start(now + offset);
    src.stop(now + offset + 0.4);
    stops.push(() => src.stop());
  });
  return oneShot(stops, 600);
}

/** Viento: ruido filtrado con modulación lenta (bucle). */
function wind(ac: AudioContext): SoundHandle {
  const src = noiseSource(ac);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  const g = ac.createGain();
  g.gain.value = 0.0001;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoDepth = ac.createGain();
  lfoDepth.gain.value = 0.1;
  lfo.connect(lfoDepth).connect(g.gain);
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.16, ac.currentTime + 1.2);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start();
  lfo.start();
  return loopHandle([src, lfo], g);
}

/** Lluvia: ruido brillante y constante (bucle). */
function rain(ac: AudioContext): SoundHandle {
  const src = noiseSource(ac);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 900;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 7000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.14, ac.currentTime + 0.8);
  src.connect(hp).connect(lp).connect(g).connect(ac.destination);
  src.start();
  return loopHandle([src], g);
}

/** Fogata: crepitos aleatorios sobre un fondo suave (bucle). */
function fire(ac: AudioContext): SoundHandle {
  const src = noiseSource(ac);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.8);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start();

  const pops: AudioBufferSourceNode[] = [];
  const timer = window.setInterval(() => {
    if (Math.random() > 0.55) return;
    const pop = ac.createBufferSource();
    pop.buffer = noiseBuffer(ac);
    pop.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800 + Math.random() * 2200;
    bp.Q.value = 8;
    const pg = ac.createGain();
    const t = ac.currentTime;
    pg.gain.setValueAtTime(0.0001, t);
    pg.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
    pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    pop.connect(bp).connect(pg).connect(ac.destination);
    pop.start(t);
    pop.stop(t + 0.1);
    pops.push(pop);
  }, 160);

  return loopHandle(
    [
      src,
      { stop: () => { window.clearInterval(timer); pops.forEach(p => p.stop()); } },
    ],
    g
  );
}

const PLAYERS: Record<string, (ac: AudioContext) => SoundHandle> = {
  thunder,
  roar,
  bell,
  sword,
  wind,
  rain,
  fire,
};

/** Reproduce un efecto por id; devuelve el handle para pararlo. */
export function playSound(id: string): SoundHandle | null {
  const ac = audio();
  const play = PLAYERS[id];
  if (!ac || !play) return null;
  return play(ac);
}

/** Detiene todos los efectos activos (botón "Detener todo" / cierre del panel). */
export function stopAllSounds(): void {
  [...active].forEach(handle => handle.stop());
  active.clear();
}
