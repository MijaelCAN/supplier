// Servicio para consultar la lista negra de proveedores (SSCO)
import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";
import {getApiBaseUrl} from "@/config/api.ts";

export interface BlackListRecord {
    U_Ruc: string;
    U_RazonSocial: string;
    U_ResolucionAtribSSCO: string;
    U_FechaEmiResolAtrib: string;
    U_FechaResolucionAtribuFirm: string;
    U_Ruc_DNI: string;
    U_NombreCompleto: string;
    U_FechaPublicacion: string;
    U_MotivoListaNegra: string;
    U_DomicilioFiscal: string;
}

interface BlackListApiResponse {
    status_code: number;
    message: string;
    data: BlackListRecord | BlackListRecord[];
}

const buildBlackListUrl = (ruc?: string): string => {
    const BASE_URL = getApiBaseUrl();
    const ENDPOINT = '/api/Proveedores/BlackList';
    
    const params: Record<string, string> = {};
    if (ruc && ruc.trim() !== '') {
        params['Ruc'] = ruc.trim();
    }
    
    return buildSecureUrl(BASE_URL, ENDPOINT, params);
}

const handleResponse = async (response: Response): Promise<BlackListApiResponse> => {
    if (!response.ok) {
        throw new Error(`Error al consultar la lista negra: ${response.statusText}`);
    }
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`No se pudo parsear el JSON de la lista negra`);
    }
}

/**
 * Consulta la lista negra de proveedores (SSCO)
 * @param ruc - RUC opcional para consultar un proveedor específico
 * @returns Array de registros de la lista negra, o null si no hay resultados
 */
export const fetchBlackList = async (ruc?: string): Promise<BlackListRecord[] | null> => {
    try {
        const url = buildBlackListUrl(ruc);
        const response = await httpClient(url, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const json = await handleResponse(response);
        
        // Normalizar la respuesta: puede venir como objeto único o array
        let records: BlackListRecord[] = [];
        
        if (Array.isArray(json.data)) {
            records = json.data;
        } else if (json.data && typeof json.data === 'object') {
            records = [json.data];
        }

        return records.length > 0 ? records : null;
    } catch (error) {
        console.error('Error al consultar la lista negra:', error);
        throw error;
    }
}

/**
 * Verifica si un RUC está en la lista negra
 * @param ruc - RUC a verificar
 * @returns true si el RUC está en la lista negra, false en caso contrario
 */
export const checkRucInBlackList = async (ruc: string): Promise<boolean> => {
    if (!ruc || ruc.trim().length !== 11) {
        return false;
    }

    try {
        const records = await fetchBlackList(ruc);
        return records !== null && records.length > 0;
    } catch (error) {
        console.error('Error al verificar RUC en lista negra:', error);
        // En caso de error, retornar false para no bloquear el flujo
        return false;
    }
}

/**
 * Obtiene los detalles de un RUC en la lista negra
 * @param ruc - RUC a consultar
 * @returns Registro de la lista negra o null si no está en la lista
 */
export const getBlackListRecord = async (ruc: string): Promise<BlackListRecord | null> => {
    if (!ruc || ruc.trim().length !== 11) {
        return null;
    }

    try {
        const records = await fetchBlackList(ruc);
        return records && records.length > 0 ? records[0] : null;
    } catch (error) {
        console.error('Error al obtener registro de lista negra:', error);
        return null;
    }
}

