import {Invoice as InvoiceApi, InvoiceApiResponse} from "@/services/invoices/types.ts";
import {Invoice} from "@/store/types.ts";

const nameBaseUrl = 'VITE_BASE_URL';

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
    const ENDPOINT = resolveEnv('VITE_INVOICE_ENDPOINT');
    const url = new URL(`${BASE_URL}${ENDPOINT}`);

    if (state && state.trim() !== '') url.searchParams.set('Estado', state.trim());
    if (cardCode && cardCode.trim() !== '') url.searchParams.set('CardCode', cardCode.trim());
    if (startDate && startDate.trim() !== '') url.searchParams.set('FechaInicio', startDate);
    if (endDate && endDate.trim() !== '') url.searchParams.set('FechaFin', endDate);

    return url.toString();
}

const handleResponse = async (response: Response): Promise<InvoiceApiResponse> => {

    if (!response.ok) throw new Error(`Error al consultar las ordenes de compra: ${response.statusText}`);
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`No se pudo parsear el Json de Ordenes de compra`);
    }
}

const fetchInvoiceResponse = async (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
    init?: ResponseInit,
): Promise<InvoiceApiResponse> => {
    const response = await fetch(buildEnpointUrlOrder(cardCode, state, startDate, endDate), {
        headers: {},
        ...init
    })

    return handleResponse(response)
}

const mapRecordInvoicesToInvoice = (record: InvoiceApi): Invoice => {
    const parseAmount = (value: string) => parseFloat((value || "0").replace(",", ".")) || 0;
    const parseDate = (dateStr: string) => dateStr || "";
    
    // Mapear el estado del documento
    let status: 'Recibida' | 'En Revisión' | 'Aprobada' | 'Pagada' | 'Rechazada' = 'Recibida';
    if (record.EstadoDocumento === 'Abierto') {
        status = 'Recibida';
    } else if (record.EstadoDocumento === 'Cerrado') {
        status = 'Pagada';
    }

    const total = parseAmount(record.Total);
    const subtotal = parseAmount(record.SubTotal);
    const taxAmount = parseAmount(record.Impuesto);
    const retention = parseAmount(record.Retencion);
    const saldo = parseAmount(record.Saldo);

    return {
        id: record.DocEntry?.toString() || '',
        invoiceNumber: record.NumAtCard || `FAC-${record.DocNum}`,
        purchaseOrderId: record.DocNum?.toString() || '',
        supplierId: record.CardCode || '',
        supplierName: record.CardName || '',
        amount: total,
        currency: record.DocCur === 'S/' ? 'PEN' : 'USD',
        status: status,
        receivedDate: parseDate(record.DocDate),
        dueDate: parseDate(record.DocDueDate),
        approvedDate: record.EstadoDocumento === 'Cerrado' ? parseDate(record.TaxDate) : undefined,
        paidDate: record.EstadoDocumento === 'Cerrado' ? parseDate(record.TaxDate) : undefined,
        rejectedDate: undefined,
        paymentTerm: record.CondicionPago,
        taxAmount: taxAmount,
        subtotal: subtotal,
        retention: retention,
        saldo: saldo,
        documentUrl: undefined,
        notes: undefined,
        reviewedBy: undefined,
        approvedBy: undefined,
    }
}

export const fetchInvoicesByCardCode = async (
    cardCode: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): Promise<Invoice[] | null> => {

    const json = await fetchInvoiceResponse(cardCode, state, startDate, endDate);
    console.log("JSON INVOICES CONSUMIDO: ", json);
    const records = Array.isArray(json.data) ? json.data : [json.data];
    if (!records || records.length === 0) return null;

    return records.map(record => mapRecordInvoicesToInvoice(record));
}