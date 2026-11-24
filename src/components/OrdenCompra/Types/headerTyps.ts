export interface HeaderCompProps{
    title?:string;
    subtitle?:string;
    isOptions: boolean;
    onExport?: () => void;
    onRegisterOpen?:()=>void;
    onRegisterOrder?:()=>void;
    canCreate?: boolean;
    /** Botones adicionales a la izquierda de "Nuevo Proveedor" */
    extraActions?: import('react').ReactNode;
}