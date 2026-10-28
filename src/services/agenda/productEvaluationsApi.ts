// src/services/agenda/productEvaluationsApi.ts
// Evaluación por producto de Calidad y Almacén (OBS-008, parte 1).
import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";
import { fetchPackingListFromApi } from "./packingListApi";
import { formatDateForAPI } from "./appointmentsApi";
import { AppointmentStatus } from "@/store/types";
import { PACKING_LIST_DECIMALS } from "@/utils/packingList";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PRODUCT_EVALUATIONS_ENDPOINT = '/api/Evaluacion/Productos';

/**
 * Interruptor de la evaluación por producto (/api/Evaluacion/Productos).
 * Apagado: Calidad y Almacén evalúan la cita completa como antes.
 */
export const PRODUCT_EVALUATION_ENABLED = import.meta.env.VITE_ENABLE_PRODUCT_EVALUATION === 'true';

export type ProductEvaluationArea = 'CALIDAD' | 'ALMACEN';

/** OBSERVADO = aprobado por concesión; PARCIAL = parte de la cantidad rechazada. */
export type ProductEvaluationEstado = 'ACEPTADO' | 'OBSERVADO' | 'PARCIAL' | 'RECHAZADO';

/** Lo que elige el usuario por línea; PARCIAL se deriva de la cantidad rechazada. */
export type ProductEvaluationDecision = 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO';

export interface ProductAreaEvaluation {
    estado: ProductEvaluationEstado;
    cantidad_aceptada: number;
    cantidad_rechazada: number;
    motivo: string;
    usuario?: string;
    fecha?: string;
}

export interface ProductEvaluationLine {
    document: number;
    line_number: number;
    item_code: string;
    item_name: string;
    cantidad: number;
    calidad: ProductAreaEvaluation | null;
    almacen: ProductAreaEvaluation | null;
}

export interface ProductEvaluationLineRequest {
    document: number;
    line_number: number;
    item_code: string;
    estado: ProductEvaluationEstado;
    cantidad_aceptada: number;
    cantidad_rechazada: number;
    motivo: string;
}

interface ProductEvaluationApiResponse<T> {
    status_code: number;
    success: boolean;
    message: string;
    data?: T;
}

const toNumber = (value: unknown): number => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : 0;
};

export const roundEvaluationQuantity = (value: number): number => {
    const factor = 10 ** PACKING_LIST_DECIMALS;
    return Math.round(value * factor) / factor;
};

const mapAreaEvaluation = (raw: any): ProductAreaEvaluation | null => {
    if (!raw) return null;
    return {
        estado: raw.estado,
        cantidad_aceptada: toNumber(raw.cantidad_aceptada),
        cantidad_rechazada: toNumber(raw.cantidad_rechazada),
        motivo: raw.motivo ?? '',
        usuario: raw.usuario,
        fecha: raw.fecha,
    };
};

/** Clave única de una línea de PackingList dentro de la cita. */
export const getProductLineKey = (line: Pick<ProductEvaluationLine, 'document' | 'line_number'>): string =>
    `${line.document}-${line.line_number}`;

/** Evaluaciones guardadas de la cita: una por producto y área ({codigo_producto, area, estado, ...}). */
const fetchSavedEvaluations = async (codCita: string): Promise<any[]> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PRODUCT_EVALUATIONS_ENDPOINT, { codCita });

    const response = await httpClient(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al consultar la evaluación por producto (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as ProductEvaluationApiResponse<any>;
    if (!json || !json.success) {
        throw new Error(json?.message || 'Error al consultar la evaluación por producto');
    }

    // Con un solo registro el API devuelve un objeto en vez de una lista
    return Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
};

/** Rango de búsqueda de los PackingList de la cita (el API exige fechas). */
const PACKING_LIST_LOOKUP_DAYS = 365;

/**
 * Productos de la cita (de sus PackingList) con lo que ya evaluó cada área.
 * El API guarda una evaluación por producto y área, así que un producto que viene en
 * varios PackingList de la cita se evalúa una sola vez con la cantidad sumada.
 */
export const fetchProductEvaluations = async (codCita: string): Promise<ProductEvaluationLine[]> => {
    const start = new Date();
    start.setDate(start.getDate() - PACKING_LIST_LOOKUP_DAYS);
    const end = new Date();
    end.setDate(end.getDate() + PACKING_LIST_LOOKUP_DAYS);

    const [packingLists, saved] = await Promise.all([
        fetchPackingListFromApi(formatDateForAPI(start), formatDateForAPI(end), codCita),
        fetchSavedEvaluations(codCita),
    ]);

    const lines = new Map<string, ProductEvaluationLine>();
    packingLists
        .flatMap((pl) => pl.detalle_packin_list || pl.DetallePackinList || [])
        .forEach((item) => {
            const itemCode = item.item_code || '';
            if (!itemCode) return;
            const existing = lines.get(itemCode);
            if (existing) {
                existing.cantidad = roundEvaluationQuantity(existing.cantidad + toNumber(item.quantity));
                return;
            }
            // El API de PackinList manda el DocEntry del PackingList como id_document (no document)
            lines.set(itemCode, {
                document: toNumber(item.document ?? item.id_document),
                line_number: toNumber(item.line_number),
                item_code: itemCode,
                item_name: item.item_name || '',
                cantidad: toNumber(item.quantity),
                calidad: null,
                almacen: null,
            });
        });

    saved.forEach((raw) => {
        const line = lines.get(String(raw.codigo_producto ?? ''));
        if (!line) return;
        const area = String(raw.area ?? '').toUpperCase();
        if (area === 'CALIDAD') line.calidad = mapAreaEvaluation(raw);
        else if (area === 'ALMACEN') line.almacen = mapAreaEvaluation(raw);
    });

    return Array.from(lines.values());
};

/** Fecha y hora local en ISO con zona ("2026-10-14T09:46:10-05:00"). */
const nowWithOffset = (): string => {
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const zone = `${sign}${pad2(Math.floor(Math.abs(offset) / 60))}:${pad2(Math.abs(offset) % 60)}`;
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
        + `T${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}${zone}`;
};

/**
 * Guarda la evaluación por producto de un área: el API recibe un objeto por producto,
 * con todos los valores como texto.
 */
export const saveProductEvaluations = async (
    codCita: string,
    area: ProductEvaluationArea,
    usuario: string,
    lineas: ProductEvaluationLineRequest[]
): Promise<void> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PRODUCT_EVALUATIONS_ENDPOINT);
    const fecha = nowWithOffset();

    for (const linea of lineas) {
        const response = await httpClient(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cod_producto: linea.item_code,
                cod_cita: String(codCita),
                cantidad: String(roundEvaluationQuantity(linea.cantidad_aceptada + linea.cantidad_rechazada)),
                usuario,
                area,
                estado: linea.estado,
                cantidad_aceptada: String(linea.cantidad_aceptada),
                cantidad_rechazada: String(linea.cantidad_rechazada),
                motivo: linea.motivo,
                fecha,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Error desconocido');
            throw new Error(`Error al guardar la evaluación de ${linea.item_code} (${response.status}): ${errorText}`);
        }

        const json = (await response.json()) as ProductEvaluationApiResponse<unknown>;
        if (!json || !json.success) {
            throw new Error(json?.message || `Error al guardar la evaluación de ${linea.item_code}`);
        }
    }

    // El API responde éxito aunque no guarde (p. ej. con cantidades decimales o si el producto
    // ya estaba evaluado): se relee para no cambiar el estado de la cita con datos que no quedaron.
    const saved = await fetchSavedEvaluations(codCita);
    const notSaved = lineas.filter((linea) => !saved.some((raw) =>
        String(raw.codigo_producto) === linea.item_code
        && String(raw.area ?? '').toUpperCase() === area
        && raw.estado === linea.estado
        && toNumber(raw.cantidad_aceptada) === linea.cantidad_aceptada
        && toNumber(raw.cantidad_rechazada) === linea.cantidad_rechazada
    ));
    if (notSaved.length > 0) {
        throw new Error(
            `El servidor no registró la evaluación de: ${notSaved.map((l) => l.item_code).join(', ')}. `
            + 'Revise que las cantidades sean enteras o comuníquese con Sistemas.'
        );
    }
};

/**
 * Cantidad sobre la que evalúa cada área: Calidad sobre lo del PackingList,
 * Almacén solo sobre lo que aceptó Calidad.
 */
export const getEvaluationBaseQuantity = (line: ProductEvaluationLine, area: ProductEvaluationArea): number =>
    area === 'CALIDAD' ? line.cantidad : (line.calidad?.cantidad_aceptada ?? line.cantidad);

/** Estado a guardar de una línea según lo elegido y la cantidad rechazada. */
export const deriveLineEstado = (
    decision: ProductEvaluationDecision,
    baseQuantity: number,
    rejectedQuantity: number
): ProductEvaluationEstado => {
    if (decision !== 'RECHAZADO') return decision;
    return rejectedQuantity >= baseQuantity ? 'RECHAZADO' : 'PARCIAL';
};

/**
 * Estado de la cita según las líneas evaluadas por el área:
 * todo rechazado → *_RECHAZADO; mezcla de aceptado y rechazado → *_PARCIAL (sigue al Parte de Ingreso
 * con lo aceptado); sin rechazos → *_OBSERVADO si hubo concesión, si no *_ACEPTADO.
 */
export const deriveAppointmentStatusFromLines = (
    area: ProductEvaluationArea,
    lines: ProductEvaluationLineRequest[]
): AppointmentStatus => {
    const totalAccepted = lines.reduce((sum, line) => sum + line.cantidad_aceptada, 0);
    const totalRejected = lines.reduce((sum, line) => sum + line.cantidad_rechazada, 0);

    let result: 'ACEPTADO' | 'OBSERVADO' | 'PARCIAL' | 'RECHAZADO';
    if (totalAccepted <= 0) result = 'RECHAZADO';
    else if (totalRejected > 0) result = 'PARCIAL';
    else if (lines.some((line) => line.estado === 'OBSERVADO')) result = 'OBSERVADO';
    else result = 'ACEPTADO';

    return `${area}_${result}` as AppointmentStatus;
};

/**
 * Calificación del criterio (Estado de mercadería / Cantidad correcta) a partir de las líneas.
 * - Calidad: promedio ponderado por cantidad con la escala actual (aceptado 10, concesión 7, rechazado 2).
 * - Almacén: el criterio sigue siendo binario (10 = todo conforme, 0 = hubo cantidad rechazada).
 * Pendiente de confirmar con el negocio (OBS-008).
 */
export const computeCriterionScore = (
    area: ProductEvaluationArea,
    lines: ProductEvaluationLineRequest[]
): number => {
    const totalRejected = lines.reduce((sum, line) => sum + line.cantidad_rechazada, 0);
    if (area === 'ALMACEN') return totalRejected > 0 ? 0 : 10;

    const totalQuantity = lines.reduce((sum, line) => sum + line.cantidad_aceptada + line.cantidad_rechazada, 0);
    if (totalQuantity <= 0) return 0;

    const weighted = lines.reduce((sum, line) => {
        const acceptedScore = line.estado === 'OBSERVADO' ? 7 : 10;
        return sum + line.cantidad_aceptada * acceptedScore + line.cantidad_rechazada * 2;
    }, 0);
    return roundEvaluationQuantity(weighted / totalQuantity);
};
