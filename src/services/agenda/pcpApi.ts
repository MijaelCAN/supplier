import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PCP_VALIDATION_ENDPOINT = '/api/PCP/Validacion';
//const PCP_COVERAGE_ENDPOINT = '/api/PCP/Cobertura';

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
    cod_cita: string; // DocEntry de la cita
    packing_list_number?: string; // Número del PackingList (opcional, si se valida por PackingList)
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
 * Interfaz para obtener validaciones PCP de una cita
 */
export interface GetPCPValidationResponse {
    status_code: number;
    success: boolean;
    message: string;
    data?: PCPValidationRecord[];
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
    if (!request.cod_cita || request.cod_cita.trim() === '') {
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

    const url = `${DEFAULT_API_BASE_URL}${PCP_VALIDATION_ENDPOINT}`;

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
        cod_cita: codCita.trim(),
    };

    if (packingListNumber && packingListNumber.trim() !== '') {
        params['packing_list_number'] = packingListNumber.trim();
    }

    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PCP_VALIDATION_ENDPOINT, params);

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

    if (!json || !json.success) {
        return [];
    }

    return json.data || [];
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
    if (!request.cod_cita || request.cod_cita.trim() === '') {
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
