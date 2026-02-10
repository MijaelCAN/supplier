/**
 * Servicio de gestión de estados de citas
 * Maneja las transiciones de estado según el flujo completo de entrega
 */

import { AppointmentStatus } from '@/store/types';
import { UserRole } from '@/routes/menuTypes';
import { httpClient } from '@/services/http/httpClient';
import { getApiBaseUrl } from '@/config/api';

/**
 * Configuración de estados con colores y etiquetas
 */
export const STATUS_CONFIG: Record<AppointmentStatus, { 
    color: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    label: string;
    description: string;
}> = {
    REGISTRADA: {
        color: 'default',
        label: 'Registrada',
        description: 'Cita creada por Compras. Solo proveedor, fecha y hora tentativa.'
    },
    PROGRAMADA: {
        color: 'primary',
        label: 'Programada',
        description: 'Compras agregó orden, productos, cantidades. Almacén asignó almacén de destino.'
    },
    REPROGRAMADA: {
        color: 'warning',
        label: 'Reprogramada',
        description: 'Fecha, hora o almacén fueron modificados después de la programación inicial.'
    },
    TRANSPORTE_COMPLETO: {
        color: 'primary',
        label: 'Transporte Completo',
        description: 'Proveedor completó datos del transportista y vehículo.'
    },
    DOCUMENTOS_COMPLETOS: {
        color: 'primary',
        label: 'Documentos Completos',
        description: 'Proveedor cargó todos los documentos requeridos.'
    },
    EN_EXPLANADA: {
        color: 'warning',
        label: 'En Explanada',
        description: 'Proveedor llegó y está en proceso de entrega física.'
    },
    EN_ENTREGA: {
        color: 'warning',
        label: 'En Entrega',
        description: 'Proveedor está en proceso activo de entrega.'
    },
    CALIDAD_ACEPTADO: {
        color: 'success',
        label: 'Calidad Aceptado',
        description: 'Control de calidad no encontró observaciones. Materiales al 100%.'
    },
    CALIDAD_OBSERVADO: {
        color: 'warning',
        label: 'Calidad Observado',
        description: 'Calidad detectó problemas menores. Se acepta por necesidad operativa.'
    },
    CALIDAD_RECHAZADO: {
        color: 'danger',
        label: 'Calidad Rechazado',
        description: 'No cumple con la calidad requerida. La mercancía no continúa el flujo.'
    },
    ALMACEN_ACEPTADO: {
        color: 'success',
        label: 'Almacén Aceptado',
        description: 'Cantidad recibida = cantidad solicitada. Almacén valida conformidad total.'
    },
    ALMACEN_OBSERVADO: {
        color: 'warning',
        label: 'Almacén Observado',
        description: 'Faltantes menores. Se acepta por necesidad. Pendiente de regularización.'
    },
    ALMACEN_RECHAZADO: {
        color: 'danger',
        label: 'Almacén Rechazado',
        description: 'Diferencia de cantidad excesiva. Almacén no acepta la entrega.'
    },
    PARTE_DE_INGRESO_GENERADO: {
        color: 'success',
        label: 'Parte de Ingreso Generado',
        description: 'Almacén aceptó. Se generó el Parte de Ingreso para Contabilidad.'
    },
    ENTREGADO: {
        color: 'success',
        label: 'Entregado',
        description: 'Proceso cerrado exitosamente. Proveedor habilitado para pago.'
    },
    Cancelada: {
        color: 'danger',
        label: 'Cancelada',
        description: 'Cita cancelada.'
    }
};

/**
 * Transiciones válidas de estado según el rol del usuario
 */
export const VALID_TRANSITIONS: Record<AppointmentStatus, {
    allowedRoles: UserRole[];
    nextStates: AppointmentStatus[];
}> = {
    REGISTRADA: {
        allowedRoles: [UserRole.COMPRAS, UserRole.ADMIN],
        nextStates: ['PROGRAMADA', 'REPROGRAMADA', 'Cancelada']
    },
    PROGRAMADA: {
        allowedRoles: [UserRole.COMPRAS, UserRole.ALMACEN, UserRole.ADMIN],
        nextStates: ['REPROGRAMADA', 'TRANSPORTE_COMPLETO', 'Cancelada']
    },
    REPROGRAMADA: {
        allowedRoles: [UserRole.COMPRAS, UserRole.ALMACEN, UserRole.ADMIN],
        nextStates: ['PROGRAMADA', 'TRANSPORTE_COMPLETO', 'Cancelada']
    },
    TRANSPORTE_COMPLETO: {
        allowedRoles: [UserRole.PROVEEDOR, UserRole.ADMIN],
        nextStates: ['DOCUMENTOS_COMPLETOS']
    },
    DOCUMENTOS_COMPLETOS: {
        allowedRoles: [UserRole.PROVEEDOR, UserRole.SEGURIDAD, UserRole.ADMIN],
        nextStates: ['EN_EXPLANADA', 'EN_ENTREGA']
    },
    EN_EXPLANADA: {
        allowedRoles: [UserRole.SEGURIDAD, UserRole.ADMIN],
        nextStates: ['EN_ENTREGA', 'CALIDAD_ACEPTADO', 'CALIDAD_OBSERVADO', 'CALIDAD_RECHAZADO']
    },
    EN_ENTREGA: {
        allowedRoles: [UserRole.SEGURIDAD, UserRole.ADMIN],
        nextStates: ['CALIDAD_ACEPTADO', 'CALIDAD_OBSERVADO', 'CALIDAD_RECHAZADO']
    },
    CALIDAD_ACEPTADO: {
        allowedRoles: [UserRole.CALIDAD, UserRole.ADMIN],
        nextStates: ['ALMACEN_ACEPTADO', 'ALMACEN_OBSERVADO', 'ALMACEN_RECHAZADO']
    },
    CALIDAD_OBSERVADO: {
        allowedRoles: [UserRole.CALIDAD, UserRole.ADMIN],
        nextStates: ['ALMACEN_ACEPTADO', 'ALMACEN_OBSERVADO', 'ALMACEN_RECHAZADO']
    },
    CALIDAD_RECHAZADO: {
        allowedRoles: [UserRole.CALIDAD, UserRole.ADMIN],
        nextStates: ['Cancelada'] // Estado final negativo
    },
    ALMACEN_ACEPTADO: {
        allowedRoles: [UserRole.ALMACEN, UserRole.ADMIN],
        nextStates: ['PARTE_DE_INGRESO_GENERADO']
    },
    ALMACEN_OBSERVADO: {
        allowedRoles: [UserRole.ALMACEN, UserRole.ADMIN],
        nextStates: ['PARTE_DE_INGRESO_GENERADO']
    },
    ALMACEN_RECHAZADO: {
        allowedRoles: [UserRole.ALMACEN, UserRole.ADMIN],
        nextStates: ['Cancelada'] // Estado final negativo
    },
    PARTE_DE_INGRESO_GENERADO: {
        allowedRoles: [UserRole.ALMACEN, UserRole.ADMIN],
        nextStates: ['ENTREGADO']
    },
    ENTREGADO: {
        allowedRoles: [UserRole.ADMIN], // Solo admin puede revertir
        nextStates: [] // Estado final exitoso
    },
    Cancelada: {
        allowedRoles: [UserRole.ADMIN],
        nextStates: [] // Estado final negativo
    }
};

/**
 * Verifica si una transición de estado es válida
 */
export const canTransitionTo = (
    currentStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
    userRole: UserRole
): boolean => {
    const transition = VALID_TRANSITIONS[currentStatus];
    if (!transition) return false;
    
    // Verificar que el rol tenga permiso
    if (!transition.allowedRoles.includes(userRole) && userRole !== UserRole.ADMIN) {
        return false;
    }
    
    // Verificar que el nuevo estado esté en la lista de estados permitidos
    return transition.nextStates.includes(newStatus);
};

/**
 * Interfaz para la petición de actualización de estado
 */
export interface UpdateStatusRequest {
    U_Estado: AppointmentStatus; // Formato: "PROGRAMADA", "REPROGRAMADA", etc. (coherente con ActualizarCita)
    U_FechaModificacion: string; // Formato ISO: "2026-02-10T11:27:00-05:00"
    U_Usuario: string; // ID del usuario
}

/**
 * Interfaz para la respuesta de actualización de estado
 */
export interface UpdateStatusResponse {
    StatusCode: number;
    Success: boolean;
    Message: string;
    Data: string; // DocEntry
}

/**
 * Actualiza el estado de una cita en el API usando el endpoint exclusivo
 * 
 * @param docEntry - DocEntry de la cita
 * @param newStatus - Nuevo estado a asignar
 * @param userId - ID del usuario que realiza la actualización
 * @returns Promise que resuelve con el DocEntry actualizado
 */
export const updateAppointmentStatus = async (
    docEntry: string,
    newStatus: AppointmentStatus,
    userId: string
): Promise<string> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/Proveedores/ActualizarEstado?docEntry=${docEntry}`;
    
    // Formatear fecha actual en formato ISO con timezone (formato: "2026-02-10T11:27:00-05:00")
    const now = new Date();
    const timezoneOffset = -now.getTimezoneOffset(); // Offset en minutos
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    const timezoneString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    
    // Formato: YYYY-MM-DDTHH:mm:ss±HH:mm
    const fechaModificacion = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}${timezoneString}`;
    
    const requestBody: UpdateStatusRequest = {
        U_Estado: newStatus, // Coherente con el formato del endpoint ActualizarCita
        U_FechaModificacion: fechaModificacion,
        U_Usuario: userId
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
        throw new Error(`Error al actualizar estado de cita (${response.status}): ${errorText}`);
    }
    
    // El API retorna 204 (No Content) en caso de éxito
    if (response.status === 204) {
        return docEntry;
    }
    
    const json = (await response.json()) as UpdateStatusResponse;
    
    if (!json || (json.StatusCode !== 204 && json.StatusCode !== 200)) {
        throw new Error(json.Message || 'Error al actualizar el estado de la cita');
    }
    
    // Retornar el DocEntry de la cita actualizada
    return json.Data || docEntry;
};

/**
 * Obtiene el siguiente estado lógico basado en la acción realizada
 */
export const getNextStatusForAction = (
    currentStatus: AppointmentStatus,
    action: 'create' | 'packingList' | 'transport' | 'documents' | 'arrival' | 'quality_accept' | 'quality_observe' | 'quality_reject' | 'warehouse_accept' | 'warehouse_observe' | 'warehouse_reject' | 'parte_ingreso' | 'delivered'
): AppointmentStatus | null => {
    switch (action) {
        case 'create':
            return 'REGISTRADA';
        case 'packingList':
            return currentStatus === 'REGISTRADA' ? 'PROGRAMADA' : currentStatus;
        case 'transport':
            return 'TRANSPORTE_COMPLETO';
        case 'documents':
            return 'DOCUMENTOS_COMPLETOS';
        case 'arrival':
            return 'EN_EXPLANADA';
        case 'quality_accept':
            return 'CALIDAD_ACEPTADO';
        case 'quality_observe':
            return 'CALIDAD_OBSERVADO';
        case 'quality_reject':
            return 'CALIDAD_RECHAZADO';
        case 'warehouse_accept':
            return 'ALMACEN_ACEPTADO';
        case 'warehouse_observe':
            return 'ALMACEN_OBSERVADO';
        case 'warehouse_reject':
            return 'ALMACEN_RECHAZADO';
        case 'parte_ingreso':
            return 'PARTE_DE_INGRESO_GENERADO';
        case 'delivered':
            return 'ENTREGADO';
        default:
            return null;
    }
};
