import {Invoice as InvoiceApi, InvoiceApiResponse} from "@/services/invoices/types.ts";
import {Invoice} from "@/store/types.ts";
import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";

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
    const ENDPOINT = resolveEnv('VITE_INVOICE_ENDPOINT') || '/api/Documentos/Factura';
    
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

    // Mapear detalle
    const detalle = record.Detalle?.map(item => ({
        docEntry: item.DocEntry?.toString() || '',
        description: item.Dscription || '',
        itemCode: item.ItemCode || '',
        lineTotal: parseAmount(item.LineTotal),
        quantity: parseAmount(item.Quantity)
    })) || [];

    // Mapear pagos
    const pagos = record.Pagos?.map(pago => ({
        docDate: parseDate(pago.DocDate),
        docEntry: pago.DocEntry?.toString() || '',
        sumApplied: parseAmount(pago.SumApplied)
    })) || null;

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
    DocEntry: string;
    CardCode: string;
    DocNum: string;
    LicTradNum: string;
    CardName: string;
    TaxDate: string;
    DocDate: string;
    DocDueDate: string;
    NumAtCard: string;
    DocTotal: string;
    retencion: string;
    importePagar: string;
    totalPagar: string;
}

interface PaymentScheduleInvoiceApiResponse {
    statusCode: number;
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
    const BASE_URL = 'http://192.168.254.27:8082';
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
            
            const docTotal = parseAmount(record.DocTotal);
            const retention = parseAmount(record.retencion);
            
            return {
                id: record.DocEntry,
                invoiceNumber: record.NumAtCard || `FAC-${record.DocNum}`,
                purchaseOrderId: record.DocNum,
                supplierId: record.CardCode,
                supplierName: record.CardName,
                amount: docTotal,
                currency: 'PEN', // Por defecto PEN, ajustar si hay campo de moneda
                status: 'Recibida' as const,
                receivedDate: parseDate(record.DocDate),
                dueDate: parseDate(record.DocDueDate),
                approvedDate: undefined,
                paidDate: undefined,
                rejectedDate: undefined,
                paymentTerm: undefined,
                taxAmount: 0, // No viene en el response
                subtotal: docTotal - retention,
                retention: retention,
                saldo: parseAmount(record.totalPagar) || docTotal,
                documentUrl: undefined,
                notes: undefined,
                reviewedBy: undefined,
                approvedBy: undefined,
                detalle: undefined,
                pagos: null,
                // Campos adicionales del API de programación
                supplierRUC: record.LicTradNum,
                taxDate: parseDate(record.TaxDate),
                importePagar: parseAmount(record.importePagar)
            } as Invoice & { supplierRUC?: string; taxDate?: string; importePagar?: number };
        });
    } catch (error) {
        console.error('Error al obtener facturas para programar pagos:', error);
        throw error;
    }
}

// Tipo para cada factura en el request de programación de pagos
type SchedulePaymentInvoice = {
    u_CodProveedor: string;
    u_FechaCompromisoPago: string;
    u_NFactura: string;
    u_NombreProveedor: string;
    u_Ruc: string;
    u_FechaEmision: string;
    u_FechaVencimiento: string;
    u_Retencion: string;
    u_FechaContabilicacion: string;
    u_ImporteFactura: string;
    u_ImportePagar: string;
    u_TotalPagar: string;
    u_Estado: string;
    u_Comentario: string;
};

interface SchedulePaymentResponse {
    statusCode: number;
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
    }>
): Promise<SchedulePaymentResponse> => {
    const BASE_URL = 'http://192.168.254.27:8082';
    const ENDPOINT = '/api/Pagos/ProgramarFacturas';
    
    // El request es directamente un array de facturas, sin etiqueta "facturas"
    const requestData: SchedulePaymentInvoice[] = invoices.map(({ invoice, scheduleDate, editedImportePagar }) => {
        const supplierId = invoice.supplierId?.replace('P', '') || '';
        const supplierRUC = (invoice as Invoice & { supplierRUC?: string }).supplierRUC || supplierId;
        const importePagar = editedImportePagar 
            ? parseFloat(editedImportePagar).toFixed(2)
            : String((invoice as Invoice & { importePagar?: number }).importePagar || 0);
        
        return {
            u_CodProveedor: supplierId,
            u_FechaCompromisoPago: scheduleDate, // Formato: YYYY-MM-DD
            u_NFactura: invoice.invoiceNumber || invoice.purchaseOrderId,
            u_NombreProveedor: invoice.supplierName || '',
            u_Ruc: supplierRUC,
            u_FechaEmision: invoice.receivedDate || '',
            u_FechaVencimiento: invoice.dueDate || '',
            u_Retencion: String(invoice.retention || 0),
            u_FechaContabilicacion: (invoice as Invoice & { taxDate?: string }).taxDate || invoice.receivedDate || '',
            u_ImporteFactura: String(invoice.amount || 0),
            u_ImportePagar: importePagar,
            u_TotalPagar: String(invoice.saldo || invoice.amount || 0),
            u_Estado: 'Y',
            u_Comentario: '' // Campo de comentario, por ahora vacío
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
    U_CodProveedor: string;
    U_FechaCompromisoPago: string;
    U_NFactura: string;
    U_NombreProveedor: string;
    U_Ruc: string;
    U_FechaEmision: string;
    U_FechaVencimiento: string;
    U_Retencion: string;
    U_FechaContabilicacion: string;
    U_ImporteFactura: string;
    U_ImportePagar: string;
    U_TotalPagar: string;
    U_Estado: string;
    U_Comentario: string;
}

// Función para obtener facturas programadas
export const fetchScheduledInvoices = async (
    startDate?: string, // Formato: YYYYMMDD
    endDate?: string,   // Formato: YYYYMMDD
    codigoProveedor?: string
): Promise<Invoice[] | null> => {
    const BASE_URL = 'http://192.168.254.27:8082';
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
                const estado = String(item.U_Estado || '').trim().toUpperCase();
                // Incluir si el estado es "Y" o si no tiene estado pero tiene fecha de compromiso
                return estado === 'Y' || (!estado && item.U_FechaCompromisoPago);
            })
            .map((item): Invoice & { supplierRUC?: string; taxDate?: string; importePagar?: number; scheduledPaymentDate?: string } => {
                const supplierId = item.U_CodProveedor ? `P${item.U_CodProveedor}` : '';
                
                return {
                    id: `${item.U_NFactura}_${item.U_CodProveedor}_${item.U_FechaCompromisoPago}`.replace(/\s+/g, '_'),
                    invoiceNumber: item.U_NFactura || '',
                    purchaseOrderId: item.U_NFactura || '',
                    supplierId: supplierId,
                    supplierName: item.U_NombreProveedor || '',
                    amount: parseDecimal(item.U_ImporteFactura),
                    currency: 'PEN', // Por defecto PEN, ajustar si el API proporciona moneda
                    status: 'Aprobada', // Las facturas programadas se consideran aprobadas
                    receivedDate: parseScheduledDate(item.U_FechaEmision),
                    dueDate: parseScheduledDate(item.U_FechaVencimiento),
                    taxAmount: 0, // No disponible en la respuesta del API
                    subtotal: parseDecimal(item.U_ImporteFactura),
                    saldo: parseDecimal(item.U_TotalPagar),
                    retention: parseDecimal(item.U_Retencion),
                    notes: item.U_Comentario || '',
                    // Campos adicionales
                    supplierRUC: item.U_Ruc || item.U_CodProveedor || '',
                    taxDate: parseScheduledDate(item.U_FechaContabilicacion),
                    importePagar: parseDecimal(item.U_ImportePagar),
                    scheduledPaymentDate: parseScheduledDate(item.U_FechaCompromisoPago)
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