// src/services/agenda/productEvaluationsApi.ts
// Evaluación por producto de Calidad y Almacén (OBS-008, parte 1).
import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";
import { AppointmentStatus } from "@/store/types";
import { PACKING_LIST_DECIMALS } from "@/utils/packingList";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PRODUCT_EVALUATIONS_ENDPOINT = '/api/Evaluacion/Productos';

/**
 * Interruptor mientras el backend no publique /api/Evaluacion/Productos.
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

/**
 * Obtiene las líneas del PackingList de la cita con su evaluación por área.
 */
export const fetchProductEvaluations = async (codCita: string): Promise<ProductEvaluationLine[]> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PRODUCT_EVALUATIONS_ENDPOINT, { codCita });

    const response = await httpClient(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al consultar la evaluación por producto (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as ProductEvaluationApiResponse<any[]>;
    if (!json || !json.success) {
        throw new Error(json?.message || 'Error al consultar la evaluación por producto');
    }

    const records = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
    return records.map((raw) => ({
        document: toNumber(raw.document),
        line_number: toNumber(raw.line_number),
        item_code: raw.item_code ?? '',
        item_name: raw.item_name ?? '',
        cantidad: toNumber(raw.cantidad),
        calidad: mapAreaEvaluation(raw.calidad),
        almacen: mapAreaEvaluation(raw.almacen),
    }));
};

/**
 * Guarda la evaluación por producto de un área.
 */
export const saveProductEvaluations = async (
    codCita: string,
    area: ProductEvaluationArea,
    usuario: string,
    lineas: ProductEvaluationLineRequest[]
): Promise<void> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PRODUCT_EVALUATIONS_ENDPOINT, { codCita });

    const response = await httpClient(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, usuario, lineas }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al guardar la evaluación por producto (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as ProductEvaluationApiResponse<unknown>;
    if (!json || !json.success) {
        throw new Error(json?.message || 'Error al guardar la evaluación por producto');
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
