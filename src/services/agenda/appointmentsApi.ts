import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { DeliveryAppointment } from "@/store/types";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_APPOINTMENTS_API_BASE_URL = getApiBaseUrl();
const APPOINTMENTS_ENDPOINT = '/api/Proveedores/CitasProveedor';
const CREATE_APPOINTMENT_ENDPOINT = '/api/Proveedores/Cita';

export interface AppointmentDatosTransporte {
    u_empresa_transporte?: string;
    u_nombre_conductor?: string;
    u_licencia_conducir?: string;
    u_placa_vehiculo?: string;
    u_tipo_vehiculo?: string;
    u_telefono_contacto?: string;
    u_hora_llegada?: string;
    u_notas?: string;
}

export interface AppointmentDocument {
    document_doc_entry: string;
    u_cod_cita: string;
    u_name_file: string;
    u_link_documento: string;
}

export interface AppointmentApiRecord {
    doc_entry?: string; // ID de la cita en el sistema
    u_ruc: string;
    u_razon_social: string;
    u_fecha: string; // Formato: "06-01-2026" o "19-01-2026"
    u_hora_inicio: string; // Formato: "147" (minutos desde medianoche) o "1100" (HHMM)
    u_hora_fin: string; // Formato: "1540" (minutos desde medianoche) o "1200" (HHMM)
    u_descripcion: string;
    u_almacen: string;
    u_active: string; // "Y" o "N"
    u_estado:  'Pendiente' | 'PackingListCompletado' | 'TransporteCompletado' | 'DocumentosCompletados' | 'ListaParaEntrega' | 'Completada' | 'Cancelada' | 'Programado';
    datos_transporte?: AppointmentDatosTransporte;
    documents?: AppointmentDocument[];
}

interface AppointmentsApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: AppointmentApiRecord | AppointmentApiRecord[]; // Puede ser objeto único o array
}

/**
 * Convierte minutos desde medianoche o formato HHMM a formato HH:MM
 * Ejemplos: 
 * - "647" -> "10:47" (647 minutos = 10 horas y 47 minutos)
 * - "1100" -> "11:00" (formato HHMM directo)
 * - "900" -> "09:00" (formato HHMM directo)
 * - "800" -> "08:00" (formato HHMM directo)
 */
const minutesToTime = (time: string): string => {
    if (!time) return '08:00';
    
    const numTime = parseInt(time);
    
    // Normalizar a 4 dígitos con padding a la izquierda para análisis
    const padded = time.padStart(4, '0');
    const hours = parseInt(padded.slice(0, 2));
    const minutes = parseInt(padded.slice(2));
    
    // Si puede interpretarse como HHMM válido (hora <= 23, minutos <= 59), tratarlo como HHMM
    if (hours <= 23 && minutes <= 59) {
        return padded.slice(0, 2) + ':' + padded.slice(2);
    }
    
    // Si no es un HHMM válido, tratarlo como minutos desde medianoche
    const totalMinutes = numTime;
    const hoursFromMinutes = Math.floor(totalMinutes / 60);
    const minsFromMinutes = totalMinutes % 60;
    return `${String(hoursFromMinutes).padStart(2, '0')}:${String(minsFromMinutes).padStart(2, '0')}`;
};

/**
 * Convierte fecha de formato "06-01-2026" a formato ISO "2026-01-06"
 * Usa Date local para evitar problemas de zona horaria
 */
const formatDateToISO = (dateStr: string): string => {
    try {
        // Formato esperado: "06-01-2026" (DD-MM-YYYY)
        const [day, month, year] = dateStr.split('-');
        if (day && month && year) {
            // Crear fecha en zona horaria local para evitar desplazamientos
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const yearStr = date.getFullYear();
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            return `${yearStr}-${monthStr}-${dayStr}`;
        }
    } catch (error) {
        console.error('Error al formatear fecha:', error);
    }
    // Si falla, retornar fecha actual
    return new Date().toISOString().split('T')[0];
};

/**
 * Convierte un registro de la API a DeliveryAppointment
 */
const mapApiRecordToAppointment = (record: AppointmentApiRecord, index: number): DeliveryAppointment => {
    const deliveryDate = formatDateToISO(record.u_fecha);
    const deliveryTime = minutesToTime(record.u_hora_inicio);
    const deliveryTimeEnd = minutesToTime(record.u_hora_fin);

    // Tratamos la hora como UTC (lo más común y menos sorpresas)
    const startUTC = `${deliveryDate}T${deliveryTime}:00Z`;
    const endUTC = `${deliveryDate}T${deliveryTimeEnd}:00Z`;

    const scheduledDateTime = new Date(startUTC).toISOString();
    const scheduledDateTimeEnd = new Date(endUTC).toISOString();
    // Determinar status basado en U_Estado, con fallback a REGISTRADA si no viene
    const status: DeliveryAppointment['status'] = (record.u_estado as DeliveryAppointment['status']) || 'REGISTRADA';

    // Generar ID único
    const id = `apt-api-${record.u_ruc}-${record.u_fecha}-${index}-${Date.now()}`;
    
    // Generar número de cita
    const appointmentNumber = `CITA-${record.u_ruc.substring(0, 4)}-${record.u_fecha.replace(/-/g, '')}`;
    
    // Mapear datos de transporte si existen
    const transportData = record.datos_transporte && Object.keys(record.datos_transporte).length > 0 ? {
        id: `transport-${id}`,
        appointmentId: id,
        transportCompany: record.datos_transporte.u_empresa_transporte || '',
        driverName: record.datos_transporte.u_nombre_conductor || '',
        driverLicense: record.datos_transporte.u_licencia_conducir || '',
        vehiclePlate: record.datos_transporte.u_placa_vehiculo || '',
        vehicleType: record.datos_transporte.u_tipo_vehiculo || '',
        contactPhone: record.datos_transporte.u_telefono_contacto || '',
        estimatedArrival: record.datos_transporte.u_hora_llegada || '',
        notes: record.datos_transporte.u_notas || '',
        completed: true,
        completedDate: new Date().toISOString(),
    } : undefined;

    // Mapear documentos si existen
    const documents = record.documents && record.documents.length > 0 ? {
        invoice: (() => {
            const doc = record.documents.find(d => {
                const name = d.u_name_file.toLowerCase();
                return name.includes('fac') || name.includes('invoice');
            });
            return doc ? {
                id: doc.document_doc_entry,
                name: doc.u_name_file,
                type: doc.u_name_file.split('.').pop() || 'pdf',
                url: doc.u_link_documento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        purchaseOrder: (() => {
            const doc = record.documents.find(d => {
                const name = d.u_name_file.toLowerCase();
                return name.includes('oc') || name.includes('order');
            });
            return doc ? {
                id: doc.document_doc_entry,
                name: doc.u_name_file,
                type: doc.u_name_file.split('.').pop() || 'pdf',
                url: doc.u_link_documento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        deliveryGuide: (() => {
            const doc = record.documents.find(d => {
                const name = d.u_name_file.toLowerCase();
                return name.includes('guia') || name.includes('guide');
            });
            return doc ? {
                id: doc.document_doc_entry,
                name: doc.u_name_file,
                type: doc.u_name_file.split('.').pop() || 'pdf',
                url: doc.u_link_documento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        cdr: (() => {
            const doc = record.documents.find(d => d.u_name_file.toLowerCase().includes('cdr'));
            return doc ? {
                id: doc.document_doc_entry,
                name: doc.u_name_file,
                type: doc.u_name_file.split('.').pop() || 'pdf',
                url: doc.u_link_documento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        xml: (() => {
            const doc = record.documents.find(d => d.u_name_file.toLowerCase().includes('xml'));
            return doc ? {
                id: doc.document_doc_entry,
                name: doc.u_name_file,
                type: doc.u_name_file.split('.').pop() || 'xml',
                url: doc.u_link_documento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        id: `docs-${id}`,
        appointmentId: id,
        otherDocuments: record.documents.filter(doc => {
            const name = doc.u_name_file.toLowerCase();
            return !name.includes('fac') && !name.includes('invoice') && !name.includes('oc') && 
                   !name.includes('order') && !name.includes('guia') && !name.includes('guide') && 
                   !name.includes('cdr') && !name.includes('xml');
        }).map(doc => ({
            id: doc.document_doc_entry,
            name: doc.u_name_file,
            type: doc.u_name_file.split('.').pop() || 'unknown',
            url: doc.u_link_documento,
            uploadDate: new Date().toISOString(),
            uploadedBy: 'system'
        })),
        completed: true,
        completedDate: new Date().toISOString()
    } : undefined;
    
    return {
        id,
        appointmentNumber,
        docEntry: record.doc_entry || id, // Usar DocEntry del API (viene del listado)
        supplierId: record.u_ruc, // Usar RUC como supplierId temporalmente
        supplierRUC: record.u_ruc,
        supplierName: record.u_razon_social,
        supplierEmail: '', // No viene en la API
        supplierPhone: '', // No viene en la API
        deliveryDate,
        deliveryTime,
        deliveryTimeEnd,
        scheduledDateTime,
        scheduledDateTimeEnd,
        status,
        createdBy: 'system',
        createdDate: new Date().toISOString(),
        notes: record.u_descripcion,
        warehouse: record.u_almacen,
        transportData,
        documents,
        notificationSent: false,
    };
};

/**
 * Construye la URL del endpoint con los parámetros
 */
const buildAppointmentsUrl = (
    ruc?: string,
    fechaInicio?: string,
    fechaFin?: string
): string => {
    const baseUrl = DEFAULT_APPOINTMENTS_API_BASE_URL;
    const params: Record<string, string> = {};
    
    if (ruc && ruc.trim() !== '') {
        params['Ruc'] = ruc.trim();
    }
    if (fechaInicio && fechaInicio.trim() !== '') {
        params['FechaInicio'] = fechaInicio.trim();
    }
    if (fechaFin && fechaFin.trim() !== '') {
        params['FechaFin'] = fechaFin.trim();
    }
    
    return buildSecureUrl(baseUrl, APPOINTMENTS_ENDPOINT, params);
};

/**
 * Formatea fecha a formato YYYYMMDD para el API
 * Ejemplo: "2026-01-06" -> "20260106"
 * IMPORTANTE: Parsea la fecha sin usar zona horaria para evitar cambios de día
 */
export const formatDateForAPI = (date: Date | string): string => {
    if (typeof date === 'string') {
        // Si es string, parsear directamente sin usar new Date() para evitar problemas de zona horaria
        // Formato esperado: "YYYY-MM-DD"
        const parts = date.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            return `${year}${month}${day}`;
        }
        // Si no tiene el formato esperado, intentar con Date pero usando métodos locales
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    } else {
        // Si es Date, usar métodos locales (no UTC) para evitar cambios de día
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
};

/**
 * Obtiene las citas del proveedor desde el API
 * @param ruc - RUC del proveedor (opcional, si no se envía retorna todas las citas)
 * @param fechaInicio - Fecha de inicio en formato YYYYMMDD
 * @param fechaFin - Fecha de fin en formato YYYYMMDD
 */
export const fetchAppointmentsFromApi = async (
    ruc?: string,
    fechaInicio?: string,
    fechaFin?: string
): Promise<DeliveryAppointment[]> => {
    const url = buildAppointmentsUrl(ruc, fechaInicio, fechaFin);
    
    const response = await httpClient(url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al consultar citas (${response.status})`);
    }
    
    const json = (await response.json()) as AppointmentsApiResponse;
    console.log('json citas', json);
    
    if (!json || typeof json !== 'object') {
        throw new Error('Respuesta del servicio de citas inválida.');
    }
    
    // Manejar ambos casos: objeto único o array
    const records: AppointmentApiRecord[] = Array.isArray(json.data)
        ? json.data
        : json.data
            ? [json.data]
            : [];
    
    // Convertir cada registro a DeliveryAppointment
    return records.map((record, index) => mapApiRecordToAppointment(record, index));
};





/**
 * INTERFAZ PARA CREAR UNA NUEVA CITA
 */
export interface CreateAppointmentRequest {
    u_ruc: string;
    u_razon_social: string;
    u_fecha: string; // Formato: "20260108" (YYYYMMDD)
    u_hora_inicio: string; // Formato: "10:47:41" (HH:MM:SS)
    u_hora_fin: string; // Formato: "12:40:41" (HH:MM:SS)
    u_descripcion: string;
    u_almacen: string;
    u_active: string; // "Y" o "N"
    u_estado: string; // Estado de la cita (ej: "PENDIENTE")
}

/**
 * Respuesta al crear una cita
 */
interface CreateAppointmentResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: string; // ID de la cita creada
}

/**
 * Convierte hora de formato HH:MM a HH:MM:SS
 */
const formatTimeToSeconds = (timeStr: string): string => {
    if (!timeStr) return '08:00:00';
    // Si ya tiene segundos, retornar tal cual
    if (timeStr.split(':').length === 3) return timeStr;
    // Si solo tiene HH:MM, agregar :00
    return `${timeStr}:00`;
};

/**
 * Crea una nueva cita en el API
 * @param appointmentData - Datos de la cita a crear
 * @returns ID de la cita creada
 */
export const createAppointmentInApi = async (
    appointmentData: Omit<CreateAppointmentRequest, 'U_Active' | 'U_Estado'> & { U_Active?: string; U_Estado?: string }
): Promise<string> => {
    const url = `${DEFAULT_APPOINTMENTS_API_BASE_URL}${CREATE_APPOINTMENT_ENDPOINT}`;
    
    // Preparar el request body con el formato correcto
    const requestBody: CreateAppointmentRequest = {
        u_ruc: appointmentData.u_ruc,
        u_razon_social: appointmentData.u_razon_social,
        u_fecha: appointmentData.u_fecha,
        u_hora_inicio: formatTimeToSeconds(appointmentData.u_hora_inicio),
        u_hora_fin: formatTimeToSeconds(appointmentData.u_hora_fin),
        u_descripcion: appointmentData.u_descripcion || '',
        u_almacen: appointmentData.u_almacen || '',
        u_active: appointmentData.u_active || 'Y',
        u_estado: appointmentData.u_estado || 'REGISTRADA'
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
        throw new Error(`Error al crear cita (${response.status}): ${errorText}`);
    }
    
    const json = (await response.json()) as CreateAppointmentResponse;
    
    if (!json || json.status_code !== 201) {
        throw new Error(json.message || 'Error al crear la cita');
    }
    
    // Retornar el ID de la cita creada
    return json.data || '';
};

/**
 * Interfaz para actualizar una cita existente
 */
export interface UpdateAppointmentRequest {
    u_ruc: string;
    u_razon_social: string;
    u_fecha: string; // Formato: "20260108" (YYYYMMDD)
    u_hora_inicio: string; // Formato: "10:00:00" (HH:MM:SS)
    u_hora_fin: string; // Formato: "13:00:00" (HH:MM:SS)
    u_descripcion: string;
    u_almacen: string;
    u_active: string; // "Y" o "N"
    u_estado?: string; // Estado de la cita (ej: "Programado", "PENDIENTE")
}

/**
 * Respuesta al actualizar una cita
 */
interface UpdateAppointmentResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: string; // DocEntry de la cita actualizada
}

/**
 * Actualiza una cita existente en el API
 * @param docEntry - DocEntry de la cita a actualizar
 * @param appointmentData - Datos de la cita a actualizar
 * @returns DocEntry de la cita actualizada
 */
export const updateAppointmentInApi = async (
    docEntry: string,
    appointmentData: UpdateAppointmentRequest
): Promise<string> => {
    const url = `${DEFAULT_APPOINTMENTS_API_BASE_URL}/api/Proveedores/ActualizarCita?DocEntry=${docEntry}`;
    
    // Preparar el request body con el formato correcto
    const requestBody: UpdateAppointmentRequest = {
        u_ruc: appointmentData.u_ruc,
        u_razon_social: appointmentData.u_razon_social,
        u_fecha: appointmentData.u_fecha,
        u_hora_inicio: formatTimeToSeconds(appointmentData.u_hora_inicio),
        u_hora_fin: formatTimeToSeconds(appointmentData.u_hora_fin),
        u_descripcion: appointmentData.u_descripcion || '',
        u_almacen: appointmentData.u_almacen || '',
        u_active: appointmentData.u_active || 'Y',
        u_estado: appointmentData.u_estado || 'REGISTRADA'
    };
    
    const response = await httpClient(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al actualizar cita (${response.status}): ${errorText}`);
    }
    
    // El API retorna 204 (No Content) en caso de éxito, pero también puede retornar JSON
    if (response.status === 204) {
        return docEntry;
    }
    
    const json = (await response.json()) as UpdateAppointmentResponse;
    
    if (!json || (json.statusCode !== 204 && json.statusCode !== 200)) {
        throw new Error(json.message || 'Error al actualizar la cita');
    }
    
    // Retornar el DocEntry de la cita actualizada
    return json.data || docEntry;
};

