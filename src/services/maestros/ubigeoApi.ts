import { httpClient, buildSecureUrl } from "@/services/http/httpClient.ts";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_UBIGEO_API_BASE_URL = getApiBaseUrl();
const UBIGEO_ENDPOINT = '/api/Proveedores/Ubigeo';

export interface UbigeoRecord {
    code: string;
    u_syp_depa: string | null;
    u_syp_prov: string | null;
    u_syp_dist: string | null;
}

interface UbigeoApiResponse {
    status_code: number;
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
            record.u_syp_depa !== null &&
            record.u_syp_prov !== null &&
            record.u_syp_dist !== null
    );
};


