import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { DeliveryAppointment } from "@/store/types";

const DEFAULT_APPOINTMENTS_API_BASE_URL = 'http://192.168.254.27:8082';
const APPOINTMENTS_ENDPOINT = '/api/Proveedores/CitasProveedor';
const CREATE_APPOINTMENT_ENDPOINT = '/api/Proveedores/Cita';

export interface AppointmentApiRecord {
    U_Ruc: string;
    U_RazonSocial: string;
    U_Fecha: string; // Formato: "06-01-2026"
    U_HoraInicio: string; // Formato: "147" (minutos desde medianoche)
    U_HoraFin: string; // Formato: "1540" (minutos desde medianoche)
    U_Descripcion: string;
    U_Almacen: string;
    U_Active: string; // "Y" o "N"
}

interface AppointmentsApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: AppointmentApiRecord | AppointmentApiRecord[]; // Puede ser objeto único o array
}

/**
 * Convierte minutos desde medianoche a formato HH:MM
 * Ejemplo: 647 -> "10:47" (647 minutos = 10 horas y 47 minutos)
 */
const minutesToTime = (time: string): string => {
    const s = time.padStart(4, '0'); // convierte 847 → "0847"
    return s.slice(0, 2) + ':' + s.slice(2);
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
    
    return {
        id,
        appointmentNumber,
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
 */
export const formatDateForAPI = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
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
    u_Fecha: string; // Formato: "2026-01-08" (ISO)
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

