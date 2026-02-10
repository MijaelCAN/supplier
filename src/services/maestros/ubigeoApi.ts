import { httpClient, buildSecureUrl } from "@/services/http/httpClient.ts";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_UBIGEO_API_BASE_URL = getApiBaseUrl();
const UBIGEO_ENDPOINT = '/api/Proveedores/Ubigeo';

export interface UbigeoRecord {
    Code: string;
    U_SYP_DEPA: string | null;
    U_SYP_PROV: string | null;
    U_SYP_DIST: string | null;
}

interface UbigeoApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: UbigeoRecord[];
}

/**
 * Obtiene la lista de ubigeos desde el API
 */
export const fetchUbigeos = async (): Promise<UbigeoRecord[]> => {
    const url = buildSecureUrl(DEFAULT_UBIGEO_API_BASE_URL, UBIGEO_ENDPOINT);
    
    const response = await httpClient(url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Error al consultar ubigeos (${response.status})`);
    }

    const json = (await response.json()) as UbigeoApiResponse;
    
    if (!json || !Array.isArray(json.data)) {
        throw new Error('Respuesta del servicio de ubigeos inválida.');
    }

    // Filtrar solo los registros que tienen valores válidos (no null)
    return json.data.filter(
        (record) => 
            record.U_SYP_DEPA !== null && 
            record.U_SYP_PROV !== null && 
            record.U_SYP_DIST !== null
    );
};


