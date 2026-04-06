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
const URL_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Carga la URL cacheada desde localStorage si aún es válida
 */
const loadCachedUrl = (): string | null => {
    try {
        const raw = localStorage.getItem(URL_CACHE_KEY);
        if (!raw) return null;
        const { url, ts }: { url: string; ts: number } = JSON.parse(raw);
        if (Date.now() - ts < URL_CACHE_TTL) return url;
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
    _resolvedUrl = url;
    try {
        localStorage.setItem(URL_CACHE_KEY, JSON.stringify({ url, ts: Date.now() }));
    } catch {
        // ignore
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

/**
 * Detecta qué URL usar: interna y pública se prueban en paralelo.
 * Gana la primera que responde (no-cors opaco cuenta como éxito si el host contesta).
 * Así en red pública no esperas a que falle la interna por timeout secuencial.
 *
 * Persiste el resultado en localStorage para evitar el check en cada recarga.
 */
export const resolveApiBaseUrl = async (): Promise<void> => {
    // Si el cache aún es válido no hace falta volver a probar
    if (loadCachedUrl()) return;

    try {
        const winner = await Promise.any([
            probeReachable(INTERNAL_URL),
            probeReachable(PUBLIC_URL),
        ]);
        setApiBaseUrl(winner);
    } catch {
        setApiBaseUrl(PUBLIC_URL);
    }
};

/**
 * Obtiene la URL base del API activa.
 * Devuelve la URL resuelta (desde cache o el fallback interno).
 */
export const getApiBaseUrl = (): string => _resolvedUrl;
