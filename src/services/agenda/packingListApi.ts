import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { formatDateForAPI } from "./appointmentsApi";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PACKING_LIST_ENDPOINT = '/api/Documentos/PackinList';
const WAREHOUSE_LIST_ENDPOINT = '/api/PackingList/ListadoAlmacen';
const DOCUMENTS_ENDPOINT = '/api/PackingList/Documentos';
const DOCUMENT_DETAIL_ENDPOINT = '/api/PackingList/Documentos/Detalle';
const FILES_ENDPOINT = '/api/PackingList/Archivos';

export interface DatosTransporte {
    U_EmpresaTransporte?: string;
    U_NombreConductor?: string;
    U_LicenciaConducir?: string;
    U_PlacaVehiculo?: string;
    U_TipoVehiculo?: string;
    U_TelefonoContacto?: string;
    U_HoraLlegada?: string;
    U_Notas?: string;
    U_CodCita?: string;
}

export interface PackingListApiRecord {
    Id: string | number;
    VendorId: string;
    WhsCode: string;
    Number: string;
    InboundType: string;
    Comments: string;
    DateExpected: string; // Formato: "26/12/2025 00:00:00" o "2026-01-19T00:00:00"
    Ticket: string | number;
    WmsResponse: string;
    EmissionDate?: string;
    ExpirationDate?: string;
    CreateAt?: string;
    UpdateAt?: string;
    AppointmentCode?: string;
    DatosTransporte?: DatosTransporte;
    _detallePackinList?: PackingListDetailApiRecord[]; // Detalle de items del PackingList
    DetallePackinList?: PackingListDetailApiRecord[]; // Detalle de items del PackingList (alternativo)
}

export interface PackingListDetailApiRecord {
    Id_Document?: number;
    document?: number;
    LineNumber?: number;
    lineNumber?: number;
    ItemCode?: string;
    itemCode: string;
    ItemName?: string;
    itemName: string;
    Quantity?: number;
    quantity: number;
}

interface PackingListApiResponse {
    statusCode: number;
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
    const items = record._detallePackinList?.map((detalle, index) => ({
        id: `${record.Number}-${detalle.lineNumber}-${index}`,
        productCode: detalle.itemCode,
        productName: detalle.itemName,
        quantity: detalle.quantity,
        pendingQuantity: detalle.quantity, // Asumimos que la cantidad pendiente es la misma
        unit: 'UN', // Por defecto, se puede ajustar si el API lo proporciona
        document: detalle.document,
        lineNumber: detalle.lineNumber
    })) || [];

    return {
        id: record.Number,
        appointmentId: appointmentId || '',
        supplierId: record.VendorId,
        date: formatDateFromAPI(record.DateExpected),
        warehouse: record.WhsCode,
        items: items,
        comment: record.Comments || '',
        commentWms: record.WmsResponse || '',
        number: record.Number,
        inboundType: record.InboundType,
        ticket: record.Ticket,
        createdDate: record.CreateAt ? formatDateFromAPI(record.CreateAt) : new Date().toISOString().split('T')[0],
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
    vendorId: string;
    whsCode: string;
    number: string;
    inboundType: string;
    comments: string;
    dateExpected: string; // Formato: "2025-11-18" (YYYY-MM-DD)
    ticket: string;
    wmsResponse: string;
    codCita: string; // DocEntry de la cita
    _detallePackinList: Array<{
        document: number;
        lineNumber: number;
        itemCode: string;
        itemName: string;
        quantity: number;
    }>;
}

/**
 * Respuesta al crear un PackingList
 */
interface CreatePackingListResponse {
    statusCode: number;
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
    // dateExpected debe venir en formato YYYY-MM-DD (el API lo espera así según el ejemplo)
    let dateExpectedFormatted = packingListData.dateExpected;
    if (!dateExpectedFormatted.includes('-')) {
        // Si viene en formato YYYYMMDD, convertir a YYYY-MM-DD
        if (dateExpectedFormatted.length === 8) {
            const year = dateExpectedFormatted.substring(0, 4);
            const month = dateExpectedFormatted.substring(4, 6);
            const day = dateExpectedFormatted.substring(6, 8);
            dateExpectedFormatted = `${year}-${month}-${day}`;
        } else {
            // Si viene en otro formato, usar formatDateForAPI y luego convertir
            dateExpectedFormatted = formatDateForAPI(packingListData.dateExpected);
            if (dateExpectedFormatted.length === 8) {
                const year = dateExpectedFormatted.substring(0, 4);
                const month = dateExpectedFormatted.substring(4, 6);
                const day = dateExpectedFormatted.substring(6, 8);
                dateExpectedFormatted = `${year}-${month}-${day}`;
            }
        }
    }
    
    const requestBody: CreatePackingListRequest = {
        vendorId: packingListData.vendorId,
        whsCode: packingListData.whsCode,
        number: packingListData.number,
        inboundType: packingListData.inboundType || 'OCNAC',
        comments: packingListData.comments || '',
        dateExpected: dateExpectedFormatted, // Formato YYYY-MM-DD
        ticket: packingListData.ticket || '',
        wmsResponse: packingListData.wmsResponse || '',
        codCita: packingListData.codCita,
        _detallePackinList: packingListData._detallePackinList || []
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
    
    if (!json || (json.statusCode !== 200 && json.statusCode !== 201)) {
        throw new Error(json.message || 'Error al crear el PackingList');
    }
};

/**
 * Interfaz para un almacén del API
 */
export interface WarehouseApiRecord {
    Codigo: string;
    Almacen: string;
}

/**
 * Interfaz para la respuesta del API de almacenes
 */
interface WarehouseListApiResponse {
    statusCode: number;
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
 * Interfaz para un documento de orden de compra del API
 */
export interface DocumentApiRecord {
    DocEntry: string;
    DocNum: string;
    CardCode: string;
    CardName: string;
    TaxDate: string;
}

/**
 * Interfaz para la respuesta del API de documentos
 */
interface DocumentListApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: DocumentApiRecord[];
}

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
    
    const json = (await response.json()) as DocumentListApiResponse;
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de documentos inválida.');
    }
    
    if (!json.success) {
        throw new Error(json.message || 'Error al obtener documentos');
    }
    
    // Manejar ambos casos: objeto único o array
    const documents: DocumentApiRecord[] = Array.isArray(json.data) 
        ? json.data 
        : json.data 
            ? [json.data] 
            : [];
    
    return documents;
};

/**
 * Interfaz para el detalle de un item del documento
 */
export interface DocumentDetailItem {
    Marca: string;
    Artículo: string;
    Descripción: string;
    "Cantidad OC": string;
    CantidadOC: string;
    Pendiente: string;
    Cantidad: string;
}

/**
 * Interfaz para la respuesta del API de detalle del documento
 */
interface DocumentDetailApiResponse {
    statusCode: number;
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
    nameFile: string;
    base64: string;
    codCita: string;
}

/**
 * Interfaz para la respuesta de subida de archivo
 */
export interface UploadFileResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: {
        codCita: string;
        urlArchivo: string;
        nameFile: string;
    };
}

/**
 * Mapeo de tipos de documento a prefijos de nombre de archivo
 */
const DOCUMENT_TYPE_PREFIXES: Record<string, string> = {
    invoice: 'FAC',
    purchaseOrder: 'OC',
    deliveryGuide: 'GR',
    cdr: 'CDR',
    xml: 'XML'
};

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
 * @param type - Tipo de documento (invoice, purchaseOrder, deliveryGuide, cdr, xml)
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
        nameFile: nameFile,
        base64: base64,
        codCita: codCita.trim()
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
 * Interfaz para un producto del endpoint de productos
 */
export interface ProductApiRecord {
    U_Fecha: string; // Formato: "19/01/2026 00:00:00"
    Number: string;
    ItemCode: string;
    ItemName: string;
    U_RazonSocial: string;
    Quantity: string;
    Horario: string; // Formato: "1100 - 1200"
}

/**
 * Interfaz para la respuesta del API de productos
 */
interface ProductListApiResponse {
    statusCode: number;
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
