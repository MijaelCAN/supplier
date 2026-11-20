// src/services/agenda/cancelAppointment.ts
// Cancelación de una cita (OBS-031). La hace Compras/Admin en cualquier estado (el límite se fijará después).
// Orden: 1) elimina sus packing list (lógico en SAP; en WMS a mano con el ticket), 2) pasa la cita a Cancelada,
// 3) guarda motivo/origen en Firestore (el API aún no tiene campo) y 4) avisa al proveedor por correo.
// Si falla un packing list se detiene sin cancelar la cita, para no dejarla cancelada con packing list vivos.
import type { AppointmentStatus, DeliveryAppointment } from '@/store/types';
import { deletePackingList, fetchPackingListFromApi, type PackingListApiRecord } from './packingListApi';
import { formatDateForAPI } from './appointmentsApi';
import { updateAppointmentStatus } from './appointmentStatus';
import {
    registrarEventoCita,
    type OrigenCancelacion,
    type PackingListCancelado,
} from './trazabilidadApi';
import { sendAppointmentCancellation } from '@/services/email/emailApi';
import { getProviderEmailByRuc } from '@/services/auth/apiAuth';
import { WAREHOUSE_LABELS } from '@/config/warehouses';

/** Rango amplio para ubicar todos los packing list de la cita aunque se haya reprogramado */
const PACKING_LIST_LOOKUP_DAYS = 365;

/** El API devuelve "0" o vacío cuando el packing list no llegó a tener ticket en WMS. */
export const hasWmsTicket = (ticket?: string | number | null): boolean => {
    const value = String(ticket ?? '').trim();
    return value !== '' && value !== '0';
};

/** Todos los packing list activos de la cita (los eliminados ya no los devuelve el API). */
export const fetchAllCitaPackingLists = async (codCita: string, deliveryDate: string): Promise<PackingListApiRecord[]> => {
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const base = year && month && day ? new Date(year, month - 1, day) : new Date();
    const start = new Date(base);
    start.setDate(start.getDate() - PACKING_LIST_LOOKUP_DAYS);
    const end = new Date(base);
    end.setDate(end.getDate() + PACKING_LIST_LOOKUP_DAYS);
    const records = await fetchPackingListFromApi(formatDateForAPI(start), formatDateForAPI(end), codCita);
    // Por si el API ignorara CodCita
    return records.filter((pl) => !pl.appointment_code || String(pl.appointment_code) === codCita);
};

export interface CancelAppointmentInput {
    appointment: DeliveryAppointment;
    packingLists: PackingListApiRecord[];
    motivo: string;
    origen: OrigenCancelacion;
    usuario: string;
}

export type CancellationEmailStatus = 'ENVIADO' | 'SIN_CORREO' | 'ERROR';

export interface CancelAppointmentResult {
    packingListsEliminados: PackingListCancelado[];
    /** false si Firestore falló: la cita quedó cancelada pero sin el motivo guardado */
    motivoGuardado: boolean;
    correo: CancellationEmailStatus;
    correoDestino?: string;
}

/** Falló la eliminación de un packing list: la cita NO se canceló. */
export class CancelAppointmentError extends Error {
    constructor(
        message: string,
        public readonly eliminados: PackingListCancelado[],
        public readonly pendientes: PackingListApiRecord[]
    ) {
        super(message);
        this.name = 'CancelAppointmentError';
    }
}

const toPackingListCancelado = (pl: PackingListApiRecord, ticket?: string): PackingListCancelado => ({
    id: String(pl.id),
    number: pl.number,
    ticket: hasWmsTicket(ticket) ? String(ticket) : hasWmsTicket(pl.ticket) ? String(pl.ticket) : '',
});

const resolveSupplierEmail = async (appointment: DeliveryAppointment): Promise<string> => {
    if (appointment.supplierEmail?.trim()) return appointment.supplierEmail.trim();
    if (!appointment.supplierRUC) return '';
    try {
        const info = await getProviderEmailByRuc(appointment.supplierRUC);
        return info.email?.trim() ?? '';
    } catch (error) {
        console.error('No se pudo obtener el correo del proveedor:', error);
        return '';
    }
};

export const cancelAppointment = async (input: CancelAppointmentInput): Promise<CancelAppointmentResult> => {
    const { appointment, packingLists, origen, usuario } = input;
    const motivo = input.motivo.trim();
    const codCita = String(appointment.docEntry ?? '');
    if (!codCita) throw new Error('La cita no tiene número (DocEntry); no se puede cancelar.');
    if (!motivo) throw new Error('Ingrese el motivo de la cancelación.');

    const estadoAnterior = appointment.status as AppointmentStatus;

    // 1) Packing list, uno por uno; si uno falla, no se cancela la cita
    const eliminados: PackingListCancelado[] = [];
    for (let i = 0; i < packingLists.length; i++) {
        const pl = packingLists[i];
        try {
            const result = await deletePackingList({
                id: String(pl.id),
                number: pl.number,
                cod_cita: codCita,
                usuario,
                motivo: `Cita ${codCita} cancelada: ${motivo}`,
            });
            eliminados.push(toPackingListCancelado(pl, result.ticket));
        } catch (error) {
            const detalle = error instanceof Error ? error.message : 'Error desconocido';
            throw new CancelAppointmentError(
                `No se pudo eliminar el packing list ${pl.number}: ${detalle}. La cita no se canceló.`,
                eliminados,
                packingLists.slice(i)
            );
        }
    }

    // 2) Estado de la cita (también registra el evento ESTADO en la trazabilidad)
    try {
        await updateAppointmentStatus(codCita, 'Cancelada', usuario);
    } catch (error) {
        const detalle = error instanceof Error ? error.message : 'Error desconocido';
        throw new CancelAppointmentError(
            `No se pudo cancelar la cita: ${detalle}.` +
                (eliminados.length > 0 ? ' Los packing list ya se eliminaron; vuelva a intentar la cancelación.' : ''),
            eliminados,
            []
        );
    }

    // 3) Motivo y datos de la cancelación (Firestore, hasta que el API tenga el campo)
    const motivoGuardado = await registrarEventoCita(codCita, {
        tipo: 'CANCELACION',
        estado: 'Cancelada',
        cancelacion: { motivo, origen, estadoAnterior, packingLists: eliminados },
    });

    // 4) Correo al proveedor (no revierte nada si falla)
    const correoDestino = await resolveSupplierEmail(appointment);
    let correo: CancellationEmailStatus = 'SIN_CORREO';
    if (correoDestino) {
        const response = await sendAppointmentCancellation({
            to: correoDestino,
            appointmentData: {
                appointmentNumber: codCita,
                supplierName: appointment.supplierName,
                deliveryDate: appointment.deliveryDate,
                deliveryTime: appointment.deliveryTime,
                deliveryTimeEnd: appointment.deliveryTimeEnd ?? '',
                warehouseName: WAREHOUSE_LABELS[appointment.warehouse ?? ''] || appointment.warehouse,
                motivo,
                packingLists: eliminados.map((pl) => pl.number),
            },
        });
        correo = response.success ? 'ENVIADO' : 'ERROR';
        if (!response.success) console.error('Error al enviar el correo de cancelación:', response.error ?? response.message);
    }

    return { packingListsEliminados: eliminados, motivoGuardado, correo, correoDestino: correoDestino || undefined };
};
