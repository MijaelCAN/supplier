/// <reference types="vite/client" />

/** Versión de la app, inyectada desde package.json en vite.config.ts */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    /** "true" activa la evaluación por producto de Calidad/Almacén (requiere /api/Evaluacion/Productos) */
    readonly VITE_ENABLE_PRODUCT_EVALUATION?: string;
}
