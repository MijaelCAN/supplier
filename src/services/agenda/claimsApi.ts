// src/services/agenda/claimsApi.ts
// API de Reclamos a proveedor (OBS-008, partes 2 y 3). Contrato enviado al backend el 2026-09-30.
import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";
import { fileToBase64 } from "@/services/agenda/evaluationsApi";
import { ClaimAction, ClaimAttachment, ClaimProduct, SupplierClaim } from "@/store/types";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const CLAIMS_ENDPOINT = '/api/Reclamos';

/**
 * Interruptor mientras el backend no publique /api/Reclamos.
 * Apagado: el reclamo solo genera el PDF, como antes.
 */
export const CLAIMS_API_ENABLED = import.meta.env.VITE_ENABLE_CLAIMS_API === 'true';

type ClaimEstadoApi = 'ABIERTO' | 'EN_RESPUESTA' | 'CERRADO';

const STATUS_FROM_API: Record<ClaimEstadoApi, NonNullable<SupplierClaim['status']>> = {
    ABIERTO: 'Abierto',
    EN_RESPUESTA: 'En Respuesta',
    CERRADO: 'Cerrado',
};

const STATUS_TO_API: Record<NonNullable<SupplierClaim['status']>, ClaimEstadoApi> = {
    'Abierto': 'ABIERTO',
    'En Respuesta': 'EN_RESPUESTA',
    'Cerrado': 'CERRADO',
};

interface ClaimsApiResponse<T> {
    status_code: number;
    success: boolean;
    message: string;
    data?: T;
}

export interface ClaimListFilters {
    ruc?: string;
    estado?: ClaimEstadoApi;
    fechaInicio?: string; // YYYYMMDD
    fechaFin?: string; // YYYYMMDD
}

const toNumber = (value: unknown): number => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : 0;
};

/** Fecha del API ("2026-09-30" o "2026-09-30T00:00:00") a "YYYY-MM-DD" para inputs y PDF. */
const toDateOnly = (value?: string | null): string => (value ? String(value).split('T')[0] : '');

const mapProductFromApi = (raw: any): ClaimProduct => ({
    document: toNumber(raw.document),
    lineNumber: toNumber(raw.line_number),
    itemCode: raw.item_code ?? '',
    itemName: raw.item_name ?? '',
    cantidadRechazada: toNumber(raw.cantidad_rechazada),
    motivo: raw.motivo ?? '',
});

const mapActionFromApi = (raw: any): ClaimAction => ({
    accion: raw.accion ?? '',
    fecha: toDateOnly(raw.fecha),
    estado: raw.estado === 'CERRADO' ? 'Cerrado' : 'Abierto',
    verificadoPor: raw.verificado_por ?? '',
    fechaVerificacion: toDateOnly(raw.fecha_verificacion),
});

/** Resumen de productos para los campos de cabecera del formato (Insumo/Material y Cantidad). */
const summarizeProducts = (productos: ClaimProduct[]): Pick<SupplierClaim, 'insumoMaterial' | 'cantidad'> => ({
    insumoMaterial: productos.map((p) => `${p.itemCode} - ${p.itemName}`).join(', '),
    cantidad: productos.length > 0
        ? String(productos.reduce((sum, p) => sum + p.cantidadRechazada, 0))
        : '',
});

export const mapClaimFromApi = (raw: any): SupplierClaim => {
    const productos: ClaimProduct[] = Array.isArray(raw.productos) ? raw.productos.map(mapProductFromApi) : [];
    const cabecera = raw.cabecera ?? {};
    const respuesta = raw.respuesta_inmediata ?? {};
    const evaluacion = raw.evaluacion_reclamo ?? {};
    const cierre = raw.cierre ?? {};

    return {
        docEntry: raw.doc_entry != null ? String(raw.doc_entry) : undefined,
        numeroReclamo: raw.numero_reclamo ?? '',
        codCita: raw.cod_cita != null ? String(raw.cod_cita) : '',
        rucProveedor: raw.ruc_proveedor ?? '',
        proveedor: raw.razon_social ?? '',
        fechaReclamo: toDateOnly(raw.fecha_reclamo),
        areaEmite: raw.area_emite ?? '',
        responsable: raw.responsable ?? '',
        status: STATUS_FROM_API[raw.estado as ClaimEstadoApi] ?? 'Abierto',
        nLote: cabecera.n_lote ?? '',
        ordenCompra: cabecera.orden_compra ?? '',
        factura: cabecera.factura ?? '',
        fechaArribo: toDateOnly(cabecera.fecha_arribo),
        productos,
        ...summarizeProducts(productos),
        datosRegistroInspeccion: raw.datos_registro_inspeccion ?? '',
        motivoReclamo: raw.motivo_reclamo ?? '',
        impacto: raw.impacto ?? '',
        respuestaInmediata: {
            fechaRespuesta: toDateOnly(respuesta.fecha_respuesta),
            responsable: respuesta.responsable ?? '',
            respuesta: respuesta.respuesta ?? '',
        },
        evaluacionReclamo: {
            fechaEvaluacion: toDateOnly(evaluacion.fecha_evaluacion),
            evaluadoPor: evaluacion.evaluado_por ?? '',
            reclamoProcede: evaluacion.reclamo_procede === 'SI' || evaluacion.reclamo_procede === 'NO'
                ? evaluacion.reclamo_procede
                : undefined,
            descripcion: evaluacion.descripcion ?? '',
        },
        planAcciones: Array.isArray(raw.plan_acciones) ? raw.plan_acciones.map(mapActionFromApi) : [],
        cierreReclamo: {
            accionesEfectivas: cierre.acciones_efectivas === 'SI' || cierre.acciones_efectivas === 'NO'
                ? cierre.acciones_efectivas
                : undefined,
            fechaCierre: toDateOnly(cierre.fecha_cierre),
            responsableCierre: cierre.responsable_cierre ?? '',
            observacion: cierre.observacion ?? '',
        },
        adjuntos: Array.isArray(raw.adjuntos)
            ? raw.adjuntos.map((a: any): ClaimAttachment => ({ nameFile: a.name_file ?? '', url: a.url ?? '' }))
            : [],
    };
};

/** Las guardadas se reenvían con su url; las nuevas en base64 (mismo criterio que /api/Evaluacion/Archivos). */
const mapAttachmentsToApi = async (adjuntos: ClaimAttachment[] = []) =>
    Promise.all(adjuntos.map(async (a) =>
        a.file
            ? { name_file: a.nameFile, base64: await fileToBase64(a.file) }
            : { name_file: a.nameFile, url: a.url ?? '' }
    ));

/** Cabecera, secciones 1–2, productos y adjuntos (lo que registra el área interna). */
const mapClaimToApi = async (claim: SupplierClaim) => ({
    cod_cita: claim.codCita,
    ruc_proveedor: claim.rucProveedor ?? '',
    razon_social: claim.proveedor,
    fecha_reclamo: claim.fechaReclamo,
    area_emite: claim.areaEmite,
    responsable: claim.responsable,
    estado: STATUS_TO_API[claim.status ?? 'Abierto'],
    cabecera: {
        n_lote: claim.nLote ?? '',
        orden_compra: claim.ordenCompra ?? '',
        factura: claim.factura ?? '',
        fecha_arribo: claim.fechaArribo ?? '',
    },
    productos: (claim.productos ?? []).map((p) => ({
        document: p.document,
        line_number: p.lineNumber,
        item_code: p.itemCode,
        item_name: p.itemName,
        cantidad_rechazada: p.cantidadRechazada,
        motivo: p.motivo,
    })),
    datos_registro_inspeccion: claim.datosRegistroInspeccion ?? '',
    motivo_reclamo: claim.motivoReclamo,
    impacto: claim.impacto ?? '',
    adjuntos: await mapAttachmentsToApi(claim.adjuntos),
});

/** Secciones 3–5 (respuesta del proveedor). */
const mapResponseToApi = (claim: SupplierClaim) => ({
    respuesta_inmediata: {
        fecha_respuesta: claim.respuestaInmediata?.fechaRespuesta ?? '',
        responsable: claim.respuestaInmediata?.responsable ?? '',
        respuesta: claim.respuestaInmediata?.respuesta ?? '',
    },
    evaluacion_reclamo: {
        fecha_evaluacion: claim.evaluacionReclamo?.fechaEvaluacion ?? '',
        evaluado_por: claim.evaluacionReclamo?.evaluadoPor ?? '',
        reclamo_procede: claim.evaluacionReclamo?.reclamoProcede ?? '',
        descripcion: claim.evaluacionReclamo?.descripcion ?? '',
    },
    plan_acciones: (claim.planAcciones ?? []).map((a) => ({
        accion: a.accion,
        fecha: a.fecha,
        estado: a.estado === 'Cerrado' ? 'CERRADO' : 'ABIERTO',
        verificado_por: a.verificadoPor ?? '',
        fecha_verificacion: a.fechaVerificacion ?? '',
    })),
});

/** Sección 6 (cierre por el área interna). */
const mapClosureToApi = (claim: SupplierClaim) => ({
    cierre: {
        acciones_efectivas: claim.cierreReclamo?.accionesEfectivas ?? '',
        fecha_cierre: claim.cierreReclamo?.fechaCierre ?? '',
        responsable_cierre: claim.cierreReclamo?.responsableCierre ?? '',
        observacion: claim.cierreReclamo?.observacion ?? '',
    },
});

const requestClaims = async <T>(url: string, init: RequestInit, action: string): Promise<T | undefined> => {
    const response = await httpClient(url, {
        ...init,
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        if (response.status === 404 && (init.method ?? 'GET') === 'GET') return undefined;
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al ${action} (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as ClaimsApiResponse<T>;
    if (!json || !json.success) {
        throw new Error(json?.message || `Error al ${action}`);
    }
    return json.data;
};

/** Reclamo de una cita (un reclamo por cita), o null si no tiene. */
export const fetchClaimByCita = async (codCita: string): Promise<SupplierClaim | null> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, `${CLAIMS_ENDPOINT}/Cita`, { codCita });
    const data = await requestClaims<any>(url, { method: 'GET' }, 'consultar el reclamo de la cita');
    return data ? mapClaimFromApi(data) : null;
};

export const fetchClaim = async (docEntry: string): Promise<SupplierClaim | null> => {
    const url = `${DEFAULT_API_BASE_URL}${CLAIMS_ENDPOINT}/${encodeURIComponent(docEntry)}`;
    const data = await requestClaims<any>(url, { method: 'GET' }, 'consultar el reclamo');
    return data ? mapClaimFromApi(data) : null;
};

/** Listado de reclamos; el backend limita al proveedor a los suyos. */
export const fetchClaims = async (filters: ClaimListFilters = {}): Promise<SupplierClaim[]> => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
    });
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, CLAIMS_ENDPOINT, params);
    const data = await requestClaims<any[]>(url, { method: 'GET' }, 'consultar los reclamos');
    const records = Array.isArray(data) ? data : data ? [data] : [];
    return records.map(mapClaimFromApi);
};

/** Crea el reclamo; el backend genera el número y envía el correo al proveedor. */
export const createClaim = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    const body = await mapClaimToApi({ ...claim, status: 'Abierto' });
    const data = await requestClaims<any>(
        `${DEFAULT_API_BASE_URL}${CLAIMS_ENDPOINT}`,
        { method: 'POST', body: JSON.stringify(body) },
        'crear el reclamo'
    );
    // Si el backend no devuelve el reclamo, se consulta por la cita
    return data ? mapClaimFromApi(data) : (await fetchClaimByCita(claim.codCita)) ?? claim;
};

/** Edita cabecera, secciones 1–2, productos y adjuntos (solo en estado Abierto). */
export const updateClaim = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    if (!claim.docEntry) throw new Error('El reclamo no tiene DocEntry');
    const body = await mapClaimToApi(claim);
    const data = await requestClaims<any>(
        `${DEFAULT_API_BASE_URL}${CLAIMS_ENDPOINT}/${encodeURIComponent(claim.docEntry)}`,
        { method: 'PUT', body: JSON.stringify(body) },
        'actualizar el reclamo'
    );
    return data ? mapClaimFromApi(data) : (await fetchClaim(claim.docEntry)) ?? claim;
};

/** Respuesta del proveedor (secciones 3–5); pasa a En Respuesta. */
export const saveClaimResponse = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    if (!claim.docEntry) throw new Error('El reclamo no tiene DocEntry');
    const data = await requestClaims<any>(
        `${DEFAULT_API_BASE_URL}${CLAIMS_ENDPOINT}/${encodeURIComponent(claim.docEntry)}/Respuesta`,
        { method: 'PUT', body: JSON.stringify(mapResponseToApi(claim)) },
        'guardar la respuesta del reclamo'
    );
    return data ? mapClaimFromApi(data) : (await fetchClaim(claim.docEntry)) ?? claim;
};

/** Cierre del reclamo por el área interna (sección 6); pasa a Cerrado. */
export const closeClaim = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    if (!claim.docEntry) throw new Error('El reclamo no tiene DocEntry');
    const data = await requestClaims<any>(
        `${DEFAULT_API_BASE_URL}${CLAIMS_ENDPOINT}/${encodeURIComponent(claim.docEntry)}/Cierre`,
        { method: 'PUT', body: JSON.stringify(mapClosureToApi(claim)) },
        'cerrar el reclamo'
    );
    return data ? mapClaimFromApi(data) : (await fetchClaim(claim.docEntry)) ?? claim;
};

/** Junta productos nuevos con los del reclamo sin duplicar la misma línea con el mismo motivo. */
export const mergeClaimProducts = (current: ClaimProduct[], incoming: ClaimProduct[]): ClaimProduct[] => {
    const key = (p: ClaimProduct) => `${p.document}-${p.lineNumber}-${p.motivo.trim().toLowerCase()}`;
    const existing = new Set(current.map(key));
    return [...current, ...incoming.filter((p) => !existing.has(key(p)))];
};
