// src/pages/Agenda/AppointmentHoverCard.tsx
// Resumen de la cita al pasar el cursor por el calendario (OBS-017)
import React from 'react';
import { Chip } from '@heroui/react';
import { DeliveryAppointment } from '@/store/types';
import { STATUS_CONFIG } from '@/services/agenda/appointmentStatus';

interface AppointmentHoverCardProps {
    appointment: DeliveryAppointment;
    /** Nombre de la sede según su código (ALM001 → Sede Ancon); si no se encuentra se muestra solo el código */
    warehouseName?: string;
}

/** "2026-10-14" → "14/10/2026" */
const formatDate = (date?: string): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date ?? '');
    return match ? `${match[3]}/${match[2]}/${match[1]}` : date || '-';
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex gap-2">
        <span className="w-20 shrink-0 text-default-500">{label}</span>
        <span className="font-medium text-default-900 min-w-0 break-words">{children}</span>
    </div>
);

const AppointmentHoverCard: React.FC<AppointmentHoverCardProps> = ({ appointment, warehouseName }) => {
    const status = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG];
    const horario = [appointment.deliveryTime, appointment.deliveryTimeEnd].filter(Boolean).join(' - ');
    const almacen = appointment.warehouse
        ? [appointment.warehouse, warehouseName].filter(Boolean).join(' · ')
        : '-';

    return (
        <div className="px-1 py-2 text-xs space-y-1.5 max-w-xs">
            <Row label="N.º cita">{appointment.docEntry || appointment.appointmentNumber || '-'}</Row>
            <Row label="Proveedor">
                {appointment.supplierName || '-'}
                {appointment.supplierRUC && (
                    <span className="block text-default-500 font-normal">RUC {appointment.supplierRUC}</span>
                )}
            </Row>
            <Row label="Fecha">{formatDate(appointment.deliveryDate)}</Row>
            <Row label="Horario">{horario || '-'}</Row>
            <Row label="Almacén">{almacen}</Row>
            <Row label="Estado">
                <Chip size="sm" variant="flat" color={status?.color ?? 'default'}>
                    {status?.label ?? appointment.status}
                </Chip>
            </Row>
        </div>
    );
};

export default AppointmentHoverCard;
