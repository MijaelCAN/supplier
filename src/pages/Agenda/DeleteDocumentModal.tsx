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
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeleteDocumentModalProps {
    isOpen: boolean;
    documentName: string;
    onClose: () => void;
    onConfirm: (motivo: string) => Promise<void>;
}

/**
 * Confirmación para eliminar un documento de la cita (OBS-005).
 * Pide un motivo opcional y muestra el error del API si la eliminación falla.
 */
const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
    isOpen,
    documentName,
    onClose,
    onConfirm,
}) => {
    const [motivo, setMotivo] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMotivo('');
            setError(null);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm(motivo.trim());
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al eliminar el documento');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => { if (!open && !isDeleting) onClose(); }}
            size="md"
            isDismissable={!isDeleting}
            hideCloseButton={isDeleting}
        >
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                    Eliminar documento
                </ModalHeader>
                <ModalBody>
                    <p className="text-sm text-gray-700">
                        ¿Seguro que deseas eliminar el documento{' '}
                        <span className="font-semibold break-all">{documentName}</span>?
                    </p>
                    <p className="text-xs text-gray-500">
                        El documento dejará de mostrarse en la cita. Si con esto faltan documentos, la cita volverá a quedar con documentos pendientes.
                    </p>
                    <Textarea
                        label="Motivo (opcional)"
                        placeholder="Ej. Se cargó la factura equivocada"
                        value={motivo}
                        onValueChange={setMotivo}
                        maxLength={250}
                        isDisabled={isDeleting}
                        minRows={2}
                    />
                    {error && <p className="text-sm text-danger">{error}</p>}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose} isDisabled={isDeleting}>
                        Cancelar
                    </Button>
                    <Button color="danger" onPress={handleConfirm} isLoading={isDeleting}>
                        Eliminar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeleteDocumentModal;
