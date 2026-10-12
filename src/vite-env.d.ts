/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** "true" habilita la eliminación de documentos de la cita (OBS-005) */
    readonly VITE_ENABLE_DELETE_DOCUMENTS?: string;
    /** "/test" apunta todo el API al ambiente de pruebas; vacío = producción */
    readonly VITE_API_PATH_PREFIX?: string;
    /** "true" habilita eliminar PackingList (requiere /api/Documentos/PackingList/Eliminar) */
    readonly VITE_ENABLE_DELETE_PACKING_LIST?: string;
    /** "true" activa la evaluación por producto de Calidad/Almacén (requiere /api/Evaluacion/Productos) */
    readonly VITE_ENABLE_PRODUCT_EVALUATION?: string;
    /** "true" guarda los reclamos en el API (/api/Reclamos); apagado solo genera el PDF */
    readonly VITE_ENABLE_CLAIMS_API?: string;
    readonly VITE_CLAIMS_ENDPOINT?: string;
}

/** Versión de la app, inyectada desde package.json en vite.config.ts */
declare const __APP_VERSION__: string;
