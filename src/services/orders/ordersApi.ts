import {OrderItem, PurchaseOrder} from "@/store/types.ts";
import {Order, OrderItem as ItemsApi, OrdersApiResponse} from "@/services/orders/types.ts";
import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";
import {getApiBaseUrl} from "@/config/api.ts";

const buildEnpointUrlOrder = (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): string => {
    const BASE_URL = getApiBaseUrl();
    const ENDPOINT = '/api/Documentos/OrdenCompra';
    
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
        productCode: item.item_code,
        productName: item.description,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.precio_unitario),
        totalPrice: Number(item.line_total),
        state: item.estado_linea,
        unit: '',
        qtyPend: Number(item.qty_pend),
        category: '',
    }))
}


const mapRecordOrdersToPurchaseOrders = (record: Order): PurchaseOrder => {
    return {
        id: record.doc_entry?.toString() || '',
        orderNumber:record.doc_num,
        supplierId: record.card_code,
        supplierName: record.card_name,
        items: mapRecordDetalleToPurchaseItems(record.detalle || []),
        totalAmount: parseFloat((record.total || "0").replace(",", ".")) || 0,
        currency: record.doc_cur === 'S/'? 'PEN' : 'USD',
        status: record.estado_documento == "Cerrado" ? 'Completada' : 'En Proceso', // | "Pendiente" | "Aprobada" | "En Proceso" | "Completada" | "Cancelada"
        priority: "Baja", //| "Media" | "Alta" | "Urgente"
        createdDate: record.tax_date,
        approvedDate: record.tax_date,
        deliveryDate: "",
        paymentTerms: record.condicion_pago,
        notes: "",
        createdBy: "",
        approvedBy: "",
        department: "",
        requestedBy: record.encargado_compras,
        avance: Number(record.avance_recepcion)
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