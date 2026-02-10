import { httpClient } from "@/services/http/httpClient";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const CHOFERES_ENDPOINT = '/api/Documentos/Choferes';

/**
 * Interfaz para la petición de crear un chofer
 */
export interface CreateChoferRequest {
    U_EmpresaTransporte: string;
    U_NombreConductor: string;
    U_LicenciaConducir: string;
    U_PlacaVehiculo: string;
    U_TipoVehiculo: string;
    U_TelefonoContacto: string;
    U_HoraLlegada: string;
    U_Notas: string;
    U_CodCita: string;
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
    statusCode: number;
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
        U_EmpresaTransporte: choferData.U_EmpresaTransporte || '',
        U_NombreConductor: choferData.U_NombreConductor || '',
        U_LicenciaConducir: choferData.U_LicenciaConducir || '',
        U_PlacaVehiculo: choferData.U_PlacaVehiculo || '',
        U_TipoVehiculo: choferData.U_TipoVehiculo || '',
        U_TelefonoContacto: choferData.U_TelefonoContacto || '',
        U_HoraLlegada: choferData.U_HoraLlegada || '',
        U_Notas: choferData.U_Notas || '',
        U_CodCita: choferData.U_CodCita || ''
    };
    
    const response = await httpClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });
    
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
    if (!json.success || (json.statusCode !== 200 && json.statusCode !== 201)) {
        throw new Error(json.message || 'Error al crear el chofer');
    }
    
    // La respuesta es exitosa, no hay datos que retornar (data es null)
    return;
};
