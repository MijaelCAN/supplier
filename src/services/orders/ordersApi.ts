import {OrderItem, PurchaseOrder} from "@/store/types.ts";
import {Order, OrderItem as ItemsApi, OrdersApiResponse} from "@/services/orders/types.ts";

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
    const ENDPOINT = resolveEnv(nameEnpoint);
    const url = new URL(`${BASE_URL}${ENDPOINT}`);

    if (state && state.trim() !== '') url.searchParams.set('Estado', state.trim());
    if (cardCode && cardCode.trim() !== '') url.searchParams.set('CardCode', cardCode.trim());
    if (startDate && startDate.trim() !== '') url.searchParams.set('FechaInicio', startDate);
    if (endDate && endDate.trim() !== '') url.searchParams.set('FechaFin', endDate);

    return url.toString();
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
    const response = await fetch(buildEnpointUrlOrder(cardCode, state, startDate, endDate), {
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
        EstadoLinea: item.EstadoLinea,
        unit: '',
        QtyPend: Number(item.QtyPend),
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
    cardCode: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): Promise<PurchaseOrder[] | null> => {
    if (!cardCode) return null;

    const json = await fetchOrderResponse(cardCode, state, startDate, endDate);
    console.log("JSON CCONSUMIDO: ", json);
    const records = Array.isArray(json.data) ? json.data : [json.data];
    if (!records || records.length === 0) return null;

    return records.map(record => {
       return mapRecordOrdersToPurchaseOrders(record)
    })
}