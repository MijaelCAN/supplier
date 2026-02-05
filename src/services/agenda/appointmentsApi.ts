import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { DeliveryAppointment } from "@/store/types";

const DEFAULT_APPOINTMENTS_API_BASE_URL = 'http://192.168.254.27:8082';
const APPOINTMENTS_ENDPOINT = '/api/Proveedores/CitasProveedor';
const CREATE_APPOINTMENT_ENDPOINT = '/api/Proveedores/Cita';

export interface AppointmentDatosTransporte {
    U_EmpresaTransporte?: string;
    U_NombreConductor?: string;
    U_LicenciaConducir?: string;
    U_PlacaVehiculo?: string;
    U_TipoVehiculo?: string;
    U_TelefonoContacto?: string;
    U_HoraLlegada?: string;
    U_Notas?: string;
}

export interface AppointmentDocument {
    DocumentDocEntry: string;
    U_CodCita: string;
    U_nameFile: string;
    U_LinkDocumento: string;
}

export interface AppointmentApiRecord {
    DocEntry?: string; // ID de la cita en el sistema
    U_Ruc: string;
    U_RazonSocial: string;
    U_Fecha: string; // Formato: "06-01-2026" o "19-01-2026"
    U_HoraInicio: string; // Formato: "147" (minutos desde medianoche) o "1100" (HHMM)
    U_HoraFin: string; // Formato: "1540" (minutos desde medianoche) o "1200" (HHMM)
    U_Descripcion: string;
    U_Almacen: string;
    U_Active: string; // "Y" o "N"
    DatosTransporte?: AppointmentDatosTransporte;
    Documents?: AppointmentDocument[];
}

interface AppointmentsApiResponse {
    statusCode: number;
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
    const deliveryDate = formatDateToISO(record.U_Fecha);
    const deliveryTime = minutesToTime(record.U_HoraInicio);
    const deliveryTimeEnd = minutesToTime(record.U_HoraFin);

    // Tratamos la hora como UTC (lo más común y menos sorpresas)
    const startUTC = `${deliveryDate}T${deliveryTime}:00Z`;
    const endUTC = `${deliveryDate}T${deliveryTimeEnd}:00Z`;

    const scheduledDateTime = new Date(startUTC).toISOString();
    const scheduledDateTimeEnd = new Date(endUTC).toISOString();
    // Determinar status basado en U_Active
    const status: DeliveryAppointment['status'] = record.U_Active === 'Y' ? 'Pendiente' : 'Cancelada';
    
    // Generar ID único
    const id = `apt-api-${record.U_Ruc}-${record.U_Fecha}-${index}-${Date.now()}`;
    
    // Generar número de cita
    const appointmentNumber = `CITA-${record.U_Ruc.substring(0, 4)}-${record.U_Fecha.replace(/-/g, '')}`;
    
    // Mapear datos de transporte si existen
    const transportData = record.DatosTransporte && Object.keys(record.DatosTransporte).length > 0 ? {
        id: `transport-${id}`,
        appointmentId: id,
        transportCompany: record.DatosTransporte.U_EmpresaTransporte || '',
        driverName: record.DatosTransporte.U_NombreConductor || '',
        driverLicense: record.DatosTransporte.U_LicenciaConducir || '',
        vehiclePlate: record.DatosTransporte.U_PlacaVehiculo || '',
        vehicleType: record.DatosTransporte.U_TipoVehiculo || '',
        contactPhone: record.DatosTransporte.U_TelefonoContacto || '',
        estimatedArrival: record.DatosTransporte.U_HoraLlegada || '',
        notes: record.DatosTransporte.U_Notas || '',
        completed: true,
        completedDate: new Date().toISOString(),
    } : undefined;

    // Mapear documentos si existen
    const documents = record.Documents && record.Documents.length > 0 ? {
        invoice: (() => {
            const doc = record.Documents.find(d => {
                const name = d.U_nameFile.toLowerCase();
                return name.includes('fac') || name.includes('invoice');
            });
            return doc ? {
                id: doc.DocumentDocEntry,
                name: doc.U_nameFile,
                type: doc.U_nameFile.split('.').pop() || 'pdf',
                url: doc.U_LinkDocumento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        purchaseOrder: (() => {
            const doc = record.Documents.find(d => {
                const name = d.U_nameFile.toLowerCase();
                return name.includes('oc') || name.includes('order');
            });
            return doc ? {
                id: doc.DocumentDocEntry,
                name: doc.U_nameFile,
                type: doc.U_nameFile.split('.').pop() || 'pdf',
                url: doc.U_LinkDocumento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        deliveryGuide: (() => {
            const doc = record.Documents.find(d => {
                const name = d.U_nameFile.toLowerCase();
                return name.includes('guia') || name.includes('guide');
            });
            return doc ? {
                id: doc.DocumentDocEntry,
                name: doc.U_nameFile,
                type: doc.U_nameFile.split('.').pop() || 'pdf',
                url: doc.U_LinkDocumento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        cdr: (() => {
            const doc = record.Documents.find(d => d.U_nameFile.toLowerCase().includes('cdr'));
            return doc ? {
                id: doc.DocumentDocEntry,
                name: doc.U_nameFile,
                type: doc.U_nameFile.split('.').pop() || 'pdf',
                url: doc.U_LinkDocumento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        xml: (() => {
            const doc = record.Documents.find(d => d.U_nameFile.toLowerCase().includes('xml'));
            return doc ? {
                id: doc.DocumentDocEntry,
                name: doc.U_nameFile,
                type: doc.U_nameFile.split('.').pop() || 'xml',
                url: doc.U_LinkDocumento,
                uploadDate: new Date().toISOString(),
                uploadedBy: 'system'
            } : undefined;
        })(),
        id: `docs-${id}`,
        appointmentId: id,
        otherDocuments: record.Documents.filter(doc => {
            const name = doc.U_nameFile.toLowerCase();
            return !name.includes('fac') && !name.includes('invoice') && !name.includes('oc') && 
                   !name.includes('order') && !name.includes('guia') && !name.includes('guide') && 
                   !name.includes('cdr') && !name.includes('xml');
        }).map(doc => ({
            id: doc.DocumentDocEntry,
            name: doc.U_nameFile,
            type: doc.U_nameFile.split('.').pop() || 'unknown',
            url: doc.U_LinkDocumento,
            uploadDate: new Date().toISOString(),
            uploadedBy: 'system'
        })),
        completed: true,
        completedDate: new Date().toISOString()
    } : undefined;
    
    return {
        id,
        appointmentNumber,
        docEntry: record.DocEntry || id, // Usar DocEntry del API (viene del listado)
        supplierId: record.U_Ruc, // Usar RUC como supplierId temporalmente
        supplierRUC: record.U_Ruc,
        supplierName: record.U_RazonSocial,
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
        notes: record.U_Descripcion,
        warehouse: record.U_Almacen,
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
 * Interfaz para crear una nueva cita
 */
export interface CreateAppointmentRequest {
    u_Ruc: string;
    u_RazonSocial: string;
    u_Fecha: string; // Formato: "20260108" (YYYYMMDD)
    u_HoraInicio: string; // Formato: "10:47:41" (HH:MM:SS)
    u_HoraFin: string; // Formato: "12:40:41" (HH:MM:SS)
    u_Descripcion: string;
    u_Almacen: string;
    U_Active: string; // "Y" o "N"
}

/**
 * Respuesta al crear una cita
 */
interface CreateAppointmentResponse {
    statusCode: number;
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
    appointmentData: Omit<CreateAppointmentRequest, 'U_Active'> & { U_Active?: string }
): Promise<string> => {
    const url = `${DEFAULT_APPOINTMENTS_API_BASE_URL}${CREATE_APPOINTMENT_ENDPOINT}`;
    
    // Preparar el request body con el formato correcto
    const requestBody: CreateAppointmentRequest = {
        u_Ruc: appointmentData.u_Ruc,
        u_RazonSocial: appointmentData.u_RazonSocial,
        u_Fecha: appointmentData.u_Fecha,
        u_HoraInicio: formatTimeToSeconds(appointmentData.u_HoraInicio),
        u_HoraFin: formatTimeToSeconds(appointmentData.u_HoraFin),
        u_Descripcion: appointmentData.u_Descripcion || '',
        u_Almacen: appointmentData.u_Almacen || '',
        U_Active: appointmentData.U_Active || 'Y'
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
    
    if (!json || json.statusCode !== 201) {
        throw new Error(json.message || 'Error al crear la cita');
    }
    
    // Retornar el ID de la cita creada
    return json.data || '';
};

/**
 * Interfaz para actualizar una cita existente
 */
export interface UpdateAppointmentRequest {
    u_Ruc: string;
    u_RazonSocial: string;
    u_Fecha: string; // Formato: "20260108" (YYYYMMDD)
    u_HoraInicio: string; // Formato: "10:00:00" (HH:MM:SS)
    u_HoraFin: string; // Formato: "13:00:00" (HH:MM:SS)
    u_Descripcion: string;
    u_Almacen: string;
    u_Active: string; // "Y" o "N"
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
        u_Ruc: appointmentData.u_Ruc,
        u_RazonSocial: appointmentData.u_RazonSocial,
        u_Fecha: appointmentData.u_Fecha,
        u_HoraInicio: formatTimeToSeconds(appointmentData.u_HoraInicio),
        u_HoraFin: formatTimeToSeconds(appointmentData.u_HoraFin),
        u_Descripcion: appointmentData.u_Descripcion || '',
        u_Almacen: appointmentData.u_Almacen || '',
        u_Active: appointmentData.u_Active || 'Y'
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

