import {OrderItem, PurchaseOrder} from "@/store/types.ts";
import {Order, OrderItem as ItemsApi, OrdersApiResponse} from "@/services/orders/types.ts";
import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";

const nameBaseUrl = 'VITE_BASE_URL';
const nameEnpoint = 'VITE_ORDER_ENDPOINT';

const normaliseString = (value?: string | null) => (value ?? '').trim();

const resolveEnv = (key: string): string | undefined => {
    if (key in import.meta.env && typeof import.meta.env[key] === 'string') {
        return import.meta.env[key];
    }
    return undefined;
}

const buildEnpointUrlOrder = (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): string => {
    const BASE_URL = normaliseString(resolveEnv(nameBaseUrl));
    const ENDPOINT = resolveEnv(nameEnpoint) || '/api/Documentos/OrdenCompra';
    
    const params: Record<string, string> = {};
    if (state && state.trim() !== '') params['Estado'] = state.trim();
    if (cardCode && cardCode.trim() !== '') params['CardCode'] = cardCode.trim();
    if (startDate && startDate.trim() !== '') params['FechaInicio'] = startDate;
    if (endDate && endDate.trim() !== '') params['FechaFin'] = endDate;

    return buildSecureUrl(BASE_URL, ENDPOINT, params);
}

const handleResponse = async (response: Response): Promise<OrdersApiResponse> => {

    if (!response.ok) throw new Error(`Error al consultar las ordenes de compra: ${response.statusText}`);
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`No se pudo parsear el Json de Ordenes de compra`);
    }
}

const fetchOrderResponse = async (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
    init?: ResponseInit,
): Promise<OrdersApiResponse> => {
    const response = await httpClient(buildEnpointUrlOrder(cardCode, state, startDate, endDate), {
        headers: {},
        ...init
    })

    return handleResponse(response)
}

const mapRecordDetalleToPurchaseItems = (recordItems: ItemsApi[]): OrderItem[] => {
    return recordItems.map( item => ({
        ...item,
        id: '',
        productCode: item.ItemCode,
        productName: item.Description,
        description: item.Description,
        quantity: Number(item.Quantity),
        unitPrice: Number(item.PrecioUnitario),
        totalPrice: Number(item.LineTotal),
        state: item.EstadoLinea,
        unit: '',
        qtyPend: Number(item.QtyPend),
        category: '',
    }))
}


const mapRecordOrdersToPurchaseOrders = (record: Order): PurchaseOrder => {
    console.log("Validacion estadi: ", record.EstadoDocumento)
    return {
        id: record.DocEntry?.toString() || '',
        orderNumber:`OC-${record.DocNum}`,
        supplierId: record.CardCode,
        supplierName: record.CardName,
        items: mapRecordDetalleToPurchaseItems(record.Detalle || []),
        totalAmount: parseFloat((record.Total || "0").replace(",", ".")) || 0,
        currency: record.DocCur === 'S/'? 'PEN' : 'USD',
        status: record.EstadoDocumento == "Cerrado" ? 'Completada' : 'En Proceso', // | "Pendiente" | "Aprobada" | "En Proceso" | "Completada" | "Cancelada"
        priority: "Baja", //| "Media" | "Alta" | "Urgente"
        createdDate: record.TaxDate,
        approvedDate: record.TaxDate,
        deliveryDate: "",
        paymentTerms: record.CondicionPago,
        notes: "",
        createdBy: "",
        approvedBy: "",
        department: "",
        requestedBy: record.EncargadoCompras,
        avance: Number(record.AvanceRecepcion)
    }
}

export const fetchOrdersByCardCode = async (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): Promise<PurchaseOrder[] | null> => {

    //if (!cardCode) return null; funciona para ambos
    const json = await fetchOrderResponse(cardCode, state, startDate, endDate);
    const records = Array.isArray(json.data) ? json.data : [json.data];
    if (!records || records.length === 0) return null;

    return records.map(record => {
       return mapRecordOrdersToPurchaseOrders(record)
    })
}