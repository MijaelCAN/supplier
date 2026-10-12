// src/services/agenda/claimsApi.ts
// API de Reclamos a proveedor (OBS-008, partes 2 y 3). Ajustado al API publicado por el backend (2026-10-09).
import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";
import { fileToBase64 } from "@/services/agenda/evaluationsApi";
import { ClaimAction, ClaimAttachment, ClaimProduct, SupplierClaim } from "@/store/types";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
/** En el ambiente de pruebas el backend lo publica en /test/api/Reclamos */
const CLAIMS_ENDPOINT = import.meta.env.VITE_CLAIMS_ENDPOINT || '/api/Reclamos';

/**
 * El número visible (REC-000001) se calcula desde el DocEntry: este es el DocEntry
 * del primer reclamo oficial. Los anteriores (pruebas) se muestran con su DocEntry.
 */
const FIRST_CLAIM_DOC_ENTRY = parseInt(import.meta.env.VITE_CLAIMS_FIRST_DOC_ENTRY || '1', 10) || 1;

export const formatClaimNumber = (docEntry?: string | number | null): string => {
    const entry = Number(docEntry);
    if (!Number.isFinite(entry) || entry <= 0) return '';
    const sequence = entry - FIRST_CLAIM_DOC_ENTRY + 1;
    return sequence > 0 ? `REC-${String(sequence).padStart(6, '0')}` : `#${entry}`;
};

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

/** El backend responde HTTP 200 y el código real viene en status_code (404, 409, ...) */
interface ClaimsApiResponse<T> {
    status_code: number;
    success: boolean;
    message: string;
    data?: T;
}

export interface ClaimListFilters {
    ruc?: string;
    estado?: ClaimEstadoApi; // El backend no filtra por estado: se filtra aquí
    fechaInicio?: string; // YYYYMMDD
    fechaFin?: string; // YYYYMMDD
}

const toNumber = (value: unknown): number => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : 0;
};

const toOptionalNumber = (value: unknown): number | undefined =>
    value === null || value === undefined || value === '' ? undefined : toNumber(value);

const localDateString = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Fecha del API a "YYYY-MM-DD" para inputs y PDF. Llega como "2026-10-09",
 * "2026-10-07T09:03:00-05:00" o en UTC ("2026-10-09T18:00:22Z"); esta última se pasa a la fecha local.
 */
const toDateOnly = (value?: string | null): string => {
    if (!value) return '';
    const text = String(value);
    if (/Z$/i.test(text)) {
        const date = new Date(text);
        if (!Number.isNaN(date.getTime())) return localDateString(date);
    }
    return text.split('T')[0];
};

const mapProductFromApi = (raw: any): ClaimProduct => ({
    lineId: toOptionalNumber(raw.line_id),
    document: toNumber(raw.doc_entry_packing_list),
    // El backend publica el campo con tilde
    lineNumber: toNumber(raw['línea_packing_list'] ?? raw.linea_packing_list),
    itemCode: raw.codigo_articulo ?? '',
    itemName: raw.descripcion_articulo ?? '',
    cantidadRechazada: toNumber(raw.cantidad_rechazada),
    motivo: raw.motivo ?? '',
});

const mapActionFromApi = (raw: any): ClaimAction => ({
    lineId: toOptionalNumber(raw.line_id),
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
        numeroReclamo: formatClaimNumber(raw.doc_entry),
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
        // Los quitados quedan con estado "N"
        adjuntos: Array.isArray(raw.adjuntos)
            ? raw.adjuntos
                .filter((a: any) => a.estado !== 'N')
                .map((a: any): ClaimAttachment => ({
                    lineId: toOptionalNumber(a.line_id),
                    nameFile: a.nombre_archivo ?? '',
                    url: a.url ?? '',
                    fecha: toDateOnly(a.fecha),
                }))
            : [],
    };
};

/** Solo los adjuntos nuevos (en base64): los guardados el backend no los recibe por url. */
const mapNewAttachmentsToApi = async (adjuntos: ClaimAttachment[] = []) =>
    Promise.all(adjuntos.filter((a) => a.file).map(async (a) => ({
        nombre_archivo: a.nameFile,
        base64: await fileToBase64(a.file as globalThis.File),
        url: '',
        fecha: localDateString(new Date()),
        estado: 'Y',
    })));

/** Cabecera, secciones 1–2 y productos (lo que registra el área interna). */
const mapClaimToApi = (claim: SupplierClaim) => ({
    // El número visible sale del DocEntry (formatClaimNumber)
    numero_reclamo: '',
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
        ...(p.lineId != null ? { line_id: p.lineId } : {}),
        doc_entry_packing_list: String(p.document),
        'línea_packing_list': String(p.lineNumber),
        codigo_articulo: p.itemCode,
        descripcion_articulo: p.itemName,
        cantidad_rechazada: String(p.cantidadRechazada),
        motivo: p.motivo,
    })),
    datos_registro_inspeccion: claim.datosRegistroInspeccion ?? '',
    motivo_reclamo: claim.motivoReclamo,
    impacto: claim.impacto ?? '',
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
        ...(a.lineId != null ? { line_id: a.lineId } : {}),
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
        const errorText = await response.text().catch(() => '');
        throw new Error(`Error al ${action} (${response.status}): ${validationMessage(errorText) || errorText || 'Error desconocido'}`);
    }

    const json = (await response.json()) as ClaimsApiResponse<T>;
    if (json?.success) return json.data;
    // "No existe" en una consulta no es un error
    if (json?.status_code === 404 && (init.method ?? 'GET') === 'GET') return undefined;
    throw new Error(json?.message || `Error al ${action}`);
};

/** Errores de validación del modelo (HTTP 400): { title, errors: { campo: [mensajes] } } */
const validationMessage = (text: string): string => {
    try {
        const errors = JSON.parse(text)?.errors;
        return errors ? Object.values(errors).flat().join(' ') : '';
    } catch {
        return '';
    }
};

const claimUrl = (docEntry: string, suffix = '') =>
    `${DEFAULT_API_BASE_URL}${CLAIMS_ENDPOINT}/${encodeURIComponent(docEntry)}${suffix}`;

/**
 * Reclamo de una cita, o null si no tiene. El backend devuelve una lista (no impide
 * más de uno por cita): se toma el que sigue en curso o, si no, el más reciente.
 */
export const fetchClaimByCita = async (codCita: string): Promise<SupplierClaim | null> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, `${CLAIMS_ENDPOINT}/Cita`, { codCita });
    const data = await requestClaims<any>(url, { method: 'GET' }, 'consultar el reclamo de la cita');
    const claims = (Array.isArray(data) ? data : data ? [data] : [])
        .map(mapClaimFromApi)
        .sort((a, b) => Number(b.docEntry) - Number(a.docEntry));
    return claims.find((c) => c.status !== 'Cerrado') ?? claims[0] ?? null;
};

export const fetchClaim = async (docEntry: string): Promise<SupplierClaim | null> => {
    const data = await requestClaims<any>(claimUrl(docEntry), { method: 'GET' }, 'consultar el reclamo');
    return data ? mapClaimFromApi(data) : null;
};

/** Listado de reclamos (al proveedor se le envía su RUC). */
export const fetchClaims = async ({ estado, ruc, fechaInicio, fechaFin }: ClaimListFilters = {}): Promise<SupplierClaim[]> => {
    const params: Record<string, string> = { ruc: ruc ?? '' };
    if (fechaInicio) params.FechaInicio = fechaInicio;
    if (fechaFin) params.FechaFin = fechaFin;
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, CLAIMS_ENDPOINT, params);
    const data = await requestClaims<any[]>(url, { method: 'GET' }, 'consultar los reclamos');
    const claims = (Array.isArray(data) ? data : data ? [data] : []).map(mapClaimFromApi);
    return estado ? claims.filter((c) => c.status === STATUS_FROM_API[estado]) : claims;
};

/** Las escrituras no devuelven el reclamo completo: se vuelve a consultar. */
const refetch = async (claim: SupplierClaim): Promise<SupplierClaim> =>
    (claim.docEntry ? await fetchClaim(claim.docEntry) : await fetchClaimByCita(claim.codCita)) ?? claim;

/** Crea el reclamo; el backend envía el correo al proveedor. */
export const createClaim = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    const body = {
        ...mapClaimToApi({ ...claim, status: 'Abierto' }),
        adjuntos: await mapNewAttachmentsToApi(claim.adjuntos),
    };
    await requestClaims<any>(
        `${DEFAULT_API_BASE_URL}${CLAIMS_ENDPOINT}`,
        { method: 'POST', body: JSON.stringify(body) },
        'crear el reclamo'
    );
    // No devuelve el DocEntry: se toma el reclamo en curso de la cita
    return refetch({ ...claim, docEntry: undefined });
};

/**
 * Edita cabecera, secciones 1–2 y productos (solo en estado Abierto): con line_id se
 * actualizan y sin él se agregan. Solo se envían los adjuntos nuevos: los guardados
 * exigen base64 y, si no se envían, el backend los conserva.
 */
export const updateClaim = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    if (!claim.docEntry) throw new Error('El reclamo no tiene DocEntry');
    const body = { ...mapClaimToApi(claim), adjuntos: await mapNewAttachmentsToApi(claim.adjuntos) };
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, CLAIMS_ENDPOINT, { DocEntry: claim.docEntry });
    await requestClaims<any>(url, { method: 'PATCH', body: JSON.stringify(body) }, 'actualizar el reclamo');
    return refetch(claim);
};

/** Respuesta del proveedor (secciones 3–5); pasa a En Respuesta. */
export const saveClaimResponse = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    if (!claim.docEntry) throw new Error('El reclamo no tiene DocEntry');
    await requestClaims<any>(
        claimUrl(claim.docEntry, '/Respuesta'),
        { method: 'PATCH', body: JSON.stringify(mapResponseToApi(claim)) },
        'guardar la respuesta del reclamo'
    );
    return refetch(claim);
};

/** Cierre del reclamo por el área interna (sección 6); pasa a Cerrado. */
export const closeClaim = async (claim: SupplierClaim): Promise<SupplierClaim> => {
    if (!claim.docEntry) throw new Error('El reclamo no tiene DocEntry');
    await requestClaims<any>(
        claimUrl(claim.docEntry, '/Cierre'),
        { method: 'PATCH', body: JSON.stringify(mapClosureToApi(claim)) },
        'cerrar el reclamo'
    );
    return refetch(claim);
};

/** Junta productos nuevos con los del reclamo sin duplicar la misma línea con el mismo motivo. */
export const mergeClaimProducts = (current: ClaimProduct[], incoming: ClaimProduct[]): ClaimProduct[] => {
    const key = (p: ClaimProduct) => `${p.document}-${p.lineNumber}-${p.motivo.trim().toLowerCase()}`;
    const existing = new Set(current.map(key));
    return [...current, ...incoming.filter((p) => !existing.has(key(p)))];
};
