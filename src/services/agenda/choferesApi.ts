import { httpClient } from "@/services/http/httpClient";

const DEFAULT_API_BASE_URL = 'http://192.168.254.27:8082';
const CHOFERES_ENDPOINT = '/api/Documentos/Choferes';

/**
 * Interfaz para la petición de crear un chofer
 */
export interface CreateChoferRequest {
    u_EmpresaTranspote: string;
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
        u_EmpresaTranspote: choferData.u_EmpresaTranspote || '',
        u_NombreConductor: choferData.u_NombreConductor || '',
        u_LicenciaConducir: choferData.u_LicenciaConducir || '',
        u_PlacaVehiculo: choferData.u_PlacaVehiculo || '',
        u_TipoVehiculo: choferData.u_TipoVehiculo || '',
        u_TelefonoContacto: choferData.u_TelefonoContacto || '',
        u_HoraLlegada: choferData.u_HoraLlegada || '',
        u_Notas: choferData.u_Notas || '',
        u_CodCita: choferData.u_CodCita || ''
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
