/**
 * Utilidades de sesión: lectura del token persistido, su expiración (claim `exp`
 * del JWT) y la emisión del evento 'auth-error'.
 *
 * A propósito no importa el store ni el httpClient: es la capa más baja, así
 * ambos pueden usarla sin dependencias circulares.
 */

export const AUTH_ERROR_EVENT = 'auth-error';
export const AUTH_STORAGE_KEY = 'auth-storage';

export const SESSION_EXPIRED_MESSAGE =
    'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';

/**
 * Margen de seguridad: damos el token por vencido unos segundos antes de su
 * `exp` real, para no enviar peticiones que el API rechazaría igual por
 * desfase de reloj entre el navegador y el servidor.
 */
const EXPIRY_SKEW_MS = 5_000;

export interface AuthErrorDetail {
    /** 'expired' = detectado por el vencimiento del JWT; 'unauthorized' = 401/403 del API. */
    reason: 'expired' | 'unauthorized';
    message: string;
    status?: number;
    statusText?: string;
}

interface JwtPayload {
    exp?: number;
    nbf?: number;
    iat?: number;
}

const decodeBase64Url = (segment: string): string | null => {
    try {
        const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const binary = atob(padded);
        // atob devuelve bytes sueltos: hay que rearmar el UTF-8 para no romper acentos
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    } catch {
        return null;
    }
};

/**
 * Decodifica el payload de un JWT. No valida la firma: eso es responsabilidad
 * del API. Aquí solo nos interesa saber cuándo vence.
 */
export const decodeJwtPayload = (token: string): JwtPayload | null => {
    const segments = token.split('.');
    if (segments.length !== 3) {
        return null;
    }

    const json = decodeBase64Url(segments[1]);
    if (!json) {
        return null;
    }

    try {
        const payload = JSON.parse(json);
        return typeof payload === 'object' && payload !== null ? (payload as JwtPayload) : null;
    } catch {
        return null;
    }
};

/** Vencimiento del token en milisegundos epoch, o null si no es un JWT con `exp`. */
export const getTokenExpiryMs = (token: string | null | undefined): number | null => {
    if (!token) {
        return null;
    }
    const payload = decodeJwtPayload(token);
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
};

/**
 * Obtiene el token de autenticación del localStorage.
 * Se lee del storage y no del store de zustand para poder usarlo desde módulos
 * que no son componentes React (httpClient) sin crear ciclos de importación.
 */
export const getStoredSessionToken = (): string | null => {
    try {
        const authStorage = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!authStorage) {
            return null;
        }
        const parsed = JSON.parse(authStorage);
        return parsed?.state?.sessionToken || null;
    } catch (error) {
        console.warn('Error al obtener token de autenticación:', error);
        return null;
    }
};

/**
 * Milisegundos que faltan para que venza la sesión (ya descontado el margen).
 * null = no hay token o el token no declara `exp`, por lo que no hay nada que vigilar.
 */
export const msUntilSessionExpiry = (): number | null => {
    const expiryMs = getTokenExpiryMs(getStoredSessionToken());
    if (expiryMs === null) {
        return null;
    }
    return expiryMs - EXPIRY_SKEW_MS - Date.now();
};

export const isSessionExpired = (): boolean => {
    const remaining = msUntilSessionExpiry();
    return remaining !== null && remaining <= 0;
};

/**
 * Limpia el estado de autenticación persistido.
 * Escribe directamente sobre el storage porque esto puede ocurrir fuera del
 * ciclo de React; el store en memoria lo limpia AuthErrorHandler con logout().
 */
const clearPersistedSession = () => {
    try {
        const authStorage = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!authStorage) {
            return;
        }
        const parsed = JSON.parse(authStorage);
        const updatedState = {
            ...parsed,
            state: {
                ...parsed.state,
                currentUser: null,
                isAuthenticated: false,
                sessionToken: null,
                error: SESSION_EXPIRED_MESSAGE,
            },
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
        console.error('Error al limpiar sesión:', error);
    }
};

/**
 * Evita que varias peticiones fallando en paralelo (o el vigilante y una
 * petición a la vez) disparen el modal repetidas veces.
 */
let authErrorEmitted = false;

/** Se llama tras un login exitoso para volver a habilitar la detección. */
export const resetAuthErrorGuard = () => {
    authErrorEmitted = false;
};

/**
 * Limpia la sesión persistida y notifica a la app (AuthErrorHandler) que la
 * sesión dejó de ser válida. Idempotente hasta el siguiente login.
 */
export const emitAuthError = (detail: AuthErrorDetail) => {
    if (authErrorEmitted) {
        return;
    }
    authErrorEmitted = true;

    clearPersistedSession();

    window.dispatchEvent(new CustomEvent<AuthErrorDetail>(AUTH_ERROR_EVENT, { detail }));
};