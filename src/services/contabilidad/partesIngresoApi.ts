// src/services/contabilidad/partesIngresoApi.ts
// Partes de Ingreso para Contabilidad: entradas de mercancía de SAP con su estado de factura y los documentos de la cita.
// Mientras el backend no publique el endpoint se usan datos simulados (USAR_MOCK).
import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";
import partesIngresoMock from "./partesIngreso.mock.json";

/**
 * true: lee partesIngreso.mock.json (filtrado por fecha y proveedor, con ~500 ms de espera).
 * false: llama a GET /api/Contabilidad/partes-ingreso.
 */
export const USAR_MOCK = false;

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PARTES_INGRESO_ENDPOINT = '/api/Contabilidad/partes-ingreso';
const MOCK_DELAY_MS = 500;

export type EstadoFactura = 'FALTA FACTURA' | 'FACTURA REGISTRADA';
export type ValidacionDocumentos = 'OK' | 'REVISAR' | 'SIN CITA';

export interface ParteIngresoContabilidad {
    fechaParteIngreso: string;          // yyyy-MM-dd
    numeroParteIngreso: number;
    numeroGuia: string;
    codigoProveedor: string;
    proveedor: string;
    ruc: string;
    condicionPago: string | null;
    moneda: string;
    total: number;
    ordenesCompra: string | null;       // varias separadas por coma
    numeroFactura: string | null;       // varias separadas por coma
    estadoFactura: EstadoFactura;
    numeroPackingList: string | null;
    numeroCita: number | null;
    validacionDocumentos: ValidacionDocumentos;
    linksOC: string[];
    linksGuia: string[];
    linksFactura: string[];
    linksCC: string[];
    linksOtros: string[];               // los demás archivos de la cita; el tipo sale del prefijo del nombre (LT_, HS_...)
}

/** Fila tal como la devuelve el API (snake_case, dentro de { data: [...] }) */
interface ParteIngresoApiRow {
    fecha_parte_ingreso: string;
    numero_parte_ingreso: number;
    numero_guia: string;
    codigo_proveedor: string;
    proveedor: string;
    ruc: string;
    condicion_pago: string | null;
    moneda: string;
    total: number;
    ordenes_compra: string | null;
    numero_factura: string | null;
    estado_factura: EstadoFactura;
    numero_packing_list: string | null;
    numero_cita: number | null;
    validacion_documentos: ValidacionDocumentos;
    links_oc: string[] | null;
    links_guia: string[] | null;
    links_factura: string[] | null;
    links_cc: string[] | null;
    links_otros?: string[] | null;
}

const toParteIngreso = (row: ParteIngresoApiRow): ParteIngresoContabilidad => ({
    fechaParteIngreso: row.fecha_parte_ingreso,
    numeroParteIngreso: row.numero_parte_ingreso,
    numeroGuia: row.numero_guia,
    codigoProveedor: row.codigo_proveedor,
    proveedor: row.proveedor,
    ruc: row.ruc,
    condicionPago: row.condicion_pago || null,
    moneda: row.moneda,
    total: Number(row.total),
    ordenesCompra: row.ordenes_compra || null,
    numeroFactura: row.numero_factura || null,
    estadoFactura: row.estado_factura,
    numeroPackingList: row.numero_packing_list || null,   // el API manda "" cuando no hay
    numeroCita: row.numero_cita,
    validacionDocumentos: row.validacion_documentos,
    linksOC: row.links_oc ?? [],
    linksGuia: row.links_guia ?? [],
    linksFactura: row.links_factura ?? [],
    linksCC: row.links_cc ?? [],
    linksOtros: row.links_otros ?? [],
});

export interface ProveedorParteIngreso {
    codigoProveedor: string;
    proveedor: string;
    ruc: string;
}

// En el JSON linksOtros solo viene en algunas filas, igual que links_otros en el API
type ParteIngresoMock = Omit<ParteIngresoContabilidad, 'linksOtros'> & { linksOtros?: string[] };
const MOCK_ROWS: ParteIngresoContabilidad[] = (partesIngresoMock as ParteIngresoMock[])
    .map((row) => ({ ...row, linksOtros: row.linksOtros ?? [] }));

/** Proveedores únicos de las filas, ordenados por nombre (para el buscador de proveedor) */
export const getProveedoresUnicos = (rows: ParteIngresoContabilidad[]): ProveedorParteIngreso[] => {
    const byCode = new Map<string, ProveedorParteIngreso>();
    rows.forEach(({ codigoProveedor, proveedor, ruc }) => {
        if (!byCode.has(codigoProveedor)) byCode.set(codigoProveedor, { codigoProveedor, proveedor, ruc });
    });
    return Array.from(byCode.values()).sort((a, b) => a.proveedor.localeCompare(b.proveedor));
};

/** En modo simulado, los proveedores del JSON; con el API no hay maestro y se usan los del último resultado */
export const PROVEEDORES_SIMULADOS: ProveedorParteIngreso[] | null = USAR_MOCK ? getProveedoresUnicos(MOCK_ROWS) : null;

const listarMock = async (fechaInicio: string, fechaFin: string, codigoProveedor?: string): Promise<ParteIngresoContabilidad[]> => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return MOCK_ROWS.filter((row) =>
        row.fechaParteIngreso >= fechaInicio &&
        row.fechaParteIngreso <= fechaFin &&
        (!codigoProveedor || row.codigoProveedor === codigoProveedor)
    );
};

const listarApi = async (fechaInicio: string, fechaFin: string, codigoProveedor?: string): Promise<ParteIngresoContabilidad[]> => {
    const params: Record<string, string> = {
        fechaInicio: fechaInicio.replace(/-/g, ''),
        fechaFin: fechaFin.replace(/-/g, ''),       // SAP las recibe yyyyMMdd
    };
    if (codigoProveedor) params.codigoProveedor = codigoProveedor;
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PARTES_INGRESO_ENDPOINT, params);

    const response = await httpClient(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        // 400: { "message": "..." }
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || `No se pudieron consultar los partes de ingreso (${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data?.data) ? (data.data as ParteIngresoApiRow[]).map(toParteIngreso) : [];
};

/**
 * Partes de ingreso del rango (fechas yyyy-MM-dd, ambas obligatorias); sin codigoProveedor trae todos los proveedores.
 */
export const listar = (fechaInicio: string, fechaFin: string, codigoProveedor?: string): Promise<ParteIngresoContabilidad[]> =>
    USAR_MOCK
        ? listarMock(fechaInicio, fechaFin, codigoProveedor)
        : listarApi(fechaInicio, fechaFin, codigoProveedor);
