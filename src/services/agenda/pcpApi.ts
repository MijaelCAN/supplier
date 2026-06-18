import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PCP_VALIDATION_ENDPOINT = '/api/PCP/Validacion';
const PCP_COVERAGE_ENDPOINT = '/api/ValidacionPCP/ObtenerValidacion';
const PCP_POST_VALIDACION = '/api/ValidacionPCP';

/**
 * Interfaz para un item de validación PCP
 */
export interface PCPValidationItem {
    item_code: string; // Código del item/producto
    item_name?: string; // Nombre del item (opcional, para referencia)
    confirmacion_pcp: 'CONFORME' | 'NO_CONFORME'; // Confirmación PCP
    cobertura_actual?: number; // Cobertura actual en meses (opcional)
    cobertura_con_ingresos?: number; // Cobertura con ingresos en meses (opcional)
    comentario?: string; // Comentario PCP (opcional)
    line_number?: number; // Número de línea del item en el PackingList (opcional)
    document?: number; // Número de documento de la OC (opcional)
}

/**
 * Interfaz para la petición de validación PCP
 */
export interface PCPValidationRequest {
    CodigoCita: string; // DocEntry de la cita
    NumeroPackingList?: string; // Número del PackingList (opcional, si se valida por PackingList)
    items: PCPValidationItem[]; // Array de items a validar
    validado_por?: string; // Usuario que valida (opcional, se puede obtener del token)
    fecha_validacion?: string; // Fecha de validación (opcional, se puede usar fecha actual)
}

/**
 * Interfaz para la respuesta de validación PCP
 */
export interface PCPValidationResponse {
    status_code: number;
    success: boolean;
    message: string;
    data?: {
        cod_cita: string;
        packing_list_number?: string;
        items_validados: number;
        fecha_validacion: string;
        validado_por: string;
    };
}

/**
 * Interfaz para obtener cobertura de un item
 */
export interface CoverageRequest {
    item_code: string; // Código del item
    warehouse?: string; // Almacén (opcional)
    fecha_consulta?: string; // Fecha de consulta (opcional, por defecto hoy)
}

/**
 * Interfaz para la respuesta de cobertura
 */
export interface CoverageResponse {
    status_code: number;
    success: boolean;
    message: string;
    data?: {
        item_code: string;
        item_name?: string;
        warehouse?: string;
        cobertura_actual: number; // Meses de cobertura actual
        cobertura_con_ingresos: number; // Meses de cobertura con ingresos programados
        stock_actual?: number; // Stock actual (opcional)
        consumo_promedio_mensual?: number; // Consumo promedio mensual (opcional)
        unidades?: string; // Unidad de medida (opcional)
        fecha_consulta: string;
    };
}

/**
 * Interfaz para obtener validaciones PCP existentes
 */
export interface PCPValidationRecord {
    cod_cita: string;
    packing_list_number?: string;
    item_code: string;
    item_name?: string;
    confirmacion_pcp: 'CONFORME' | 'NO_CONFORME';
    cobertura_actual?: number;
    cobertura_con_ingresos?: number;
    comentario?: string;
    validado_por?: string;
    fecha_validacion?: string;
    line_number?: number;
    document?: number;
}

/**
 * Interfaz para la respuesta del API de validación PCP (estructura raw del API)
 */
interface ValidacionPCPGetResponseDataRaw {
    codigo_cita: string;
    numero_de_packing_list: string;
    validado_por: string;
    fecha_de_validacion: string;
    codigo_de_producto: string;
    nombre_de_producto: string;
    numero_de_linea: string;
    documento: string;
    confirmacion_pcp: string;
    cobertura_actual: string;
    cobertura_ingreso: string;
    comentario: string;
}

/**
 * Interfaz para obtener validaciones PCP de una cita
 * Nota: El API puede retornar un objeto único o un array
 */
export interface GetPCPValidationResponse {
    status_code: number;
    success: boolean;
    message: string;
    data?: ValidacionPCPGetResponseDataRaw | ValidacionPCPGetResponseDataRaw[] | PCPValidationRecord[];
}

/**
 * Valida items de una cita (PCP)
 * 
 * @param request - Datos de validación PCP
 * @returns Respuesta de validación
 * 
 * @example
 * ```typescript
 * const response = await validatePCPItems({
 *   cod_cita: "12345",
 *   items: [
 *     {
 *       item_code: "ITEM001",
 *       confirmacion_pcp: "CONFORME",
 *       cobertura_actual: 2.5,
 *       cobertura_con_ingresos: 3.2,
 *       comentario: "Código nuevo"
 *     }
 *   ]
 * });
 * ```
 */
export const validatePCPItems = async (
    request: PCPValidationRequest
): Promise<PCPValidationResponse> => {
    if (!request.CodigoCita || request.CodigoCita.trim() === '') {
        throw new Error('El código de cita es requerido');
    }

    if (!request.items || request.items.length === 0) {
        throw new Error('Debe proporcionar al menos un item para validar');
    }

    // Agregar fecha y usuario si no vienen
    const requestBody: PCPValidationRequest = {
        ...request,
        fecha_validacion: request.fecha_validacion || new Date().toISOString(),
    };

    const url = `${DEFAULT_API_BASE_URL}${PCP_POST_VALIDACION}`;

    const response = await httpClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al validar items PCP (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as PCPValidationResponse;

    if (!json || !json.success) {
        throw new Error(json.message || 'Error al validar items PCP');
    }

    return json;
};

/**
 * Mapea la respuesta raw del API a PCPValidationRecord
 */
const mapValidacionPCPToRecord = (raw: ValidacionPCPGetResponseDataRaw): PCPValidationRecord => {
    return {
        cod_cita: raw.codigo_cita,
        packing_list_number: raw.numero_de_packing_list,
        item_code: raw.codigo_de_producto,
        item_name: raw.nombre_de_producto,
        confirmacion_pcp: raw.confirmacion_pcp as 'CONFORME' | 'NO_CONFORME',
        cobertura_actual: raw.cobertura_actual ? parseFloat(raw.cobertura_actual) : undefined,
        cobertura_con_ingresos: raw.cobertura_ingreso ? parseFloat(raw.cobertura_ingreso) : undefined,
        comentario: raw.comentario || undefined,
        validado_por: raw.validado_por,
        fecha_validacion: raw.fecha_de_validacion,
        line_number: raw.numero_de_linea ? parseInt(raw.numero_de_linea, 10) : undefined,
        document: raw.documento ? parseInt(raw.documento, 10) : undefined,
    };
};

/**
 * Obtiene las validaciones PCP de una cita
 * 
 * @param codCita - Código de la cita (DocEntry)
 * @param packingListNumber - Número del PackingList (opcional)
 * @returns Array de validaciones PCP
 * 
 * @example
 * ```typescript
 * const validations = await getPCPValidations("12345");
 * ```
 */
export const getPCPValidations = async (
    codCita: string,
    packingListNumber?: string
): Promise<PCPValidationRecord[]> => {
    if (!codCita || codCita.trim() === '') {
        throw new Error('El código de cita es requerido');
    }

    const params: Record<string, string> = {
        CodigoCita: codCita.trim(),
    };

    if (packingListNumber && packingListNumber.trim() !== '') {
        params['NumeroPackingList'] = packingListNumber.trim();
    }

    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PCP_COVERAGE_ENDPOINT, params);

    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            return []; // No hay validaciones
        }
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al obtener validaciones PCP (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as GetPCPValidationResponse;

    if (!json || !json.success || !json.data) {
        return [];
    }

    // El API puede retornar un objeto único o un array
    const data = json.data;

    // Si ya es un array de PCPValidationRecord (formato antiguo), retornarlo directamente
    if (Array.isArray(data)) {
        // Verificar si el primer elemento ya está en formato PCPValidationRecord
        if (data.length > 0 && 'item_code' in data[0]) {
            return data as PCPValidationRecord[];
        }
        // Si es array de objetos raw, mapear cada uno
        // TypeScript necesita que seamos explícitos sobre el tipo
        const rawData = data as ValidacionPCPGetResponseDataRaw[];
        return rawData.map(mapValidacionPCPToRecord);
    }

    // Si es un objeto único, convertirlo a array
    return [mapValidacionPCPToRecord(data as ValidacionPCPGetResponseDataRaw)];
};

/**
 * Actualiza una validación PCP existente
 * 
 * @param request - Datos de validación PCP actualizados
 * @returns Respuesta de actualización
 */
export const updatePCPValidation = async (
    request: PCPValidationRequest
): Promise<PCPValidationResponse> => {
    if (!request.CodigoCita || request.CodigoCita.trim() === '') {
        throw new Error('El código de cita es requerido');
    }

    if (!request.items || request.items.length === 0) {
        throw new Error('Debe proporcionar al menos un item para actualizar');
    }

    const requestBody: PCPValidationRequest = {
        ...request,
        fecha_validacion: request.fecha_validacion || new Date().toISOString(),
    };

    const url = `${DEFAULT_API_BASE_URL}${PCP_VALIDATION_ENDPOINT}`;

    const response = await httpClient(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al actualizar validación PCP (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as PCPValidationResponse;

    if (!json || !json.success) {
        throw new Error(json.message || 'Error al actualizar validación PCP');
    }

    return json;
};
