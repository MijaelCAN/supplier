import {Reception as ReceptionApi, ReceptionApiResponse} from "@/services/receptions/types.ts";
import {Reception} from "@/store/types.ts";
import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";

const nameBaseUrl = 'VITE_BASE_URL';

const normaliseString = (value?: string | null) => (value ?? '').trim();

const resolveEnv = (key: string): string | undefined => {
    if (key in import.meta.env && typeof import.meta.env[key] === 'string') {
        return import.meta.env[key];
    }
    return undefined;
}

const buildEndpointUrlReception = (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): string => {
    const BASE_URL = normaliseString(resolveEnv(nameBaseUrl));
    const ENDPOINT = resolveEnv('VITE_RECEPTION_ENDPOINT') || '/api/Documentos/Recepcion';
    
    const params: Record<string, string> = {};
    if (state && state.trim() !== '') params['Estado'] = state.trim();
    if (cardCode && cardCode.trim() !== '') params['cardCode'] = cardCode.trim();
    if (startDate && startDate.trim() !== '') params['FechaInicio'] = startDate;
    if (endDate && endDate.trim() !== '') params['FechaFin'] = endDate;

    return buildSecureUrl(BASE_URL, ENDPOINT, params);
}

const handleResponse = async (response: Response): Promise<ReceptionApiResponse> => {
    if (!response.ok) throw new Error(`Error al consultar las recepciones: ${response.statusText}`);
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`No se pudo parsear el Json de Recepciones`);
    }
}

const fetchReceptionResponse = async (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
    init?: ResponseInit,
): Promise<ReceptionApiResponse> => {
    const response = await httpClient(buildEndpointUrlReception(cardCode, state, startDate, endDate), {
        headers: {},
        ...init
    })

    return handleResponse(response)
}

const mapRecordReceptionToReception = (record: ReceptionApi): Reception => {
    const parseAmount = (value: string) => parseFloat((value || "0").replace(",", ".")) || 0;
    const parseDate = (dateStr: string) => dateStr || "";
    
    const total = parseAmount(record.Total);

    // Mapear detalle
    const detalle = record.Detalle?.map(item => ({
        docEntry: item.DocEntry?.toString() || '',
        description: item.Dscription || '',
        itemCode: item.ItemCode || '',
        lineTotal: parseAmount(item.LineTotal),
        quantity: parseAmount(item.Quantity)
    })) || [];

    return {
        id: record.DocEntry?.toString() || '',
        docEntry: record.DocEntry?.toString() || '',
        supplierId: record.CardCode || '',
        supplierName: record.CardName || '',
        addressDestination: record.Direccion_Destino || '',
        addressBilling: record.Direccion_Facturacion || '',
        docDate: parseDate(record.DocDate),
        currency: record.DocCur === 'S/' ? 'PEN' : 'USD',
        total: total,
        detalle: detalle.length > 0 ? detalle : undefined,
    }
}

export const fetchReceptionsByCardCode = async (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): Promise<Reception[] | null> => {
    const json = await fetchReceptionResponse(cardCode, state, startDate, endDate);
    console.log("JSON RECEPTIONS CONSUMIDO: ", json);
    const records = Array.isArray(json.data) ? json.data : [json.data];
    if (!records || records.length === 0) return null;

    return records.map(record => mapRecordReceptionToReception(record));
}









