// src/pages/Agenda/DeletePackingListModal.tsx
// Eliminación lógica de un PackingList (OBS-009). En WMS se elimina a mano: al terminar se muestra el ticket a comunicar.
import React, { useEffect, useState } from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Textarea,
} from '@heroui/react';
import { CheckCircleIcon, ClipboardDocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { deletePackingList, PackingListApiRecord } from '@/services/agenda/packingListApi';

interface DeletePackingListModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    packingList: PackingListApiRecord | null;
    codCita: string;
    usuario: string;
    /** Se llama después de eliminar, para recargar los PackingList de la cita */
    onDeleted: () => void;
}

/** El API devuelve "0" o vacío cuando el PackingList no llegó a tener ticket en WMS. */
const hasWmsTicket = (ticket?: string) => !!ticket && ticket.trim() !== '' && ticket.trim() !== '0';

const DeletePackingListModal: React.FC<DeletePackingListModalProps> = ({
    isOpen,
    onOpenChange,
    packingList,
    codCita,
    usuario,
    onDeleted,
}) => {
    const [motivo, setMotivo] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletedTicket, setDeletedTicket] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setMotivo('');
        setDeletedTicket(null);
        setCopied(false);
    }, [isOpen]);

    if (!packingList) return null;

    const handleDelete = async () => {
        if (!motivo.trim()) {
            alert('Ingrese el motivo de la eliminación');
            return;
        }
        setIsDeleting(true);
        try {
            const result = await deletePackingList({
                id: String(packingList.id),
                number: packingList.number,
                cod_cita: codCita,
                usuario,
                motivo: motivo.trim(),
            });
            // Si el API no devuelve el ticket, se usa el que ya tenía el PackingList
            setDeletedTicket(result.ticket || String(packingList.ticket ?? ''));
            onDeleted();
        } catch (error) {
            alert(`Error al eliminar el PackingList: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopy = async () => {
        if (!deletedTicket) return;
        try {
            await navigator.clipboard.writeText(deletedTicket);
            setCopied(true);
        } catch {
            alert(`No se pudo copiar automáticamente. Ticket WMS: ${deletedTicket}`);
        }
    };

    const isDone = deletedTicket !== null;

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="lg"
            isDismissable={!isDeleting && !isDone}
            hideCloseButton={isDeleting}
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
                            {isDone ? 'PackingList eliminado' : `Eliminar PackingList ${packingList.number}`}
                        </ModalHeader>
                        <ModalBody>
                            {!isDone ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-700">
                                        El PackingList dejará de aparecer en el portal y su cantidad volverá a quedar pendiente en la orden de compra.
                                        Esta acción no se puede deshacer.
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        En <span className="font-semibold">WMS no se elimina automáticamente</span>: al terminar se le mostrará el ticket que debe comunicar al encargado.
                                    </p>
                                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                        <span className="text-gray-600">Ticket WMS:</span>
                                        <span className="ml-2 font-semibold">
                                            {hasWmsTicket(String(packingList.ticket ?? '')) ? packingList.ticket : 'Sin ticket'}
                                        </span>
                                    </div>
                                    <Textarea
                                        label="Motivo de la eliminación"
                                        placeholder="Ej.: se registraron cantidades equivocadas"
                                        value={motivo}
                                        onValueChange={setMotivo}
                                        minRows={2}
                                        isRequired
                                        isDisabled={isDeleting}
                                    />
                                </div>
                            ) : hasWmsTicket(deletedTicket) ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-700">
                                        Comunique este ticket al encargado de WMS para que elimine el PackingList en WMS:
                                    </p>
                                    <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <span className="text-2xl font-bold tracking-wide text-gray-900">{deletedTicket}</span>
                                        <Button
                                            color={copied ? 'success' : 'primary'}
                                            variant="flat"
                                            startContent={<ClipboardDocumentIcon className="w-4 h-4" />}
                                            onPress={handleCopy}
                                        >
                                            {copied ? 'Copiado' : 'Copiar ticket'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700">
                                    El PackingList no tenía ticket WMS. Verifique con el encargado de WMS si es necesario eliminar algo allí.
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            {!isDone ? (
                                <>
                                    <Button variant="light" onPress={onClose} isDisabled={isDeleting}>
                                        Cancelar
                                    </Button>
                                    <Button color="danger" onPress={handleDelete} isLoading={isDeleting} isDisabled={!motivo.trim()}>
                                        Eliminar
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

export default DeletePackingListModal;
