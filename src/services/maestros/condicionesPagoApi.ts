// src/services/maestros/condicionesPagoApi.ts

import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";
import { getApiBaseUrl } from "@/config/api.ts";

export interface CondicionPago {
    group_num: string;
    pymnt_group: string;
}

interface CondicionesPagoApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: CondicionPago[];
}

const BASE_URL = getApiBaseUrl();

/**
 * Obtiene todas las condiciones de pago desde el API
 */
export const fetchCondicionesPago = async (): Promise<CondicionPago[]> => {
    try {
        const url = buildSecureUrl(BASE_URL, '/api/Maestros/CondicionPago');
        const response = await httpClient(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener condiciones de pago: ${response.status} ${response.statusText}`);
        }

        const result: CondicionesPagoApiResponse = await response.json();

        if (result.status_code !== 200) {
            throw new Error(result.message || 'Error al obtener condiciones de pago');
        }

        return result.data || [];
    } catch (error) {
        console.error('Error al obtener condiciones de pago:', error);
        throw error;
    }
};

/**
 * Obtiene la descripción de una condición de pago por su código
 */
export const getCondicionPagoDescripcion = async (codigo: string): Promise<string | null> => {
    try {
        const condiciones = await fetchCondicionesPago();
        const condicion = condiciones.find(c => c.group_num === codigo);
        return condicion?.pymnt_group || null;
    } catch (error) {
        console.error('Error al obtener descripción de condición de pago:', error);
        return null;
    }
};

