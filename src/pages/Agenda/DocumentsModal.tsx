import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Progress,
    Chip,
} from '@heroui/react';
import { CheckCircleIcon, ClockIcon, XMarkIcon, ArrowUpTrayIcon as UploadIcon } from '@heroicons/react/24/outline';
import {
    COMMERCIAL_DOCUMENT_TYPES,
    CommercialDocumentType,
    mapFileNameToDocumentType
} from "@/config/commercialDocuments";

interface DocumentFile {
    id: string;
    file: File | null;
    uploaded: boolean;
    progress: number;
    loadedName?: string;
    loadedUrl?: string;
}

interface LoadedDocument {
    name: string;
    url: string;
    type: string;
}

interface DocumentsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAppointment: any;
    handleUploadDocument: (type: string, file: File) => Promise<void>;
    loadedDocuments?: LoadedDocument[];
}

const generateEntryId = (type: string): string =>
    `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DocumentsModal: React.FC<DocumentsModalProps> = ({
    isOpen,
    onOpenChange,
    selectedAppointment,
    handleUploadDocument,
    loadedDocuments = [],
}) => {
    // Estado para tipos de documentos (puede venir de API en el futuro)
    const [documentTypes ] = useState<CommercialDocumentType[]>(COMMERCIAL_DOCUMENT_TYPES);

    // Cargar tipos de documentos (puede venir de API en el futuro)
    useEffect(() => {
        // Por ahora usamos la configuración estática
        // En el futuro se puede descomentar para cargar desde API:
        // loadDocumentTypesFromApi().then(setDocumentTypes);
    }, []);

    // Función para mapear documentos cargados a tipos del modal.
    // Cada tipo ahora es un arreglo: un mismo tipo puede tener múltiples archivos cargados.
    const mapLoadedDocumentsToTypes = (docs: LoadedDocument[]): Record<string, DocumentFile[]> => {
        // Inicializar todos los tipos de documentos con arreglo vacío
        const mapped: Record<string, DocumentFile[]> = {};
        documentTypes.forEach(docType => {
            mapped[docType.key] = [];
        });

        // Mapear documentos cargados según sus nombres, acumulando por tipo
        docs.forEach(doc => {
            const documentTypeKey = mapFileNameToDocumentType(doc.name);
            if (documentTypeKey && mapped[documentTypeKey]) {
                mapped[documentTypeKey].push({
                    id: generateEntryId(documentTypeKey),
                    file: null,
                    uploaded: true,
                    progress: 100,
                    loadedName: doc.name,
                    loadedUrl: doc.url
                });
            }
        });

        return mapped;
    };

    // Inicializar con documentos cargados cuando se abre el modal
    const [documents, setDocuments] = useState<Record<string, DocumentFile[]>>(() =>
        mapLoadedDocumentsToTypes(loadedDocuments)
    );

    // Actualizar cuando cambian los documentos cargados, tipos de documentos o se abre el modal
    useEffect(() => {
        if (isOpen) {
            setDocuments(mapLoadedDocumentsToTypes(loadedDocuments));
        }
    }, [isOpen, loadedDocuments, documentTypes]);

    const handleFileSelect = async (type: string, file: File) => {
        if (!selectedAppointment) return;

        const entryId = generateEntryId(type);
        const newEntry: DocumentFile = { id: entryId, file, uploaded: false, progress: 0 };

        setDocuments((prev) => ({
            ...prev,
            [type]: [...(prev[type] || []), newEntry],
        }));

        try {
            setDocuments((prev) => ({
                ...prev,
                [type]: (prev[type] || []).map((entry) =>
                    entry.id === entryId ? { ...entry, progress: 50 } : entry
                ),
            }));

            await handleUploadDocument(type, file);

            setDocuments((prev) => ({
                ...prev,
                [type]: (prev[type] || []).map((entry) =>
                    entry.id === entryId ? { ...entry, uploaded: true, progress: 100 } : entry
                ),
            }));
        } catch (error) {
            // Si falla la subida, se descarta solo esta entrada (no afecta a los demás archivos del tipo)
            setDocuments((prev) => ({
                ...prev,
                [type]: (prev[type] || []).filter((entry) => entry.id !== entryId),
            }));
        }
    };

    const handleRemoveFile = (type: string, entryId: string) => {
        setDocuments((prev) => ({
            ...prev,
            [type]: (prev[type] || []).filter((entry) => entry.id !== entryId),
        }));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: 'bg-white dark:bg-gray-900',
                header: 'border-b border-gray-200 dark:border-gray-800',
                body: 'py-6',
                footer: 'border-t border-gray-200 dark:border-gray-800',
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h3 className="text-xl font-semibold">Cargar Documentos</h3>
                            <p className="text-sm font-normal text-gray-500">
                                Sube los documentos necesarios para la cita
                            </p>
                        </ModalHeader>

                        <ModalBody>
                            <div className="space-y-4">
                                {documentTypes.map((docType) => {
                                    const entries = documents[docType.key] || [];
                                    const hasUploaded = entries.some((entry) => entry.uploaded);

                                    return (
                                        <div
                                            key={docType.key}
                                            className="relative rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 transition-all hover:border-blue-400 dark:hover:border-blue-600"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                                    {docType.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-sm">
                                                            {docType.label}
                                                        </p>
                                                        {hasUploaded ? (
                                                            <Chip
                                                                size="sm"
                                                                color="success"
                                                                variant="flat"
                                                                startContent={
                                                                    <CheckCircleIcon className="w-3 h-3" />
                                                                }
                                                            >
                                                                Cargado
                                                            </Chip>
                                                        ) : (
                                                            <Chip
                                                                size="sm"
                                                                color="warning"
                                                                variant="flat"
                                                                startContent={
                                                                    <ClockIcon className="w-3 h-3" />
                                                                }
                                                            >
                                                                Pendiente
                                                            </Chip>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-3">
                                                        {docType.description}
                                                    </p>

                                                    {entries.length > 0 && (
                                                        <div className="space-y-2 mb-3">
                                                            {entries.map((entry) => (
                                                                <div
                                                                    key={entry.id}
                                                                    className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                                                {entry.file ? entry.file.name : (entry.loadedName || 'Documento cargado')}
                                                                            </p>
                                                                            {entry.file && (
                                                                                <p className="text-xs text-gray-500 flex-shrink-0">
                                                                                    {formatFileSize(entry.file.size)}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        {entry.progress > 0 && entry.progress < 100 && (
                                                                            <Progress
                                                                                value={entry.progress}
                                                                                size="sm"
                                                                                color="primary"
                                                                                classNames={{
                                                                                    indicator: 'bg-gradient-to-r from-blue-500 to-blue-600',
                                                                                }}
                                                                                className="mt-1"
                                                                            />
                                                                        )}
                                                                        {entry.uploaded && entry.loadedUrl && (
                                                                            <a
                                                                                href={entry.loadedUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                                            >
                                                                                Ver documento
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="light"
                                                                        color="danger"
                                                                        onPress={() => handleRemoveFile(docType.key, entry.id)}
                                                                        className="min-w-0 flex-shrink-0"
                                                                    >
                                                                        <XMarkIcon className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <label className="cursor-pointer inline-block">
                                                        <input
                                                            type="file"
                                                            accept={docType.accept}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    handleFileSelect(docType.key, file);
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                                            <UploadIcon className="w-4 h-4" />
                                                            <span className="text-sm font-medium">
                                                                {entries.length === 0 ? 'Seleccionar archivo' : 'Agregar otro archivo'}
                                                            </span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Nota:</strong> Los archivos se cargan automáticamente al seleccionarlos. Puedes agregar más de un archivo por tipo de documento.
                                </p>
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                color="primary"
                                variant="light"
                                onPress={onClose}
                            >
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DocumentsModal;
