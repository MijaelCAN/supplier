/**
 * Configuración centralizada de APIs
 * Todas las URLs base de los endpoints deben obtenerse desde aquí
 * para facilitar el mantenimiento y evitar cambios en múltiples lugares
 */

/**
 * Resuelve una variable de entorno, intentando con diferentes prefijos
 */
const resolveEnv = (key: string): string | undefined => {
    if (key in import.meta.env && typeof import.meta.env[key] === 'string') {
        return import.meta.env[key] as string;
    }

    const viteKey = `VITE_${key}`;
    if (viteKey in import.meta.env && typeof import.meta.env[viteKey] === 'string') {
        return import.meta.env[viteKey] as string;
    }

    const reactKey = `REACT_APP_${key}`;
    if (reactKey in import.meta.env && typeof import.meta.env[reactKey] === 'string') {
        console.log(`React key: ${viteKey}`);
        return import.meta.env[reactKey] as string;
    }

    return undefined;
};

/**
 * Obtiene la URL base del API principal
 * Usa VITE_BASE_URL del archivo .env o el valor por defecto
 * 
 * @returns URL base del API (ej: http://192.168.254.27:8046)
 */
export const getApiBaseUrl = (): string => {
    return resolveEnv('VITE_BASE_URL') || 'http://192.168.254.27:8046';
};
