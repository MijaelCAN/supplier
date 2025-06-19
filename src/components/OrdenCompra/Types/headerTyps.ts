export interface HeaderCompProps{
    title?:string;
    subtitle?:string;
    isOptions: boolean;
    onExport?: () => void;
    onRegisterOpen?:()=>void;
    onRegisterOrder?:()=>void;
}