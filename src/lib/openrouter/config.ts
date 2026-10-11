/**
 * Configuración de la API de OpenRouter (solo servidor).
 *
 * Reglas:
 *  - Los valores SIEMPRE vienen de variables de entorno (.env.local), nunca
 *    hardcodeados en next.config.js ni en settings.json de herramientas.
 *  - La clave NUNCA lleva prefijo NEXT_PUBLIC_ (Next.js la expondría en el
 *    bundle del navegador). `assertNoPublicOpenRouterKey()` lo comprueba.
 *  - Fuera del navegador: cualquier uso en un Client Component lanza error.
 */

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterConfigError';
  }
}

export type OpenRouterConfig = {
  /** Clave de API (sk-or-v1-...). Solo en el servidor. */
  apiKey: string;
  /** URL base, p.ej. https://openrouter.ai/api/v1 */
  baseUrl: string;
  /** Modelo por defecto opcional (OPENROUTER_MODEL). */
  model: string | null;
};

/** Lee una variable de entorno y la normaliza (vacío -> null). */
function readEnv(name: string): string | null {
  const raw = process.env[name];
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

/**
 * Impide que una clave de OpenRouter se filtre al cliente por un prefijo
 * NEXT_PUBLIC_ mal usado. Se ejecuta al pedir la config.
 */
function assertNoPublicOpenRouterKey(): void {
  const leaked = readEnv('NEXT_PUBLIC_OPENROUTER_API_KEY');
  if (leaked) {
    throw new OpenRouterConfigError(
      '[openrouter] NEXT_PUBLIC_OPENROUTER_API_KEY expone la clave en el bundle del ' +
        'navegador. Renómbrala a OPENROUTER_API_KEY (sin prefijo) y rota la clave.'
    );
  }
}

/**
 * Devuelve la configuración validada de OpenRouter.
 * Lanza `OpenRouterConfigError` si falta la clave o la URL base es inválida.
 */
export function getOpenRouterConfig(): OpenRouterConfig {
  if (typeof window !== 'undefined') {
    throw new OpenRouterConfigError(
      '[openrouter] La configuración de OpenRouter es solo de servidor; ' +
        'no puede leerse en un componente del navegador.'
    );
  }

  assertNoPublicOpenRouterKey();

  const apiKey = readEnv('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new OpenRouterConfigError(
      '[openrouter] Falta OPENROUTER_API_KEY. Cópiala en .env.local ' +
        '(ver .env.local.example) y reinicia el servidor de desarrollo.'
    );
  }

  const baseUrl = (readEnv('OPENROUTER_BASE_URL') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new OpenRouterConfigError(
      `[openrouter] OPENROUTER_BASE_URL no es una URL válida: ${baseUrl}`
    );
  }
  if (parsed.protocol !== 'https:') {
    throw new OpenRouterConfigError(
      '[openrouter] OPENROUTER_BASE_URL debe usar https:// (la clave viajaría en claro).'
    );
  }

  return { apiKey, baseUrl, model: readEnv('OPENROUTER_MODEL') };
}

/** Construye un endpoint completo, p.ej. buildOpenRouterUrl(cfg, '/chat/completions'). */
export function buildOpenRouterUrl(config: OpenRouterConfig, path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${config.baseUrl}${suffix}`;
}

/** Cabeceras estándar para llamadas a la API (Authorization incluida). */
export function openRouterHeaders(config: OpenRouterConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };
}
