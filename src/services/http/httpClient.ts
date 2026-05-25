/**
 * Cliente HTTP centralizado con ofuscación de endpoints en producción
 * 
 * Este servicio intercepta todas las peticiones HTTP y en producción
 * reemplaza los endpoints reales por nombres genéricos para dificultar
 * la identificación de los endpoints en el inspector del navegador.
 * 
 * NOTA: El navegador siempre mostrará las URLs reales en el inspector de red.
 * Para ocultarlas completamente, se requiere un proxy en el servidor.
 * Esta solución ofusca los endpoints en el código fuente y usa nombres genéricos.
 */

import {
    getAlternativeBaseUrl,
    rewriteRequestUrlToCurrentBase,
    setApiBaseUrl,
    waitForApiBaseResolution,
} from '@/config/api';

// Detectar si estamos en producción
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

/**
 * Mapeo de endpoints reales a nombres genéricos para producción
 * En producción, estos nombres genéricos se usarán en lugar de los reales
 */
const ENDPOINT_OBFUSCATION_MAP: Record<string, string> = {
    // Mapeo de endpoints reales a genéricos
    '/api/Documentos/OrdenCompra': '/api/v1/orders',
    '/api/Proveedores': '/api/v1/suppliers',
    '/api/Documentos/Factura': '/api/v1/invoices',
    '/api/email': '/api/v1/notifications',
    '/api/Maestros': '/api/v1/masters',
    '/api/Proveedores/BlackList': '/api/v1/blacklist',
    '/health': '/api/v1/health',
    '/api/Maestros/CondicionPago': '/api/v1/payment-terms',
    // Endpoints de email
    '/api/email/verify': '/api/v1/notifications/verify',
    '/api/email/send': '/api/v1/notifications/send',
    '/api/email/order-notification': '/api/v1/notifications/orders',
    '/api/email/notification': '/api/v1/notifications/generic',
    '/api/email/supplier-credentials': '/api/v1/notifications/credentials',
    '/api/email/password-recovery': '/api/v1/notifications/recovery',
};

/**
 * Mapeo inverso: de nombres genéricos a endpoints reales
 */
const REVERSE_OBFUSCATION_MAP: Record<string, string> = Object.entries(ENDPOINT_OBFUSCATION_MAP).reduce(
    (acc, [real, generic]) => {
        acc[generic] = real;
        return acc;
    },
    {} as Record<string, string>
);

/**
 * Ofusca un endpoint reemplazándolo por su nombre genérico
 */
const obfuscateEndpoint = (endpoint: string): string => {
    if (!isProduction) {
        return endpoint;
    }

    // Buscar si el endpoint tiene un mapeo
    for (const [realEndpoint, genericEndpoint] of Object.entries(ENDPOINT_OBFUSCATION_MAP)) {
        if (endpoint.includes(realEndpoint)) {
            return endpoint.replace(realEndpoint, genericEndpoint);
        }
    }

    return endpoint;
};

/**
 * Desofusca un endpoint genérico a su endpoint real
 */
const deobfuscateEndpoint = (endpoint: string): string => {
    if (!isProduction) {
        return endpoint;
    }

    // Buscar si el endpoint tiene un mapeo inverso
    for (const [genericEndpoint, realEndpoint] of Object.entries(REVERSE_OBFUSCATION_MAP)) {
        if (endpoint.includes(genericEndpoint)) {
            return endpoint.replace(genericEndpoint, realEndpoint);
        }
    }

    return endpoint;
};

/**
 * Ofusca una URL completa
 */
const obfuscateUrl = (url: string): string => {
    if (!isProduction) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        const originalPath = urlObj.pathname;
        const obfuscatedPath = obfuscateEndpoint(originalPath);
        urlObj.pathname = obfuscatedPath;
        return urlObj.toString();
    } catch (error) {
        console.warn('Error al ofuscar URL:', error);
        return url;
    }
};

/**
 * Desofusca una URL completa
 */
const deobfuscateUrl = (url: string): string => {
    if (!isProduction) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        const originalPath = urlObj.pathname;
        const deobfuscatedPath = deobfuscateEndpoint(originalPath);
        urlObj.pathname = deobfuscatedPath;
        return urlObj.toString();
    } catch (error) {
        console.warn('Error al desofuscar URL:', error);
        return url;
    }
};

/**
 * Interfaz para opciones de fetch extendidas
 */
export interface FetchOptions extends RequestInit {
    /**
     * Si es true, no se ofuscará la URL (útil para URLs externas)
     */
    skipObfuscation?: boolean;
    /**
     * Si es true, no se agregará el token de autenticación (útil para endpoints públicos)
     */
    skipAuth?: boolean;
    /**
     * Timeout en ms para esta petición. Por defecto: 120 000 ms (2 min).
     * Pasar 0 para deshabilitar el timeout.
     */
    timeout?: number;
}

/**
 * Obtiene el token de autenticación del localStorage
 */
const getAuthToken = (): string | null => {
    try {
        const authStorage = localStorage.getItem('auth-storage');
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
 * Maneja errores de autenticación (401, 403) limpiando la sesión y redirigiendo al login
 */
const handleAuthError = (status: number, statusText: string) => {
    // Solo manejar errores de autenticación
    if (status !== 401 && status !== 403) {
        return;
    }

    // Limpiar el estado de autenticación del localStorage
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            // Actualizar el estado para limpiar la sesión
            const updatedState = {
                ...parsed,
                state: {
                    ...parsed.state,
                    currentUser: null,
                    isAuthenticated: false,
                    sessionToken: null,
                    error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                },
            };
            localStorage.setItem('auth-storage', JSON.stringify(updatedState));
        }
    } catch (error) {
        console.error('Error al limpiar sesión:', error);
    }

    // Disparar evento personalizado para que los componentes React puedan reaccionar
    // El componente AuthErrorHandler se encargará de mostrar el toast y redirigir
    const authErrorEvent = new CustomEvent('auth-error', {
        detail: {
            status,
            statusText,
            message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        },
    });
    window.dispatchEvent(authErrorEvent);
};

const API_REQUEST_TIMEOUT_MS = 120_000; // 2 minutos por defecto

/**
 * Ejecuta fetch; si falla por red, reintenta una vez con la base API alternativa (interna ↔ pública)
 * y persiste la base que respondió para alinear getApiBaseUrl() en nuevas llamadas.
 */
const fetchWithApiFailover = async (
    targetUrl: string,
    fetchOptions: RequestInit,
    skipAuth: boolean | undefined,
    timeoutMs: number = API_REQUEST_TIMEOUT_MS
): Promise<Response> => {
    await waitForApiBaseResolution();
    const urlAfterBase = rewriteRequestUrlToCurrentBase(targetUrl);

    const run = async (url: string): Promise<Response> => {
        // Si el caller ya envió su propio signal, respetarlo sin imponer timeout adicional
        if (fetchOptions.signal) {
            const response = await fetch(url, fetchOptions);
            if (!skipAuth && (response.status === 401 || response.status === 403)) {
                handleAuthError(response.status, response.statusText);
            }
            return response;
        }

        // Sin signal propio: aplicar timeout configurable (0 = sin límite)
        if (timeoutMs === 0) {
            const response = await fetch(url, fetchOptions);
            if (!skipAuth && (response.status === 401 || response.status === 403)) {
                handleAuthError(response.status, response.statusText);
            }
            return response;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
            if (!skipAuth && (response.status === 401 || response.status === 403)) {
                handleAuthError(response.status, response.statusText);
            }
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    try {
        return await run(urlAfterBase);
    } catch (firstError) {
        const altUrl = getAlternativeBaseUrl(urlAfterBase);
        if (!altUrl) {
            throw firstError;
        }
        try {
            const response = await run(altUrl);
            try {
                setApiBaseUrl(new URL(altUrl).origin);
            } catch {
                // ignore
            }
            return response;
        } catch {
            throw firstError;
        }
    }
};

/**
 * Cliente HTTP que intercepta y ofusca URLs en producción
 * 
 * IMPORTANTE: Esta solución ofusca los endpoints en el código fuente,
 * pero el navegador seguirá mostrando las URLs reales en el inspector de red.
 * Para ocultarlas completamente, se requiere implementar un proxy en el servidor.
 * 
 * @param url - URL de la petición
 * @param options - Opciones de fetch
 * @returns Promise con la respuesta
 */
export const httpClient = async (
    url: string | URL,
    options: FetchOptions = {}
): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Preparar headers
    const headers = new Headers(options.headers);
    
    // Agregar token de autenticación si no se especifica skipAuth
    if (!options.skipAuth) {
        const token = getAuthToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }
    
    const { skipObfuscation, skipAuth, timeout, ...fetchOptions } = options;
    const init: RequestInit = {
        ...fetchOptions,
        headers,
    };

    // Si skipObfuscation está activado, usar fetch normal (failover solo si la URL es de nuestras bases)
    if (options.skipObfuscation) {
        return fetchWithApiFailover(urlString, init, skipAuth, timeout);
    }

    // En producción, desofuscar la URL antes de hacer la petición
    // (porque en el código usamos endpoints genéricos)
    const realUrl = isProduction ? deobfuscateUrl(urlString) : urlString;

    return fetchWithApiFailover(realUrl, init, skipAuth, timeout);
};

/**
 * Wrapper para fetch que usa el cliente HTTP
 * 
 * Esta función reemplaza fetch() globalmente en producción
 */
export const secureFetch = httpClient;

/**
 * Función helper para construir URLs de forma segura
 * En producción, usa endpoints genéricos
 */
export const buildSecureUrl = (
    baseUrl: string,
    endpoint: string,
    params?: Record<string, string | number | boolean>
): string => {
    // En producción, usar endpoint genérico
    const secureEndpoint = isProduction ? obfuscateEndpoint(endpoint) : endpoint;
    const url = new URL(secureEndpoint, baseUrl);
    
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });
    }
    
    return url.toString();
};

/**
 * Función para obtener la URL ofuscada (solo para logging/debugging)
 */
export const getObfuscatedUrl = (url: string): string => {
    return obfuscateUrl(url);
};

/**
 * Función para obtener el endpoint ofuscado
 */
export const getObfuscatedEndpoint = (endpoint: string): string => {
    return obfuscateEndpoint(endpoint);
};
