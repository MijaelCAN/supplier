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
}

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
    
    // Si skipObfuscation está activado, usar fetch normal
    if (options.skipObfuscation) {
        const { skipObfuscation, ...fetchOptions } = options;
        return fetch(urlString, fetchOptions);
    }
    
    // En producción, desofuscar la URL antes de hacer la petición
    // (porque en el código usamos endpoints genéricos)
    const realUrl = isProduction ? deobfuscateUrl(urlString) : urlString;
    
    // Hacer la petición con la URL real
    return fetch(realUrl, options);
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
