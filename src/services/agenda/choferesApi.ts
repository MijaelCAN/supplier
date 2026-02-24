import { httpClient } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const CHOFERES_ENDPOINT = '/api/Documentos/Choferes';

/**
 * Interfaz para la petición de crear un chofer
 */
export interface CreateChoferRequest {
    u_empresa_transporte: string;
    u_nombre_conductor: string;
    u_licencia_conducir: string;
    u_placa_vehiculo: string;
    u_tipo_vehiculo: string;
    u_telefono_contacto: string;
    u_hora_llegada: string;
    u_notas: string;
    u_cod_cita: string;
}

/**
 * Interfaz para la respuesta al crear un chofer
 */
export interface CreateChoferResponse {
    u_EmpresaTransporte: string;
    u_NombreConductor: string;
    u_LicenciaConducir: string;
    u_PlacaVehiculo: string;
    u_TipoVehiculo: string;
    u_TelefonoContacto: string;
    u_HoraLlegada: string;
    u_Notas: string;
    u_CodCita: string;
}

/**
 * Interfaz para la respuesta del API
 */
interface ChoferApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: null;
}

/**
 * Crea un nuevo chofer en el API
 * @param choferData - Datos del chofer a crear
 * @returns Promise que se resuelve cuando el chofer se crea exitosamente
 */
export const createChoferInApi = async (
    choferData: CreateChoferRequest
): Promise<void> => {
    const url = `${DEFAULT_API_BASE_URL}${CHOFERES_ENDPOINT}`;
    
    // Preparar el request body
    const requestBody: CreateChoferRequest = {
        u_empresa_transporte: choferData.u_empresa_transporte || '',
        u_nombre_conductor: choferData.u_nombre_conductor || '',
        u_licencia_conducir: choferData.u_licencia_conducir || '',
        u_placa_vehiculo: choferData.u_placa_vehiculo || '',
        u_tipo_vehiculo: choferData.u_tipo_vehiculo || '',
        u_telefono_contacto: choferData.u_telefono_contacto || '',
        u_hora_llegada: choferData.u_hora_llegada || '',
        u_notas: choferData.u_notas || '',
        u_cod_cita: choferData.u_cod_cita || ''
    };
    
    const response = await httpClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    console.log("DCR-RESPONSE", response);
    
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al crear chofer (${response.status}): ${errorText}`);
    }
    
    const json = (await response.json()) as ChoferApiResponse;
    
    // Validar que la respuesta tenga la estructura esperada
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de choferes inválida.');
    }
    
    // Validar que la operación fue exitosa
    if (!json.success || (json.status_code !== 200 && json.status_code !== 201)) {
        throw new Error(json.message || 'Error al crear el chofer');
    }
    
    // La respuesta es exitosa, no hay datos que retornar (data es null)
    return;
};
