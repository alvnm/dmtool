/**
 * Limitador de tasa en memoria (sliding window).
 *
 * Sirve para un único proceso (dev / instancia única). En despliegues con
 * varias instancias, sustituir el almacenamiento por Redis/Upstash manteniendo
 * la misma interfaz `consume()`.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  /** Intentos restantes en la ventana actual. */
  remaining: number;
  /** Segundos hasta poder volver a intentar (0 si está permitido). */
  retryAfter: number;
};

const now = () => Date.now();

function prune(bucket: Bucket, windowMs: number) {
  const cutoff = now() - windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);
}

/** Registra un intento y decide si se permite. */
export function consume(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const k = key.slice(0, 200);
  if (buckets.size >= MAX_BUCKETS && !buckets.has(k)) {
    // Evita crecimiento indefinido: descarta los buckets más antiguos.
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }

  let bucket = buckets.get(k);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(k, bucket);
  }
  prune(bucket, windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now()) / 1000));
    return { allowed: false, remaining: 0, retryAfter };
  }

  bucket.hits.push(now());
  return { allowed: true, remaining: limit - bucket.hits.length, retryAfter: 0 };
}

/** Comprueba sin registrar (para mostrar el estado de la ventana). */
export function peek(key: string, { limit, windowMs }: { limit: number; windowMs: number }): RateLimitResult {
  const bucket = buckets.get(key.slice(0, 200));
  if (!bucket) return { allowed: true, remaining: limit, retryAfter: 0 };
  prune(bucket, windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.hits[0] + windowMs - now()) / 1000));
    return { allowed: false, remaining: 0, retryAfter };
  }
  return { allowed: true, remaining: limit - bucket.hits.length, retryAfter: 0 };
}

/** Limpia un contador tras un inicio de sesión o registro válido. */
export function reset(key: string) {
  buckets.delete(key.slice(0, 200));
}

/** Ventana por defecto de login: 15 min, 5 intentos (configurable por env). */
export function loginPolicy() {
  const max = Number.parseInt(process.env.LOGIN_RATE_LIMIT_MAX ?? '5', 10);
  const windowSec = Number.parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW ?? '900', 10);
  return {
    limit: Number.isFinite(max) && max > 0 ? Math.min(max, 50) : 5,
    windowMs: (Number.isFinite(windowSec) && windowSec > 0 ? Math.min(windowSec, 3600) : 900) * 1000,
  };
}
