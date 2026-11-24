// src/pages/Agenda/CancelAppointmentModal.tsx
// "Eliminar cita" (OBS-031): la cita pasa a Cancelada y se eliminan sus packing list. Al terminar se muestran
// los tickets WMS a comunicar (en WMS se elimina a mano), igual que DeletePackingListModal.
import React, { useEffect, useState } from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Radio,
    RadioGroup,
    Spinner,
    Textarea,
} from '@heroui/react';
import { CheckCircleIcon, ClipboardDocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { DeliveryAppointment } from '@/store/types';
import type { PackingListApiRecord } from '@/services/agenda/packingListApi';
import {
    cancelAppointment,
    CancelAppointmentError,
    fetchAllCitaPackingLists,
    hasWmsTicket,
    type CancelAppointmentResult,
} from '@/services/agenda/cancelAppointment';
import { ORIGEN_CANCELACION_LABELS, type OrigenCancelacion, type PackingListCancelado } from '@/services/agenda/trazabilidadApi';

interface CancelAppointmentModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: DeliveryAppointment;
    usuario: string;
    /** Se llama al cancelar (o si se eliminaron packing list aunque la cita no se cancelara), para recargar */
    onChanged: () => void;
}

const MOTIVO_MAX = 250;

const formatDate = (isoDate: string) => {
    const [year, month, day] = (isoDate ?? '').split('-');
    return year && month && day ? `${day}/${month}/${year}` : isoDate;
};

const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
    isOpen,
    onOpenChange,
    appointment,
    usuario,
    onChanged,
}) => {
    const [motivo, setMotivo] = useState('');
    const [origen, setOrigen] = useState<OrigenCancelacion | ''>('');
    const [packingLists, setPackingLists] = useState<PackingListApiRecord[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [result, setResult] = useState<CancelAppointmentResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const codCita = String(appointment.docEntry ?? '');

    const loadPackingLists = async () => {
        setPackingLists(null);
        setLoadError(null);
        try {
            setPackingLists(await fetchAllCitaPackingLists(codCita, appointment.deliveryDate));
        } catch (err) {
            console.error('Error al consultar los packing list de la cita:', err);
            setLoadError('No se pudieron consultar los packing list de la cita. Sin esa información no se puede cancelar.');
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        setMotivo('');
        setOrigen('');
        setResult(null);
        setError(null);
        setCopied(false);
        void loadPackingLists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, codCita]);

    const canConfirm = !!motivo.trim() && !!origen && packingLists !== null && !isCancelling;

    const handleConfirm = async () => {
        if (!canConfirm || !origen || !packingLists) return;
        setIsCancelling(true);
        setError(null);
        try {
            const res = await cancelAppointment({ appointment, packingLists, motivo, origen, usuario });
            setResult(res);
            onChanged();
        } catch (err) {
            if (err instanceof CancelAppointmentError) {
                setError(err.message);
                if (err.eliminados.length > 0) {
                    // Algunos ya se eliminaron: se recarga la lista para reintentar solo con los que quedan
                    onChanged();
                    await loadPackingLists();
                }
            } else {
                setError(err instanceof Error ? err.message : 'Error desconocido al cancelar la cita.');
            }
        } finally {
            setIsCancelling(false);
        }
    };

    const ticketsWms = (result?.packingListsEliminados ?? []).filter((pl) => hasWmsTicket(pl.ticket));

    const handleCopy = async () => {
        const text = ticketsWms.map((pl) => `${pl.number}: ${pl.ticket}`).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            setError(`No se pudo copiar automáticamente. Tickets WMS: ${ticketsWms.map((pl) => pl.ticket).join(', ')}`);
        }
    };

    const isDone = result !== null;

    const renderPackingListRow = (pl: PackingListApiRecord | PackingListCancelado) => (
        <li key={String(pl.id)} className="flex items-center justify-between gap-3 py-1.5">
            <span className="font-medium text-gray-900">{pl.number}</span>
            <span className="text-gray-600">
                Ticket WMS:{' '}
                <span className="font-semibold text-gray-900">{hasWmsTicket(pl.ticket) ? String(pl.ticket) : 'Sin ticket'}</span>
            </span>
        </li>
    );

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="lg"
            scrollBehavior="inside"
            isDismissable={!isCancelling && !isDone}
            hideCloseButton={isCancelling}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            {isDone ? (
                                <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                            ) : (
                                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                            )}
                            {isDone ? `Cita #${codCita} cancelada` : `Eliminar cita #${codCita}`}
                        </ModalHeader>
                        <ModalBody>
                            {!isDone ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded-lg text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Proveedor: </span>
                                            <span className="font-medium text-gray-900">{appointment.supplierName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Fecha: </span>
                                            <span className="font-medium text-gray-900">{formatDate(appointment.deliveryDate)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Horario: </span>
                                            <span className="font-medium text-gray-900">
                                                {appointment.deliveryTime}
                                                {appointment.deliveryTimeEnd && ` - ${appointment.deliveryTimeEnd}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                        <p className="font-semibold">¿Está seguro de eliminar la cita?</p>
                                        <p className="mt-1">
                                            Esta acción no se puede deshacer. La cita quedará como <span className="font-semibold">Cancelada</span> en
                                            la Agenda, ya no saldrá en el Excel y se avisará al proveedor por correo. Si fue un error, tendrá que
                                            crear una nueva cita.
                                        </p>
                                    </div>

                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900 mb-1">Packing list de la cita</p>
                                        {loadError ? (
                                            <div className="flex items-center justify-between gap-3 text-red-700">
                                                <span>{loadError}</span>
                                                <Button size="sm" variant="flat" onPress={() => void loadPackingLists()}>
                                                    Reintentar
                                                </Button>
                                            </div>
                                        ) : packingLists === null ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Spinner size="sm" /> Consultando packing list…
                                            </div>
                                        ) : packingLists.length === 0 ? (
                                            <p className="text-gray-600">La cita no tiene packing list.</p>
                                        ) : (
                                            <>
                                                <p className="text-gray-700 mb-1">
                                                    También se <span className="font-semibold">eliminarán</span> estos packing list y su cantidad volverá a
                                                    quedar pendiente en la orden de compra. En <span className="font-semibold">WMS no se eliminan
                                                    automáticamente</span>: al terminar se le mostrarán los tickets a comunicar al encargado.
                                                </p>
                                                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg px-3">
                                                    {packingLists.map(renderPackingListRow)}
                                                </ul>
                                            </>
                                        )}
                                    </div>

                                    <RadioGroup
                                        label="¿Quién solicita la cancelación?"
                                        orientation="horizontal"
                                        value={origen}
                                        onValueChange={(value) => setOrigen(value as OrigenCancelacion)}
                                        isRequired
                                        isDisabled={isCancelling}
                                        size="sm"
                                    >
                                        {(Object.keys(ORIGEN_CANCELACION_LABELS) as OrigenCancelacion[]).map((key) => (
                                            <Radio key={key} value={key}>
                                                {ORIGEN_CANCELACION_LABELS[key]}
                                            </Radio>
                                        ))}
                                    </RadioGroup>

                                    <Textarea
                                        label="Motivo de la cancelación"
                                        placeholder="Ej.: el proveedor no tiene stock para la fecha"
                                        value={motivo}
                                        onValueChange={(value) => setMotivo(value.slice(0, MOTIVO_MAX))}
                                        description={`${motivo.length}/${MOTIVO_MAX}`}
                                        minRows={2}
                                        isRequired
                                        isDisabled={isCancelling}
                                    />

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 text-sm text-gray-700">
                                    <p>La cita quedó como <span className="font-semibold">Cancelada</span>.</p>

                                    {result.correo === 'ENVIADO' && (
                                        <p>Se envió el aviso de cancelación al proveedor ({result.correoDestino}).</p>
                                    )}
                                    {result.correo === 'SIN_CORREO' && (
                                        <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                            El proveedor no tiene correo registrado: avísele de la cancelación por otro medio.
                                        </p>
                                    )}
                                    {result.correo === 'ERROR' && (
                                        <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                            No se pudo enviar el correo al proveedor ({result.correoDestino}): avísele de la cancelación por otro medio.
                                        </p>
                                    )}
                                    {!result.motivoGuardado && (
                                        <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                            No se pudo guardar el motivo de la cancelación. La cita sí quedó cancelada.
                                        </p>
                                    )}

                                    {result.packingListsEliminados.length > 0 && (
                                        <>
                                            <p>Se eliminaron estos packing list:</p>
                                            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg px-3">
                                                {result.packingListsEliminados.map(renderPackingListRow)}
                                            </ul>
                                            {ticketsWms.length > 0 ? (
                                                <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <span>
                                                        Comunique {ticketsWms.length === 1 ? 'este ticket' : 'estos tickets'} al encargado de WMS para que
                                                        los elimine en WMS: <span className="font-bold text-gray-900">{ticketsWms.map((pl) => pl.ticket).join(', ')}</span>
                                                    </span>
                                                    <Button
                                                        color={copied ? 'success' : 'primary'}
                                                        variant="flat"
                                                        size="sm"
                                                        startContent={<ClipboardDocumentIcon className="w-4 h-4" />}
                                                        onPress={handleCopy}
                                                    >
                                                        {copied ? 'Copiado' : 'Copiar'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p>Los packing list no tenían ticket WMS. Verifique con el encargado de WMS si es necesario eliminar algo allí.</p>
                                            )}
                                        </>
                                    )}
                                    {error && <p className="text-red-700">{error}</p>}
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            {!isDone ? (
                                <>
                                    <Button variant="light" onPress={onClose} isDisabled={isCancelling}>
                                        No, volver
                                    </Button>
                                    <Button color="danger" onPress={handleConfirm} isLoading={isCancelling} isDisabled={!canConfirm}>
                                        Sí, eliminar cita
                                    </Button>
                                </>
                            ) : (
                                <Button color="primary" onPress={onClose}>
                                    Listo
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default CancelAppointmentModal;
