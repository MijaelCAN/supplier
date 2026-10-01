/// <reference types="vite/client" />

/** Versión de la app, inyectada desde package.json en vite.config.ts */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    /** "true" habilita eliminar PackingList (requiere /api/Documentos/PackinList/Eliminar) */
    readonly VITE_ENABLE_DELETE_PACKING_LIST?: string;
}
