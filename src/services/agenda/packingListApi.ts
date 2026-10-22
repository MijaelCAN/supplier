import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { fetchAppointmentsFromApi, formatDateForAPI } from "./appointmentsApi";
import { getApiBaseUrl } from "@/config/api.ts";
import { DOCUMENT_TYPE_PREFIXES } from "@/config/commercialDocuments";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const PACKING_LIST_ENDPOINT = '/api/Documentos/PackinList';
const WAREHOUSE_LIST_ENDPOINT = '/api/PackingList/ListadoAlmacen';
const DOCUMENTS_ENDPOINT = '/api/PackingList/Documentos';
const DOCUMENT_DETAIL_ENDPOINT = '/api/PackingList/Documentos/Detalle';
const FILES_ENDPOINT = '/api/PackingList/Archivos';
const DELETE_FILE_ENDPOINT = '/api/PackingList/Archivos/Eliminar';
const VALIDACION_PCP_ENDPOINT = '/api/ValidacionPCP';

/**
 * Habilita la eliminación de documentos de la cita (OBS-005).
 * Se activa con VITE_ENABLE_DELETE_DOCUMENTS=true cuando el endpoint de eliminación esté disponible en el backend.
 */
export const DELETE_DOCUMENTS_ENABLED = import.meta.env.VITE_ENABLE_DELETE_DOCUMENTS === 'true';

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
    u_packing_list?: string; // Packing list al que pertenece el documento
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
 * @param packingListNumber - Packing list al que pertenece el documento ("261010394_1")
 * @returns Promise con la respuesta del API
 */
export const uploadFileToPackingList = async (
    file: File,
    type: string,
    codCita: string,
    packingListNumber?: string
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
        cod_cita: codCita.trim(),
        ...(packingListNumber ? { u_packing_list: packingListNumber } : {})
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
 * Interfaz para la petición de eliminación (lógica) de un documento de la cita
 */
export interface DeleteFileRequest {
    document_doc_entry: string; // DocEntry del documento a eliminar (va como query param)
    usuario: string;            // Usuario que elimina
    motivo?: string;            // Motivo de la eliminación (opcional)
}

/**
 * Interfaz para la respuesta de eliminación de un documento
 */
export interface DeleteFileResponse {
    status_code: number;
    success: boolean;
    message: string;
    data?: unknown;
}

/**
 * Elimina (lógicamente) un documento cargado a la cita
 * DELETE /api/PackingList/Archivos/Eliminar?DocEntry={docEntry} con body { usuario, motivo }.
 * El backend responde HTTP 200 y el código real viene en status_code (404 si no existe).
 * @param request - DocEntry del documento, usuario y motivo opcional
 */
export const deleteFileFromPackingList = async (
    request: DeleteFileRequest
): Promise<void> => {
    if (!request.document_doc_entry) {
        throw new Error('El documento a eliminar es requerido');
    }

    const url = buildSecureUrl(DEFAULT_API_BASE_URL, DELETE_FILE_ENDPOINT, {
        DocEntry: request.document_doc_entry,
    });

    const response = await httpClient(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            usuario: request.usuario,
            motivo: request.motivo || '',
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al eliminar archivo (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as DeleteFileResponse;

    if (!json || !json.success) {
        throw new Error(json?.message || 'Error al eliminar el archivo');
    }
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
    // Campos de identificación
    cod_cita?: string;
    packing_list_number?: string;
    line_number?: number;
    document?: number;
    // Cantidad de archivos adjuntos (no eliminados) de la cita a la que pertenece el producto
    cantidad_adjuntos?: number | null;
    // Estado de la cita del producto (mismos valores que AppointmentStatus)
    status_cita?: string | null;
    num_parte_ingreso?: string | null;
    // Si la OC ya tiene factura registrada en SAP; el API lo envía como texto "true"/"false"
    status_factura?: boolean | string | null;
    // Documentación completa (OC, Guía, Factura y Parte de Ingreso), calculada por el backend: "Completo" / "Incompleto" (OBS-023)
    estado_documentos?: string | null;
    // Campos de validación PCP
    confirmacion_pcp?: 'CONFORME' | 'NO_CONFORME' | null;
    cobertura_actual?: number | null;
    cobertura_ingreso?: number | null;
    comentario?: string | null;
    pcp_validado_por?: string | null;
    pcp_fecha_validacion?: string | null;
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
    fechaFin: string,
    orderNumber?: string // N.º de OC: el API lo recibe en CardCode (no es el RUC)
): Promise<ProductApiRecord[]> => {
    const PRODUCTS_ENDPOINT = '/api/Documentos/Productos';
    const params: Record<string, string> = {
        FechaInicio: fechaInicio,
        FechaFin: fechaFin
    };
    if (orderNumber) {
        params['CardCode'] = orderNumber;
    }

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
    //console.log("JSON PRO: ", json);
    
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

interface EntradaMercanciaApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data?: { doc_entry: number; url: string } | null;
}

/**
 * URL para mostrar el PDF del Parte de Ingreso (entrada de mercancía en SAP) por su DocNum (OBS-025).
 * El API devuelve el PDF en binario: se arma una URL blob: local (liberarla con URL.revokeObjectURL),
 * porque el link del servidor de reportes no es accesible desde el navegador del proveedor.
 * Si responde JSON con { data.url } (formato anterior), se usa ese link. null si el parte no existe.
 */
export const fetchParteIngresoPdfUrl = async (docNum: string): Promise<string | null> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, '/api/Documentos/EntradaMarcancia', { DocNum: docNum });
    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            Accept: 'application/pdf, application/json',
        },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`Error al consultar el Parte de Ingreso (${response.status})`);
    }

    if (response.headers.get('Content-Type')?.includes('application/json')) {
        const json = (await response.json()) as EntradaMercanciaApiResponse;
        if (!json?.success || json.status_code === 404) return null;
        return json.data?.url || null;
    }

    // Tipo forzado: con application/octet-stream el iframe descargaría el archivo en vez de mostrarlo
    const pdf = new Blob([await response.arrayBuffer()], { type: 'application/pdf' });
    return pdf.size > 0 ? URL.createObjectURL(pdf) : null;
};

/** Rango amplio para ubicar los packing list de una cita aunque se haya reprogramado */
const PACKING_LIST_LOOKUP_DAYS = 365;

/**
 * Citas por producto de un solo proveedor. /Productos no filtra por RUC, así que se arma
 * con lo que sí filtra: sus citas (por RUC) → packing lists de cada cita → OC ("261006989_1"
 * → "261006989") → /Productos por OC. Así no llegan al navegador datos de otros proveedores.
 */
export const fetchSupplierProductsFromApi = async (
    ruc: string,
    weekStart: Date,
    weekEnd: Date
): Promise<ProductApiRecord[]> => {
    const fechaInicio = formatDateForAPI(weekStart);
    const fechaFin = formatDateForAPI(weekEnd);

    const appointments = await fetchAppointmentsFromApi(ruc, fechaInicio, fechaFin);
    const citaIds = Array.from(new Set(
        appointments
            .filter((apt) => apt.supplierRUC === ruc && apt.docEntry)
            .map((apt) => String(apt.docEntry))
    ));
    if (citaIds.length === 0) return [];

    const lookupStart = new Date(weekStart);
    lookupStart.setDate(lookupStart.getDate() - PACKING_LIST_LOOKUP_DAYS);
    const lookupEnd = new Date(weekEnd);
    lookupEnd.setDate(lookupEnd.getDate() + PACKING_LIST_LOOKUP_DAYS);

    const packingLists = (await Promise.all(
        citaIds.map((id) => fetchPackingListFromApi(formatDateForAPI(lookupStart), formatDateForAPI(lookupEnd), id))
    )).flat();

    const vendorId = `P${ruc}`;
    const orders = Array.from(new Set(
        packingLists
            .filter((pl) => pl.vendor_id === vendorId && pl.number)
            .map((pl) => pl.number.split('_')[0])
    ));
    if (orders.length === 0) return [];

    const productsByOrder = await Promise.all(
        orders.map((order) => fetchProductsFromApi(fechaInicio, fechaFin, order))
    );
    // Por si el API ignorara CardCode: quedarse solo con las OC del proveedor
    const products = productsByOrder.flat().filter((product) => orders.includes(product.number));
    // Al unir varias llamadas se pierde el orden del API
    return products.sort((a, b) => productDateKey(a).localeCompare(productDateKey(b)));
};

/** Clave cronológica del producto: fecha ("19/01/2026 00:00:00") y hora de inicio ("800 - 1100") → "202601190800" */
export const productDateKey = (p: ProductApiRecord): string => {
    const [day = '', month = '', year = ''] = (p.u_fecha ?? '').split(' ')[0].split('/');
    const start = (p.horario ?? '').split(' - ')[0].trim().padStart(4, '0');
    return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}${start}`;
};

export interface ParteIngreso {
    numero: string;
    /** Serie-correlativo de la guía o factura con que se registró ("T070-0211277"); vacío si no tiene */
    documento: string;
    /** status_factura del parte: true ya tiene factura registrada en SAP, null si el API no lo envía */
    conFactura: boolean | null;
    /** Packing list de la línea; null si el API no envía packing_list_number */
    packingList: string | null;
    /** OC de la línea, para ubicar el parte cuando no viene el packing list */
    orden: string;
}

/** num_parte_ingreso llega como "261012039-T070-0211277" (parte-serie-correlativo); sin documento, "261013189--" */
const parseParteIngreso = (value: string, product: ProductApiRecord): ParteIngreso => {
    const [numero, ...documento] = value.split('-');
    const statusFactura = product.status_factura;
    const hasStatus = statusFactura !== undefined && statusFactura !== null && statusFactura !== '';
    return {
        numero: numero.trim(),
        documento: documento.filter(Boolean).join('-').trim(),
        conFactura: hasStatus ? String(statusFactura).toLowerCase() === 'true' : null,
        packingList: product.packing_list_number || null,
        orden: product.number,
    };
};

/**
 * Partes de Ingreso de una cita, primero los pendientes de registrar factura.
 * /PackinList no lo trae: se consulta /Productos por cada OC de la cita en su fecha y se
 * queda con las líneas de sus packing lists (o de sus OC si el API no envía packing_list_number).
 * Mientras el API no envíe la cita del parte (OBS-022) llegan todos los partes de la OC, incluso de otras entregas.
 */
export const fetchAppointmentParteIngreso = async (
    deliveryDate: string, // "YYYY-MM-DD"
    packingLists: PackingListApiRecord[]
): Promise<ParteIngreso[]> => {
    const packingListNumbers = new Set(packingLists.map((pl) => pl.number).filter(Boolean));
    const orders = Array.from(new Set(Array.from(packingListNumbers, (number) => number.split('_')[0])));
    if (orders.length === 0) return [];

    const fecha = formatDateForAPI(deliveryDate.split('T')[0]);
    const products = (await Promise.all(orders.map((order) => fetchProductsFromApi(fecha, fecha, order)))).flat();

    // El API repite cada parte una vez por producto: se deja uno por número en cada packing list
    const partes = new Map<string, ParteIngreso>();
    products
        .filter((p) => p.packing_list_number ? packingListNumbers.has(p.packing_list_number) : orders.includes(p.number))
        .forEach((p) => {
            const value = p.num_parte_ingreso?.trim();
            if (!value) return;
            const parte = parseParteIngreso(value, p);
            const key = `${parte.packingList ?? parte.orden}|${parte.numero}`;
            if (parte.numero && !partes.has(key)) partes.set(key, parte);
        });

    const pendingFirst = (parte: ParteIngreso) => (parte.conFactura === true ? 1 : 0);
    return Array.from(partes.values())
        .sort((a, b) => pendingFirst(a) - pendingFirst(b) || b.numero.localeCompare(a.numero));
};

/**
 * INTERFAZ PARA EL DETALLE DE VALIDACIÓN PCP
 */
export interface ValidacionPCPDetalle {
    u_item_code: string;
    u_item_name: string;
    u_line_number: string;
    u_document: string;
    u_confirmacion_pcp: string;
    u_cobertura_actual: number | string;
    u_cobertura_ingreso: number | string;
    u_comentario: string;
}

/**
 * INTERFAZ PARA LA PETICIÓN DE VALIDACIÓN PCP
 */
export interface ValidacionPCPRequest {
    u_cod_cita: string;
    u_packing_list_numbre: string;
    u_validado_por: string;
    u_fecha_validacion: string; // Formato ISO: "2024-01-15T10:30:00Z"
    detalles: ValidacionPCPDetalle[];
}

/**
 * INTERFAZ PARA LA RESPUESTA DE VALIDACIÓN PCP
 */
export interface ValidacionPCPResponseItem {
    u_item_code: string;
    cantidad_lineas: number;
}

export interface ValidacionPCPResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: ValidacionPCPResponseItem[];
}

/**
 * INTERFAZ PARA LA RESPUESTA DE OBTENER VALIDACIÓN PCP (GET)
 */
export interface ValidacionPCPGetResponseData {
    codigo_cita: string;
    numero_de_packing_list: string;
    validado_por: string;
    fecha_de_validacion: string;
    codigo_de_producto: string;
    nombre_de_producto: string;
    numero_de_linea: string;
    documento: string;
    confirmacion_pcp: string;
    cobertura_actual: string;
    cobertura_ingreso: string;
    comentario: string;
}

export interface ValidacionPCPGetResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: ValidacionPCPGetResponseData | null;
}

/**
 * Envía la validación PCP al API
 * @param validacionData - Datos de la validación PCP a enviar
 * @returns Promise con la respuesta del API
 */
export const sendValidacionPCP = async (
    validacionData: ValidacionPCPRequest
): Promise<ValidacionPCPResponse> => {
    const url = `${DEFAULT_API_BASE_URL}${VALIDACION_PCP_ENDPOINT}`;
    
    // Preparar el request body asegurando que los campos numéricos sean strings
    const requestBody: ValidacionPCPRequest = {
        u_cod_cita: validacionData.u_cod_cita,
        u_packing_list_numbre: validacionData.u_packing_list_numbre,
        u_validado_por: validacionData.u_validado_por,
        u_fecha_validacion: validacionData.u_fecha_validacion,
        detalles: (validacionData.detalles || []).map(detalle => ({
            u_item_code: detalle.u_item_code,
            u_item_name: detalle.u_item_name,
            u_line_number: String(detalle.u_line_number),
            u_document: String(detalle.u_document || ''),
            u_confirmacion_pcp: detalle.u_confirmacion_pcp,
            u_cobertura_actual: typeof detalle.u_cobertura_actual === 'number' 
                ? String(detalle.u_cobertura_actual) 
                : (detalle.u_cobertura_actual || ''),
            u_cobertura_ingreso: typeof detalle.u_cobertura_ingreso === 'number' 
                ? String(detalle.u_cobertura_ingreso) 
                : (detalle.u_cobertura_ingreso || ''),
            u_comentario: detalle.u_comentario || '',
        }))
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
        throw new Error(`Error al enviar validación PCP (${response.status}): ${errorText}`);
    }
    
    const json = (await response.json()) as ValidacionPCPResponse;
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de validación PCP inválida.');
    }
    
    if (!json.success || (json.status_code !== 200 && json.status_code !== 201)) {
        throw new Error(json.message || 'Error al enviar la validación PCP');
    }
    
    return json;
};

/**
 * Obtiene la validación PCP de un producto específico
 * @param codigoCita - Código de la cita
 * @param numeroPackingList - Número del packing list
 * @returns Promise con los datos de validación PCP o null si no existe
 */
export const getValidacionPCP = async (
    codigoCita: string,
    numeroPackingList: string
): Promise<ValidacionPCPGetResponseData | null> => {
    const params: Record<string, string> = {
        CodigoCita: codigoCita,
        NumeroPackingList: numeroPackingList
    };
    
    const url = buildSecureUrl(
        DEFAULT_API_BASE_URL,
        `${VALIDACION_PCP_ENDPOINT}/ObtenerValidacion`,
        params
    );
    
    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        // Si el error es 404, significa que no existe validación, retornamos null
        if (response.status === 404) {
            return null;
        }
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al obtener validación PCP (${response.status}): ${errorText}`);
    }
    
    const json = (await response.json()) as ValidacionPCPGetResponse;
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de validación PCP inválida.');
    }
    
    if (!json.success) {
        // Si no es exitoso pero el status_code es 200, puede que no haya datos
        if (json.status_code === 200 && !json.data) {
            return null;
        }
        throw new Error(json.message || 'Error al obtener la validación PCP');
    }

    // Retornar los datos o null si no existen
    return json.data || null;
};

/**
 * ELIMINACIÓN LÓGICA DE PACKINGLIST (OBS-009)
 * En SAP se marca como eliminado (deja de aparecer en el portal y libera lo pendiente de la OC).
 * En WMS se elimina a mano: quien elimina avisa el ticket al encargado.
 */

/** Interruptor mientras el backend no publique el endpoint de eliminación. */
export const DELETE_PACKING_LIST_ENABLED = import.meta.env.VITE_ENABLE_DELETE_PACKING_LIST === 'true';

/** Estados de la cita en los que se puede eliminar: antes de que el proveedor llegue. */
export const PACKING_LIST_DELETABLE_STATUSES = [
    'REGISTRADA',
    'PROGRAMADA',
    'REPROGRAMADA',
    'TRANSPORTE_COMPLETO',
    'DOCUMENTOS_COMPLETOS',
] as const;

export interface DeletePackingListRequest {
    id: string;           // Id (DocEntry) del PackingList
    number: string;       // Número del PackingList
    cod_cita: string;     // DocEntry de la cita
    usuario: string;      // Usuario que elimina
    motivo: string;
}

/** El backend responde HTTP 200 y el código real en status_code; data es el id eliminado (sin ticket). */
export interface DeletePackingListResponse {
    status_code: number;
    success: boolean;
    message: string;
    data?: string | { ticket?: string };
}

/** Publicado con "PackingList" (a diferencia de PACKING_LIST_ENDPOINT, "PackinList") */
const DELETE_PACKING_LIST_ENDPOINT = '/api/Documentos/PackingList/Eliminar';

/**
 * Elimina lógicamente un PackingList: DELETE ?id={id} con body { usuario, motivo, ... }.
 * Devuelve el ticket WMS a comunicar si el API lo trae (hoy no: se usa el del PackingList).
 */
export const deletePackingList = async (request: DeletePackingListRequest): Promise<{ ticket: string }> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, DELETE_PACKING_LIST_ENDPOINT, { id: request.id });

    const response = await httpClient(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al eliminar el PackingList (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as DeletePackingListResponse;
    if (!json || !json.success) {
        throw new Error(json?.message || 'Error al eliminar el PackingList');
    }

    const ticket = typeof json.data === 'object' ? json.data?.ticket : undefined;
    return { ticket: ticket != null ? String(ticket) : '' };
};
