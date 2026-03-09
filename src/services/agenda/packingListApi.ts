import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { formatDateForAPI } from "./appointmentsApi";
import { getApiBaseUrl } from "@/config/api.ts";
import {DOCUMENT_TYPE_PREFIXES} from "@/config/commercialDocuments.tsx";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PACKING_LIST_ENDPOINT = '/api/Documentos/PackinList';
const WAREHOUSE_LIST_ENDPOINT = '/api/PackingList/ListadoAlmacen';
const DOCUMENTS_ENDPOINT = '/api/PackingList/Documentos';
const DOCUMENT_DETAIL_ENDPOINT = '/api/PackingList/Documentos/Detalle';
const FILES_ENDPOINT = '/api/PackingList/Archivos';

export interface DatosTransporte {
    u_empresa_transporte?: string;
    u_nombre_conductor?: string;
    u_licencia_conducir?: string;
    u_placa_vehiculo?: string;
    u_tipo_vehiculo?: string;
    u_telefono_contacto?: string;
    u_hora_llegada?: string;
    u_notas?: string;
    u_cod_cita?: string;
}

export interface PackingListApiRecord {
    id: string | number;
    vendor_id: string;
    whs_code: string;
    number: string;
    inbound_type: string;
    comments: string;
    date_expected: string; // Formato: "26/12/2025 00:00:00" o "2026-01-19T00:00:00"
    ticket: string | number;
    wms_response: string;
    emission_date?: string;
    expiration_date?: string;
    create_at?: string;
    update_at?: string;
    appointment_code?: string;
    DatosTransporte?: DatosTransporte;
    detalle_packin_list?: PackingListDetailApiRecord[]; // Detalle de items del PackingList
    DetallePackinList?: PackingListDetailApiRecord[]; // Detalle de items del PackingList (alternativo)
}

export interface PackingListDetailApiRecord {
    id_document?: number;
    document?: number;
    line_number?: number;
    item_code?: string;
    item_name?: string;
    quantity: number;
}

interface PackingListApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: PackingListApiRecord | PackingListApiRecord[];
}

/**
 * Convierte fecha de formato "26/12/2025 00:00:00" a formato ISO "2025-12-26"
 */
const formatDateFromAPI = (dateStr: string): string => {
    try {
        // Formato: "26/12/2025 00:00:00"
        const datePart = dateStr.split(' ')[0]; // "26/12/2025"
        const [day, month, year] = datePart.split('/');
        if (day && month && year) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    } catch (error) {
        console.error('Error al formatear fecha:', error);
    }
    return new Date().toISOString().split('T')[0];
};

/**
 * Convierte un registro de la API a PackingList (formato interno)
 */
export const mapApiRecordToPackingList = (record: PackingListApiRecord, appointmentId?: string): any => {
    // Mapear items si existen
    const items = record.detalle_packin_list?.map((detalle, index) => ({
        id: `${record.number}-${detalle.line_number}-${index}`,
        productCode: detalle.item_code,
        productName: detalle.item_name,
        quantity: detalle.quantity,
        pendingQuantity: detalle.quantity, // Asumimos que la cantidad pendiente es la misma
        unit: 'UN', // Por defecto, se puede ajustar si el API lo proporciona
        document: detalle.document,
        lineNumber: detalle.line_number
    })) || [];

    return {
        id: record.number,
        appointmentId: appointmentId || '',
        supplierId: record.vendor_id,
        date: formatDateFromAPI(record.date_expected),
        warehouse: record.whs_code,
        items: items,
        comment: record.comments || '',
        commentWms: record.wms_response || '',
        number: record.number,
        inboundType: record.inbound_type,
        ticket: record.ticket,
        createdDate: record.create_at ? formatDateFromAPI(record.create_at) : new Date().toISOString().split('T')[0],
        completed: true // Si viene del API, está completado
    };
};

/**
 * Obtiene los PackingList del API
 * @param fechaInicio - Fecha de inicio en formato YYYYMMDD
 * @param fechaFin - Fecha de fin en formato YYYYMMDD
 * @param codCita - Código de cita (DocEntry) para filtrar por cita específica
 */
export const fetchPackingListFromApi = async (
    fechaInicio?: string,
    fechaFin?: string,
    codCita?: string
): Promise<PackingListApiRecord[]> => {
    const params: Record<string, string> = {};
    
    if (fechaInicio && fechaInicio.trim() !== '') {
        params['FechaInicio'] = fechaInicio.trim();
    }
    if (fechaFin && fechaFin.trim() !== '') {
        params['FechaFin'] = fechaFin.trim();
    }
    if (codCita && codCita.trim() !== '') {
        params['CodCita'] = codCita.trim();
    }
    
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PACKING_LIST_ENDPOINT, params);
    
    const response = await httpClient(url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al consultar PackingList (${response.status})`);
    }
    
    const json = (await response.json()) as PackingListApiResponse;
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de PackingList inválida.');
    }
    
    // Manejar ambos casos: objeto único o array
    const records: PackingListApiRecord[] = Array.isArray(json.data) 
        ? json.data 
        : json.data 
            ? [json.data] 
            : [];
    
    return records;
};

/**
 * Interfaz para crear un PackingList
 */
export interface CreatePackingListRequest {
    vendor_id: string;
    whs_code: string;
    number: string;
    inbound_type: string;
    comments: string;
    date_expected: string; // Formato: "2025-11-18" (YYYY-MM-DD)
    ticket: string;
    wms_response: string;
    cod_cita: string; // DocEntry de la cita
    _detalle_packin_list: Array<{
        document: number;
        line_number: number;
        item_code: string;
        item_name: string;
        quantity: number;
    }>;
}

/**
 * Respuesta al crear un PackingList
 */
interface CreatePackingListResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: any;
}

/**
 * Crea un nuevo PackingList en el API
 * @param packingListData - Datos del PackingList a crear
 */
export const createPackingListInApi = async (
    packingListData: CreatePackingListRequest
): Promise<void> => {
    const url = `${DEFAULT_API_BASE_URL}${PACKING_LIST_ENDPOINT}`;
    
    // Preparar el request body con el formato correcto
    // date_expected debe venir en formato YYYY-MM-DD (el API lo espera así según el ejemplo)
    let dateExpectedFormatted = packingListData.date_expected;
    if (!dateExpectedFormatted.includes('-')) {
        // Si viene en formato YYYYMMDD, convertir a YYYY-MM-DD
        if (dateExpectedFormatted.length === 8) {
            const year = dateExpectedFormatted.substring(0, 4);
            const month = dateExpectedFormatted.substring(4, 6);
            const day = dateExpectedFormatted.substring(6, 8);
            dateExpectedFormatted = `${year}-${month}-${day}`;
        } else {
            // Si viene en otro formato, usar formatDateForAPI y luego convertir
            dateExpectedFormatted = formatDateForAPI(packingListData.date_expected);
            if (dateExpectedFormatted.length === 8) {
                const year = dateExpectedFormatted.substring(0, 4);
                const month = dateExpectedFormatted.substring(4, 6);
                const day = dateExpectedFormatted.substring(6, 8);
                dateExpectedFormatted = `${year}-${month}-${day}`;
            }
        }
    }
    
    const requestBody: CreatePackingListRequest = {
        vendor_id: packingListData.vendor_id,
        whs_code: packingListData.whs_code,
        number: packingListData.number,
        inbound_type: packingListData.inbound_type || 'OCNAC',
        comments: packingListData.comments || '',
        date_expected: dateExpectedFormatted, // Formato YYYY-MM-DD
        ticket: packingListData.ticket || '',
        wms_response: packingListData.wms_response || '',
        cod_cita: packingListData.cod_cita,
        _detalle_packin_list: packingListData._detalle_packin_list || []
    };
    
    const response = await httpClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al crear PackingList (${response.status}): ${errorText}`);
    }
    
    const json = (await response.json()) as CreatePackingListResponse;
    
    if (!json || (json.status_code !== 200 && json.status_code !== 201)) {
        throw new Error(json.message || 'Error al crear el PackingList');
    }
};

/**
 * Interfaz para un almacén del API
 */
export interface WarehouseApiRecord {
    codigo: string;
    almacen: string;
}

/**
 * Interfaz para la respuesta del API de almacenes
 */
interface WarehouseListApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: WarehouseApiRecord[];
}

/**
 * Obtiene el listado de almacenes desde el API
 */
export const fetchWarehousesFromApi = async (): Promise<WarehouseApiRecord[]> => {
    const url = `${DEFAULT_API_BASE_URL}${WAREHOUSE_LIST_ENDPOINT}`;
    
    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al consultar almacenes (${response.status})`);
    }
    
    const json = (await response.json()) as WarehouseListApiResponse;
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de almacenes inválida.');
    }
    
    if (!json.success || !Array.isArray(json.data)) {
        throw new Error(json.message || 'Error al obtener almacenes');
    }
    
    return json.data;
};

/**
 * Interfaz RAW para un documento de orden de compra del API (snake_case)
 * Esta es la estructura exacta que viene del API
 */
interface DocumentApiRecordRaw {
    doc_entry: string;
    doc_num: string;
    card_code: string;
    card_name: string;
    tax_date: string;
}

/**
 * Interfaz para un documento de orden de compra en formato interno (PascalCase)
 * Esta es la estructura que usa la aplicación internamente
 */
export interface DocumentApiRecord {
    DocEntry: string;
    DocNum: string;
    CardCode: string;
    CardName: string;
    TaxDate: string;
}

/**
 * Interfaz RAW para la respuesta del API de documentos (snake_case)
 */
interface DocumentListApiResponseRaw {
    status_code: number;
    success: boolean;
    message: string;
    data: DocumentApiRecordRaw[];
}

/**
 * Interfaz para la respuesta del API de documentos en formato interno (camelCase)
 */


/**
 * Mapea la respuesta RAW del API (snake_case) al formato interno (PascalCase)
 * Este es el único lugar donde se debe modificar si cambia la estructura del API
 * 
 * @param rawRecord - Respuesta raw del API con snake_case
 * @returns Record en formato PascalCase para uso interno
 */
const mapDocumentApiRecordRaw = (
    rawRecord: DocumentApiRecordRaw
): DocumentApiRecord => {
    return {
        DocEntry: rawRecord.doc_entry,
        DocNum: rawRecord.doc_num,
        CardCode: rawRecord.card_code,
        CardName: rawRecord.card_name,
        TaxDate: rawRecord.tax_date,
    };
};

/**
 * Obtiene el listado de documentos (órdenes de compra) desde el API
 * @param typeDoc - Tipo de documento: "OCNAC" (Compras Nacionales) o "OCINT" (Importaciones)
 * @param searchTerm - Término de búsqueda opcional para filtrar documentos por DocNum
 */
export const fetchDocumentsFromApi = async (typeDoc: 'OCNAC' | 'OCINT', searchTerm?: string, supplierRUC?: string): Promise<DocumentApiRecord[]> => {
    const params: Record<string, string> = {
        typeDoc: typeDoc,
        "Ruc": `P${supplierRUC}` || ''
    };
    
    // Si hay término de búsqueda, agregarlo como parámetro DocNum
    if (searchTerm && searchTerm.trim()) {
        params['Documento'] = searchTerm.trim();
    }
    
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, DOCUMENTS_ENDPOINT, params);
    
    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al consultar documentos (${response.status})`);
    }
    
    // Mapear la respuesta RAW del API (snake_case) al formato interno (PascalCase)
    const rawResponse = (await response.json()) as DocumentListApiResponseRaw;
    
    if (!rawResponse || typeof rawResponse !== 'object') {
        throw new Error('Respuesta del servicio de documentos inválida.');
    }
    
    if (!rawResponse.success) {
        throw new Error(rawResponse.message || 'Error al obtener documentos');
    }
    
    // Manejar ambos casos: objeto único o array
    const rawData = Array.isArray(rawResponse.data) 
        ? rawResponse.data 
        : rawResponse.data 
            ? [rawResponse.data] 
            : [];
    
    // Mapear cada documento de snake_case a PascalCase
    const documents: DocumentApiRecord[] = rawData.map(mapDocumentApiRecordRaw);
    
    return documents;
};

/**
 * Interfaz para el detalle de un item del documento
 */
export interface DocumentDetailItem {
    marca: string;
    artículo: string;
    descripción: string;
    "cantidad oc": string;
    cantidad_oc: string;
    pendiente: string;
    cantidad: string;
}

/**
 * Interfaz para la respuesta del API de detalle del documento
 */
interface DocumentDetailApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: DocumentDetailItem | DocumentDetailItem[];
}

/**
 * Obtiene el detalle de un documento (orden de compra) desde el API
 * @param docNum - Número del documento
 * @param typeDoc - Tipo de documento: "OCNAC" (Compras Nacionales) o "OCINT" (Importaciones)
 */
export const fetchDocumentDetailFromApi = async (docNum: string, typeDoc: 'OCNAC' | 'OCINT'): Promise<DocumentDetailItem[]> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, DOCUMENT_DETAIL_ENDPOINT, {
        DocNum: docNum,
        typeDoc: typeDoc
    });
    
    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al consultar detalle del documento (${response.status})`);
    }
    
    const json = (await response.json()) as DocumentDetailApiResponse;
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de detalle del documento inválida.');
    }
    
    if (!json.success) {
        throw new Error(json.message || 'Error al obtener detalle del documento');
    }
    
    // Manejar ambos casos: objeto único o array
    if (!json.data) {
        return [];
    }
    
    const items: DocumentDetailItem[] = Array.isArray(json.data) 
        ? json.data 
        : [json.data];
    
    return items;
};

/**
 * Interfaz para la petición de subida de archivo
 */
export interface UploadFileRequest {
    name_file: string;
    base64: string;
    cod_cita: string;
}

/**
 * Interfaz para la respuesta de subida de archivo
 */
export interface UploadFileResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: {
        cod_cita: string;
        url_archivo: string;
        name_file: string;
    };
}


/**
 * Convierte un archivo File a base64
 * @param file - Archivo a convertir
 * @returns Promise con el string base64
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // Remover el prefijo "data:mime/type;base64," si existe
                const base64 = reader.result.split(',')[1] || reader.result;
                resolve(base64);
            } else {
                reject(new Error('Error al convertir archivo a base64'));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Genera un nombre de archivo único basado en el tipo de documento
 * @param type - Tipo de documento (invoice, purchaseOrder, etc.)
 * @param originalFileName - Nombre original del archivo
 * @returns Nombre de archivo formateado
 */
const generateFileName = (type: string, originalFileName: string): string => {
    const prefix = DOCUMENT_TYPE_PREFIXES[type] || 'DOC';
    const timestamp = new Date().getTime();
    const extension = originalFileName.split('.').pop() || '';
    const sanitizedOriginal = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Limitar el nombre original a 20 caracteres para evitar nombres muy largos
    const shortOriginal = sanitizedOriginal.substring(0, 20).replace(/\.[^.]+$/, '');
    return `${prefix}_${shortOriginal}_${timestamp}.${extension}`;
};

/**
 * Sube un archivo a la cita en el API
 * @param file - Archivo a subir
 * @param type - Tipo de documento (invoice, purchaseOrder, deliveryGuide, qualityCertificate, transportGuide, packingList, safetySheet, analysisCertificate, etc.)
 * @param codCita - Código de la cita (DocEntry)
 * @returns Promise con la respuesta del API
 */
export const uploadFileToPackingList = async (
    file: File,
    type: string,
    codCita: string
): Promise<UploadFileResponse['data']> => {
    if (!codCita || codCita.trim() === '') {
        throw new Error('El código de cita es requerido');
    }

    if (!file) {
        throw new Error('El archivo es requerido');
    }

    // Convertir archivo a base64
    const base64 = await fileToBase64(file);
    
    // Generar nombre de archivo
    const nameFile = generateFileName(type, file.name);
    
    // Preparar request body
    const requestBody: UploadFileRequest = {
        name_file: nameFile,
        base64: base64,
        cod_cita: codCita.trim()
    };
    
    const url = `${DEFAULT_API_BASE_URL}${FILES_ENDPOINT}`;
    
    const response = await httpClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al subir archivo (${response.status}): ${errorText}`);
    }
    
    const json = (await response.json()) as UploadFileResponse;
    
    if (!json || !json.success) {
        throw new Error(json.message || 'Error al subir el archivo');
    }
    
    if (!json.data) {
        throw new Error('La respuesta del API no contiene los datos del archivo');
    }
    
    return json.data;
};

/**
 * INTERFAZ PARA LAS CITAS POR PRODUCTO
 */
export interface ProductApiRecord {
    u_fecha: string; // Formato: "19/01/2026 00:00:00"
    number: string;
    item_code: string;
    item_name: string;
    u_razon_social: string;
    quantity: string;
    horario: string; // Formato: "1100 - 1200"
}

/**
 * INTERFAZ PARA LA RESPUESTA DEL API de CITAS POR PRODUCTO
 */
interface ProductListApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: ProductApiRecord[];
}

/**
 * Obtiene el listado de productos desde el API
 * @param fechaInicio - Fecha de inicio en formato YYYYMMDD
 * @param fechaFin - Fecha de fin en formato YYYYMMDD
 */
export const fetchProductsFromApi = async (
    fechaInicio: string,
    fechaFin: string
): Promise<ProductApiRecord[]> => {
    const PRODUCTS_ENDPOINT = '/api/Documentos/Productos';
    const params: Record<string, string> = {
        FechaInicio: fechaInicio,
        FechaFin: fechaFin
    };
    
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, PRODUCTS_ENDPOINT, params);
    
    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al consultar productos (${response.status})`);
    }
    
    const json = (await response.json()) as ProductListApiResponse;
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de productos inválida.');
    }
    
    if (!json.success) {
        throw new Error(json.message || 'Error al obtener productos');
    }
    
    // Manejar ambos casos: objeto único o array
    const products: ProductApiRecord[] = Array.isArray(json.data) 
        ? json.data 
        : json.data 
            ? [json.data] 
            : [];
    
    return products;
};
