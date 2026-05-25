/**
 * Configuración centralizada de APIs
 * Todas las URLs base de los endpoints deben obtenerse desde aquí
 * para facilitar el mantenimiento y evitar cambios en múltiples lugares
 */

const trimTrailingSlash = (u: string) => u.replace(/\/$/, '');

const INTERNAL_URL = trimTrailingSlash(
    import.meta.env.VITE_BASE_URL_INTERNA || 'http://192.168.254.27:8046'
);
const PUBLIC_URL = trimTrailingSlash(
    import.meta.env.VITE_BASE_URL_PUBLIC || 'http://190.12.79.132:8046'
);

const URL_CACHE_KEY = 'supplier_portal_api_url';

/**
 * Carga la URL persistida (sin TTL: una vez resuelta se reutiliza hasta failover o borrado manual).
 */
const loadCachedUrl = (): string | null => {
    try {
        const raw = localStorage.getItem(URL_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { url?: unknown };
        if (typeof parsed.url === 'string' && parsed.url.length > 0) {
            return trimTrailingSlash(parsed.url);
        }
    } catch {
        // ignore
    }
    return null;
};

// URL activa: se inicializa desde cache o usa la interna como fallback
let _resolvedUrl: string = loadCachedUrl() ?? INTERNAL_URL;

/**
 * Actualiza la URL activa y persiste en localStorage
 */
export const setApiBaseUrl = (url: string): void => {
    const normalized = trimTrailingSlash(url);
    _resolvedUrl = normalized;
    try {
        localStorage.setItem(URL_CACHE_KEY, JSON.stringify({ url: normalized, ts: Date.now() }));
    } catch {
        // ignore
    }
};

/**
 * Reasigna el origin de una URL si apunta a la API interna o pública conocida,
 * usando siempre la base resuelta actual. Evita doble petición por failover cuando
 * los módulos capturaron getApiBaseUrl() al importar.
 */
export const rewriteRequestUrlToCurrentBase = (absoluteUrl: string): string => {
    try {
        const u = new URL(absoluteUrl);
        const internalOrigin = new URL(INTERNAL_URL).origin;
        const publicOrigin = new URL(PUBLIC_URL).origin;
        if (u.origin !== internalOrigin && u.origin !== publicOrigin) {
            return absoluteUrl;
        }
        const cur = new URL(getApiBaseUrl());
        u.protocol = cur.protocol;
        u.host = cur.host;
        return u.toString();
    } catch {
        return absoluteUrl;
    }
};

/**
 * Devuelve la URL alternativa dado que una falló (interna ↔ pública).
 * Usa origin para no depender de barras finales ni del orden del replace.
 */
export const getAlternativeBaseUrl = (failedUrl: string): string | null => {
    try {
        const u = new URL(failedUrl);
        const failedOrigin = u.origin;
        const internalOrigin = new URL(INTERNAL_URL).origin;
        const publicOrigin = new URL(PUBLIC_URL).origin;
        if (failedOrigin === internalOrigin) {
            u.protocol = new URL(PUBLIC_URL).protocol;
            u.host = new URL(PUBLIC_URL).host;
            return u.toString();
        }
        if (failedOrigin === publicOrigin) {
            u.protocol = new URL(INTERNAL_URL).protocol;
            u.host = new URL(INTERNAL_URL).host;
            return u.toString();
        }
    } catch {
        // ignore
    }
    return null;
};

/** Tiempo máximo por intento; en paralelo no sumas interna + pública */
const HEALTH_PROBE_TIMEOUT_MS = 1500;

const probeReachable = (base: string): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_PROBE_TIMEOUT_MS);
    return fetch(`${base}/health`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
    })
        .then(() => base)
        .finally(() => clearTimeout(timeoutId));
};

let resolutionPromise: Promise<void> | null = null;

async function probeAndPersistBestBase(): Promise<void> {
    try {
        const winner = await Promise.any([
            probeReachable(INTERNAL_URL),
            probeReachable(PUBLIC_URL),
        ]);
        setApiBaseUrl(winner);
    } catch {
        setApiBaseUrl(PUBLIC_URL);
    }
}

/**
 * Garantiza que la base API quedó resuelta (cache o probe único en esta carga).
 * Idempotente: varias llamadas comparten la misma promesa; no vuelve a hacer /health por petición HTTP.
 */
export const waitForApiBaseResolution = (): Promise<void> => {
    if (loadCachedUrl()) {
        return Promise.resolve();
    }
    if (!resolutionPromise) {
        resolutionPromise = probeAndPersistBestBase();
    }
    return resolutionPromise;
};

/** @deprecated Usar waitForApiBaseResolution */
export const resolveApiBaseUrl = waitForApiBaseResolution;

/**
 * Obtiene la URL base del API activa.
 * Devuelve la URL resuelta (desde cache o el fallback interno).
 */
export const getApiBaseUrl = (): string => _resolvedUrl;
