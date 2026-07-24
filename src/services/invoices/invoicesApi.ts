import {Invoice as InvoiceApi, InvoiceApiResponse} from "@/services/invoices/types.ts";
import {Invoice} from "@/store/types.ts";
import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";
import {getApiBaseUrl} from "@/config/api.ts";

//const normaliseString = (value?: string | null) => (value ?? '').trim();

const buildEnpointUrlOrder = (
    cardCode?: string,
    state?: string,
    startDate?: string,
    endDate?: string,
): string => {
    const BASE_URL = getApiBaseUrl();
    const ENDPOINT = '/api/Documentos/Factura';
    
    const params: Record<string, string> = {};
    if (state && state.trim() !== '') params['Estado'] = state.trim();
    if (cardCode && cardCode.trim() !== '') params['CardCode'] = cardCode.trim();
    if (startDate && startDate.trim() !== '') params['FechaInicio'] = startDate;
    if (endDate && endDate.trim() !== '') params['FechaFin'] = endDate;

    return buildSecureUrl(BASE_URL, ENDPOINT, params);
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
    const response = await httpClient(buildEnpointUrlOrder(cardCode, state, startDate, endDate), {
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
    if (record.estado_documento === 'Abierto') {
        status = 'Recibida';
    } else if (record.estado_documento === 'Cerrado') {
        status = 'Pagada';
    }

    const total = parseAmount(record.total);
    const subtotal = parseAmount(record.sub_total);
    const taxAmount = parseAmount(record.impuesto);
    const retention = parseAmount(record.retencion);
    const saldo = parseAmount(record.saldo);

    // Mapear detalle
    const detalle = record.detalle?.map(item => ({
        docEntry: item.doc_entry?.toString() || '',
        description: item.dscription || '',
        itemCode: item.item_code || '',
        lineTotal: parseAmount(item.line_total),
        quantity: parseAmount(item.quantity)
    })) || [];

    // Mapear pagos
    const pagos = record.pagos?.map(pago => ({
        docDate: parseDate(pago.doc_date),
        docEntry: pago.doc_entry?.toString() || '',
        sumApplied: parseAmount(pago.sum_applied)
    })) || null;

    return {
        id: record.doc_entry?.toString() || '',
        invoiceNumber: record.num_at_card || `FAC-${record.doc_num}`,
        purchaseOrderId: record.doc_num?.toString() || '',
        supplierId: record.card_code || '',
        supplierName: record.card_name || '',
        amount: total,
        currency: record.doc_cur === 'S/' ? 'PEN' : 'USD',
        status: status,
        receivedDate: parseDate(record.doc_date),
        dueDate: parseDate(record.doc_due_date),
        approvedDate: record.estado_documento === 'Cerrado' ? parseDate(record.tax_date) : undefined,
        paidDate: record.estado_documento === 'Cerrado' ? parseDate(record.tax_date) : undefined,
        rejectedDate: undefined,
        paymentTerm: record.condicion_pago,
        taxAmount: taxAmount,
        subtotal: subtotal,
        retention: retention,
        saldo: saldo,
        documentUrl: undefined,
        notes: undefined,
        reviewedBy: undefined,
        approvedBy: undefined,
        detalle: detalle.length > 0 ? detalle : undefined,
        pagos: pagos
    }
}

export const fetchInvoicesByCardCode = async (
    cardCode?: string,
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

// Nueva interfaz para la respuesta del endpoint de programación de pagos
interface PaymentScheduleInvoiceApi {
    doc_entry: string;
    card_code: string;
    doc_num: string;
    lic_trad_num: string;
    card_name: string;
    tax_date: string;
    doc_date: string;
    doc_due_date: string;
    num_at_card: string;
    doc_total: string;
    retencion: string;
    importe_pagar: string;
    total_pagar: string;
}

interface PaymentScheduleInvoiceApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: PaymentScheduleInvoiceApi[];
}

// Función para obtener facturas para programar pagos
export const fetchInvoicesForPaymentSchedule = async (
    startDate: string, // Formato: YYYYMMDD
    endDate: string,   // Formato: YYYYMMDD
    codigoProveedor?: string
): Promise<Invoice[] | null> => {
    const BASE_URL = getApiBaseUrl();
    const ENDPOINT = '/api/Pagos/Factura';
    
    const params: Record<string, string> = {
        FechaInicio: startDate,
        FechaFin: endDate
    };
    
    if (codigoProveedor && codigoProveedor.trim() !== '') {
        params['codigoProveedor'] = codigoProveedor.trim();
    }
    
    const url = buildSecureUrl(BASE_URL, ENDPOINT, params);
    
    try {
        const response = await httpClient(url, {
            skipObfuscation: true, // No ofuscar porque es URL externa
            skipAuth: true // Puede que no requiera autenticación
        });
        
        if (!response.ok) {
            throw new Error(`Error al consultar facturas: ${response.statusText}`);
        }
        
        const json: PaymentScheduleInvoiceApiResponse = await response.json();
        
        if (!json.success || !json.data || json.data.length === 0) {
            return null;
        }
        
        // Mapear al formato Invoice
        return json.data.map(record => {
            const parseAmount = (value: string) => parseFloat((value || "0").replace(",", ".")) || 0;
            const parseDate = (dateStr: string) => {
                if (!dateStr) return "";
                // Convertir formato "16/07/2025 00:00:00" a "2025-07-16"
                try {
                    const [datePart] = dateStr.split(" ");
                    const [day, month, year] = datePart.split("/");
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                } catch {
                    return dateStr;
                }
            };
            
            const docTotal = parseAmount(record.doc_total);
            const retention = parseAmount(record.retencion);
            
            return {
                id: record.doc_entry,
                invoiceNumber: record.num_at_card || `FAC-${record.doc_num}`,
                purchaseOrderId: record.doc_num,
                supplierId: record.card_code,
                supplierName: record.card_name,
                amount: docTotal,
                currency: 'PEN', // Por defecto PEN, ajustar si hay campo de moneda
                status: 'Recibida' as const,
                receivedDate: parseDate(record.doc_date),
                dueDate: parseDate(record.doc_due_date),
                approvedDate: undefined,
                paidDate: undefined,
                rejectedDate: undefined,
                paymentTerm: undefined,
                taxAmount: 0, // No viene en el response
                subtotal: docTotal - retention,
                retention: retention,
                saldo: parseAmount(record.total_pagar) || docTotal,
                documentUrl: undefined,
                notes: undefined,
                reviewedBy: undefined,
                approvedBy: undefined,
                detalle: undefined,
                pagos: null,
                // Campos adicionales del API de programación
                supplierRUC: record.lic_trad_num,
                taxDate: parseDate(record.tax_date),
                importePagar: parseAmount(record.importe_pagar)
            } as Invoice & { supplierRUC?: string; taxDate?: string; importePagar?: number };
        });
    } catch (error) {
        console.error('Error al obtener facturas para programar pagos:', error);
        throw error;
    }
}

// Tipo para cada factura en el request de programación de pagos
type SchedulePaymentInvoice = {
    u_cod_proveedor: string;
    u_fecha_compromiso_pago: string;
    u_n_factura: string;
    u_nombre_proveedor: string;
    u_ruc: string;
    u_fecha_emision: string;
    u_fecha_vencimiento: string;
    u_retencion: string;
    u_fecha_contabilicacion: string;
    u_importe_factura: string;
    u_importe_pagar: string;
    u_total_pagar: string;
    u_estado: string;
    u_comentario: string;
};

interface SchedulePaymentResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: any;
}

// Función para programar pagos de facturas
export const schedulePaymentInvoices = async (
    invoices: Array<{
        invoice: Invoice & { supplierRUC?: string; taxDate?: string; importePagar?: number };
        scheduleDate: string;
        editedImportePagar?: string;
        retentionAmount?: number;
    }>
): Promise<SchedulePaymentResponse> => {
    const BASE_URL = getApiBaseUrl();
    const ENDPOINT = '/api/Pagos/ProgramarFacturas';

    // El request es directamente un array de facturas, sin etiqueta "facturas"
    const requestData: SchedulePaymentInvoice[] = invoices.map(({ invoice, scheduleDate, editedImportePagar, retentionAmount }) => {
        const supplierId = invoice.supplierId?.replace('P', '') || '';
        const supplierRUC = (invoice as Invoice & { supplierRUC?: string }).supplierRUC || supplierId;
        const importePagarNum = editedImportePagar
            ? parseFloat(editedImportePagar)
            : ((invoice as Invoice & { importePagar?: number }).importePagar || 0);
        const importePagar = importePagarNum.toFixed(2);
        // La retención se recalcula proporcional al importe que se está programando ahora
        // (no el total de la factura), para reflejar correctamente pagos parciales/en cuotas.
        const retencion = (retentionAmount ?? 0).toFixed(2);
        const totalPagar = Math.max(importePagarNum - (retentionAmount ?? 0), 0).toFixed(2);

        return {
            u_cod_proveedor: supplierId,
            u_fecha_compromiso_pago: scheduleDate,
            u_n_factura: invoice.invoiceNumber || invoice.purchaseOrderId,
            u_nombre_proveedor: invoice.supplierName || '',
            u_ruc: supplierRUC,
            u_fecha_emision: invoice.receivedDate || '',
            u_fecha_vencimiento: invoice.dueDate || '',
            u_retencion: retencion,
            u_fecha_contabilicacion: (invoice as Invoice & { taxDate?: string }).taxDate || invoice.receivedDate || '',
            u_importe_factura: String(invoice.amount || 0),
            u_importe_pagar: importePagar,
            u_total_pagar: totalPagar,
            u_estado: 'Y',
            u_comentario: ''
        };
    });
    
    try {
        const response = await httpClient(`${BASE_URL}${ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            skipObfuscation: true,
            skipAuth: true
        });
        
        if (!response.ok) {
            throw new Error(`Error al programar facturas: ${response.statusText}`);
        }
        
        const json: SchedulePaymentResponse = await response.json();
        return json;
    } catch (error) {
        console.error('Error al programar facturas:', error);
        throw error;
    }
}

// Función auxiliar para convertir fecha de "DD/MM/YYYY HH:mm:ss" a "YYYY-MM-DD"
const parseScheduledDate = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '') return '';
    try {
        // Formato: "20/01/2026 00:00:00" o "5/01/2026 00:00:00"
        const parts = dateStr.trim().split(' ')[0].split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    } catch {
        return dateStr;
    }
};

// Función auxiliar para parsear números decimales
const parseDecimal = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || value.trim() === '') return 0;
    return parseFloat(value.toString().replace(",", ".")) || 0;
};

// Tipo para la respuesta del API de facturas programadas
interface ScheduledInvoiceApiResponse {
    u_cod_proveedor: string;
    u_fecha_compromiso_pago: string;
    u_n_factura: string;
    u_nombre_proveedor: string;
    u_ruc: string;
    u_fecha_emision: string;
    u_fecha_vencimiento: string;
    u_retencion: string;
    u_fecha_contabilicacion: string;
    u_importe_factura: string;
    u_importe_pagar: string;
    u_total_pagar: string;
    u_estado: string;
    u_comentario: string;
}

// Función para obtener facturas programadas
export const fetchScheduledInvoices = async (
    startDate?: string, // Formato: YYYYMMDD
    endDate?: string,   // Formato: YYYYMMDD
    codigoProveedor?: string
): Promise<Invoice[] | null> => {
    const BASE_URL = getApiBaseUrl();
    const ENDPOINT = '/api/Pagos/FacturasProgramadas';
    
    const params: Record<string, string> = {};
    if (startDate) params['FechaInicio'] = startDate;
    if (endDate) params['FechaFin'] = endDate;
    if (codigoProveedor && codigoProveedor.trim() !== '') {
        params['codigoProveedor'] = codigoProveedor.trim();
    }
    
    const url = buildSecureUrl(BASE_URL, ENDPOINT, params);
    
    try {
        const response = await httpClient(url, {
            skipObfuscation: true,
            skipAuth: true
        });
        
        if (!response.ok) {
            throw new Error(`Error al consultar facturas programadas: ${response.statusText}`);
        }
        
        const json = await response.json();
        
        // El API puede devolver success: false pero con datos válidos
        // Verificamos si hay datos en la respuesta
        if (!json.data) {
            console.log('No hay datos en la respuesta del API');
            return null;
        }
        
        // El data puede ser un objeto o un array
        const dataArray: ScheduledInvoiceApiResponse[] = Array.isArray(json.data) 
            ? json.data 
            : [json.data];
        
        console.log('Datos recibidos del API:', dataArray.length, 'facturas');
        
        // Filtrar solo facturas programadas (U_Estado = "Y" o "Y " o cualquier variante)
        // También incluimos facturas sin U_Estado si tienen U_FechaCompromisoPago
        const invoices: Invoice[] = dataArray
            .filter(item => {
                const estado = String(item.u_estado || '').trim().toUpperCase();
                // Incluir si el estado es "Y" o si no tiene estado pero tiene fecha de compromiso
                return estado === 'Y' || (!estado && item.u_fecha_compromiso_pago);
            })
            .map((item): Invoice & { supplierRUC?: string; taxDate?: string; importePagar?: number; scheduledPaymentDate?: string } => {
                const supplierId = item.u_cod_proveedor ? `P${item.u_cod_proveedor}` : '';
                
                return {
                    id: `${item.u_n_factura}_${item.u_cod_proveedor}_${item.u_fecha_compromiso_pago}`.replace(/\s+/g, '_'),
                    invoiceNumber: item.u_n_factura || '',
                    purchaseOrderId: item.u_n_factura || '',
                    supplierId: supplierId,
                    supplierName: item.u_nombre_proveedor || '',
                    amount: parseDecimal(item.u_importe_factura),
                    currency: 'PEN', // Por defecto PEN, ajustar si el API proporciona moneda
                    status: 'Aprobada', // Las facturas programadas se consideran aprobadas
                    receivedDate: parseScheduledDate(item.u_fecha_emision),
                    dueDate: parseScheduledDate(item.u_fecha_vencimiento),
                    taxAmount: 0, // No disponible en la respuesta del API
                    subtotal: parseDecimal(item.u_importe_factura),
                    saldo: parseDecimal(item.u_total_pagar),
                    retention: parseDecimal(item.u_retencion),
                    notes: item.u_comentario || '',
                    // Campos adicionales
                    supplierRUC: item.u_ruc || item.u_cod_proveedor || '',
                    taxDate: parseScheduledDate(item.u_fecha_contabilicacion),
                    importePagar: parseDecimal(item.u_importe_pagar),
                    scheduledPaymentDate: parseScheduledDate(item.u_fecha_compromiso_pago)
                } as Invoice & { supplierRUC?: string; taxDate?: string; importePagar?: number; scheduledPaymentDate?: string };
            });
        
        console.log('Facturas mapeadas después del filtro:', invoices.length);
        console.log('Primera factura mapeada (si existe):', invoices.length > 0 ? invoices[0] : 'N/A');
        
        return invoices.length > 0 ? invoices : null;
    } catch (error) {
        console.error('Error al obtener facturas programadas:', error);
        throw error;
    }
};