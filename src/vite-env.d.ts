/// <reference types="vite/client" />

/** Versión de la app, inyectada desde package.json en vite.config.ts */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    /** "true" activa la evaluación por producto de Calidad/Almacén (requiere /api/Evaluacion/Productos) */
    readonly VITE_ENABLE_PRODUCT_EVALUATION?: string;
    /** "true" guarda los reclamos en el API (/api/Reclamos); apagado solo genera el PDF */
    readonly VITE_ENABLE_CLAIMS_API?: string;
    readonly VITE_CLAIMS_ENDPOINT?: string;
    readonly VITE_CLAIMS_FIRST_DOC_ENTRY?: string;
}
