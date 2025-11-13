// Entidades TypeScript

import {Supplier} from "@/store/types.ts";

export enum TipoProveedorCodigo {
    JURIDICA = 'TPJ',
    NATURAL = 'TPN',
    NO_DOMICILIADO = 'SND',
    ADQUIRIENTE_TICKET = 'AT'
}

export interface Proveedor {
    id: number;
    codigo: string;
    nombre: string;
    tipoProveedor: TipoProveedorCodigo;
    ruc?: string;
    dni?: string;
    activo: boolean;
}

// Lista en duro (mock data)
export const proveedoresMock: Proveedor[] = [
    {
        id: 1,
        codigo: 'PROV001',
        nombre: 'EMPRESA COMERCIAL S.A.',
        tipoProveedor: TipoProveedorCodigo.JURIDICA,
        ruc: '20100066603',
        activo: true
    },
    {
        id: 2,
        codigo: 'PROV002',
        nombre: 'JUAN PEREZ GARCIA',
        tipoProveedor: TipoProveedorCodigo.NATURAL,
        dni: '48563215',
        activo: true
    },
    {
        id: 3,
        codigo: 'PROV003',
        nombre: 'INTERNATIONAL CORP LTD',
        tipoProveedor: TipoProveedorCodigo.NO_DOMICILIADO,
        activo: true
    },
    {
        id: 4,
        codigo: 'PROV004',
        nombre: 'ADQUIRIENTE GENERICO',
        tipoProveedor: TipoProveedorCodigo.ADQUIRIENTE_TICKET,
        activo: true
    },
    {
        id: 5,
        codigo: 'PROV005',
        nombre: 'CONSTRUCTORA ANDINA S.A.',
        tipoProveedor: TipoProveedorCodigo.JURIDICA,
        ruc: '20345678901',
        activo: false
    }
];

// Validaciones
export class ProveedorValidator {
    private static readonly TIPOS_VALIDOS = [
        TipoProveedorCodigo.JURIDICA,
        TipoProveedorCodigo.NATURAL,
        TipoProveedorCodigo.NO_DOMICILIADO,
        TipoProveedorCodigo.ADQUIRIENTE_TICKET
    ];

    // Validar si el código de tipo proveedor es válido
    static esTipoProveedorValido(codigo: string): boolean {
        return this.TIPOS_VALIDOS.includes(codigo as TipoProveedorCodigo);
    }

    // Validar estructura completa del proveedor
    static validarProveedor(proveedor: Partial<Supplier>): { esValido: boolean; errores: string[] } {
        const errores: string[] = [];

        if (!proveedor.cardCode || proveedor.cardCode.trim() === '') {
            errores.push('El código del proveedor es requerido');
        }
        if (!proveedor.cardName || proveedor.cardName.trim() === '') {
            errores.push('El nombre del proveedor es requerido');
        }

        if (!proveedor.personType) {
            errores.push('El tipo de proveedor es requerido');
        } else if (!this.esTipoProveedorValido(proveedor.personType)) {
            errores.push(`Tipo de proveedor inválido: ${proveedor.personType}. Los valores válidos son: ${this.TIPOS_VALIDOS.join(', ')}`);
        }

        // Validaciones específicas por tipo
        if (proveedor.personType === TipoProveedorCodigo.JURIDICA && !proveedor.RUC) {
            errores.push('El RUC es requerido para proveedores jurídicos');
        }

        if (proveedor.personType === TipoProveedorCodigo.NATURAL && !proveedor.RUC) {
            errores.push('El DNI es requerido para proveedores naturales');
        }

        return {
            esValido: errores.length === 0,
            errores
        };
    }

    // Obtener descripción del tipo de proveedor
    static obtenerDescripcionTipo(codigo: TipoProveedorCodigo): string {
        const descripciones = {
            [TipoProveedorCodigo.JURIDICA]: 'Persona Jurídica',
            [TipoProveedorCodigo.NATURAL]: 'Persona Natural',
            [TipoProveedorCodigo.NO_DOMICILIADO]: 'Sujeto No Domiciliado',
            [TipoProveedorCodigo.ADQUIRIENTE_TICKET]: 'Adquiriente - Ticket'
        };

        return descripciones[codigo] || 'Tipo desconocido';
    }
    static obtenerTipoByCodigo(codigo?: string): TipoProveedorCodigo | null {
        if(codigo == null){
            return null;
        }
        const mapping: { [key:string]: TipoProveedorCodigo } = {
            ['TPJ']: TipoProveedorCodigo.JURIDICA,
            ['TPN']: TipoProveedorCodigo.NATURAL,
            ['SND']: TipoProveedorCodigo.NO_DOMICILIADO,
            ['AT']: TipoProveedorCodigo.ADQUIRIENTE_TICKET,
        }
        return mapping[codigo.toUpperCase()] || null;
    }

    // Filtrar proveedores por tipo
    static filtrarPorTipo(proveedores: Proveedor[], tipo: TipoProveedorCodigo): Proveedor[] {
        return proveedores.filter(proveedor => proveedor.tipoProveedor === tipo);
    }
}

// Ejemplos de uso
export function ejemplosUso(): void {
    console.log('=== PROVEEDORES MOCK ===');
    proveedoresMock.forEach(prov => {
        const descripcion = ProveedorValidator.obtenerDescripcionTipo(prov.tipoProveedor);
        console.log(`${prov.codigo} - ${prov.nombre} - ${descripcion}`);
    });

    console.log('\n=== VALIDACIONES ===');
    const proveedorInvalido: Partial<Supplier> = {
        cardCode: 'PROV999',
        cardName: 'TEST',
        personType: 'INVALIDO' as TipoProveedorCodigo
    };

    const validacion = ProveedorValidator.validarProveedor(proveedorInvalido);
    console.log('Es válido:', validacion.esValido);
    console.log('Errores:', validacion.errores);

    console.log('\n=== FILTRADO POR TIPO JURÍDICA ===');
    const juridicos = ProveedorValidator.filtrarPorTipo(proveedoresMock, TipoProveedorCodigo.JURIDICA);
    juridicos.forEach(prov => console.log(`${prov.codigo} - ${prov.nombre}`));
}