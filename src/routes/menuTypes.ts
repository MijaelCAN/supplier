import {ReactNode} from "react";

export enum UserRole {
    ADMIN = 'admin',
    PROVEEDOR = 'proveedor',
    COMPRAS = 'compras',
    FINANZAS = 'finanzas',
    CONTABILIDAD = 'contabilidad',
    SOLICITANTE = 'solicitante',
    CALIDAD = 'calidad',
    ALMACEN = 'almacen',
    SEGURIDAD = 'seguridad',
    PLANEAMIENTO = 'planeamiento'
}

/** Quién puede entrar a Partes de Ingreso: menú, ruta y enlaces desde la cita */
export const PARTES_INGRESO_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.CONTABILIDAD, UserRole.COMPRAS];

export interface MenuItem {
    title: string;
    icon: ReactNode;
    href?: string;             // Opcional, porque los items con sub-items no tienen href
    single?: boolean;          // Opcional, solo para items que no tienen sub-items
    items?: MenuItem[];       // Opcional, para sub-items (menú anidado)
    roles: UserRole[];
}