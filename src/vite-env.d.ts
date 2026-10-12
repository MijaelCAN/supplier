/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** "true" habilita la eliminación de documentos de la cita (OBS-005) */
    readonly VITE_ENABLE_DELETE_DOCUMENTS?: string;
    /** "/test" apunta todo el API al ambiente de pruebas; vacío = producción */
    readonly VITE_API_PATH_PREFIX?: string;
}

/** Versión de la app, inyectada desde package.json en vite.config.ts */
declare const __APP_VERSION__: string;
