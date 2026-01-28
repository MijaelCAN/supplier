import React, { useState } from 'react';
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
import { DocumentTextIcon, CheckCircleIcon, XMarkIcon, ArrowUpTrayIcon as UploadIcon } from '@heroicons/react/24/outline';

interface DocumentFile {
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

interface DocumentType {
    key: string;
    label: string;
    accept: string;
    icon: React.ReactNode;
    description: string;
}

const DocumentsModal: React.FC<DocumentsModalProps> = ({
    isOpen,
    onOpenChange,
    selectedAppointment,
    handleUploadDocument,
    loadedDocuments = [],
}) => {
    // Función para mapear documentos cargados a tipos del modal
    const mapLoadedDocumentsToTypes = (docs: LoadedDocument[]): Record<string, DocumentFile> => {
        const mapped: Record<string, DocumentFile> = {
            invoice: { file: null, uploaded: false, progress: 0 },
            purchaseOrder: { file: null, uploaded: false, progress: 0 },
            deliveryGuide: { file: null, uploaded: false, progress: 0 },
            cdr: { file: null, uploaded: false, progress: 0 },
            xml: { file: null, uploaded: false, progress: 0 },
        };

        docs.forEach(doc => {
            const name = doc.name.toLowerCase();
            
            // Mapear según el nombre del archivo
            if (name.includes('fac') || name.includes('factura') || name.includes('invoice')) {
                mapped.invoice = { 
                    file: null, 
                    uploaded: true, 
                    progress: 100,
                    loadedName: doc.name,
                    loadedUrl: doc.url
                };
            } else if (name.includes('oc') || name.includes('orden') || name.includes('purchase')) {
                mapped.purchaseOrder = { 
                    file: null, 
                    uploaded: true, 
                    progress: 100,
                    loadedName: doc.name,
                    loadedUrl: doc.url
                };
            } else if (name.includes('gr') || name.includes('guia') || name.includes('remision') || name.includes('delivery')) {
                mapped.deliveryGuide = { 
                    file: null, 
                    uploaded: true, 
                    progress: 100,
                    loadedName: doc.name,
                    loadedUrl: doc.url
                };
            } else if (name.includes('cdr')) {
                mapped.cdr = { 
                    file: null, 
                    uploaded: true, 
                    progress: 100,
                    loadedName: doc.name,
                    loadedUrl: doc.url
                };
            } else if (name.includes('xml') && !name.includes('cdr')) {
                mapped.xml = { 
                    file: null, 
                    uploaded: true, 
                    progress: 100,
                    loadedName: doc.name,
                    loadedUrl: doc.url
                };
            }
        });

        return mapped;
    };

    // Inicializar con documentos cargados cuando se abre el modal
    const [documents, setDocuments] = useState<Record<string, DocumentFile>>(() => 
        mapLoadedDocumentsToTypes(loadedDocuments)
    );

    // Actualizar cuando cambian los documentos cargados o se abre el modal
    React.useEffect(() => {
        if (isOpen) {
            setDocuments(mapLoadedDocumentsToTypes(loadedDocuments));
        }
    }, [isOpen, loadedDocuments]);

    const documentTypes: DocumentType[] = [
        {
            key: 'invoice',
            label: 'Factura',
            accept: '.pdf,.jpg,.jpeg,.png',
            icon: <DocumentTextIcon className="w-5 h-5" />,
            description: 'PDF, JPG, PNG',
        },
        {
            key: 'purchaseOrder',
            label: 'Orden de Compra',
            accept: '.pdf,.jpg,.jpeg,.png',
            icon: <DocumentTextIcon className="w-5 h-5" />,
            description: 'PDF, JPG, PNG',
        },
        {
            key: 'deliveryGuide',
            label: 'Guía de Remisión',
            accept: '.pdf,.jpg,.jpeg,.png',
            icon: <DocumentTextIcon className="w-5 h-5" />,
            description: 'PDF, JPG, PNG',
        },
        {
            key: 'cdr',
            label: 'CDR',
            accept: '.pdf,.xml',
            icon: <DocumentTextIcon className="w-5 h-5" />,
            description: 'PDF, XML',
        },
        {
            key: 'xml',
            label: 'XML',
            accept: '.xml',
            icon: <DocumentTextIcon className="w-5 h-5" />,
            description: 'XML',
        },
    ];

    const handleFileSelect = async (type: string, file: File) => {
        if (!selectedAppointment) return;

        setDocuments((prev) => ({
            ...prev,
            [type]: { file, uploaded: false, progress: 0 },
        }));

        try {
            setDocuments((prev) => ({
                ...prev,
                [type]: { ...prev[type], progress: 50 },
            }));

            await handleUploadDocument(type, file);

            setDocuments((prev) => ({
                ...prev,
                [type]: { file, uploaded: true, progress: 100 },
            }));
        } catch (error) {
            setDocuments((prev) => ({
                ...prev,
                [type]: { file: null, uploaded: false, progress: 0 },
            }));
        }
    };

    const handleRemoveFile = (type: string) => {
        setDocuments((prev) => ({
            ...prev,
            [type]: { file: null, uploaded: false, progress: 0 },
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
                                    const doc = documents[docType.key];
                                    const hasFile = doc.file !== null;

                                    return (
                                        <div
                                            key={docType.key}
                                            className="relative rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 transition-all hover:border-blue-400 dark:hover:border-blue-600"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                                        {docType.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold text-sm">
                                                                {docType.label}
                                                            </p>
                                                            {doc.uploaded && (
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
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-3">
                                                            {docType.description}
                                                        </p>

                                                        {(hasFile || doc.uploaded) ? (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                                        {doc.file ? doc.file.name : (doc.loadedName || 'Documento cargado')}
                                                                    </p>
                                                                    {doc.file && (
                                                                        <p className="text-xs text-gray-500 ml-2">
                                                                            {formatFileSize(doc.file.size)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {doc.progress > 0 && doc.progress < 100 && (
                                                                    <Progress
                                                                        value={doc.progress}
                                                                        size="sm"
                                                                        color="primary"
                                                                        classNames={{
                                                                            indicator: 'bg-gradient-to-r from-blue-500 to-blue-600',
                                                                        }}
                                                                    />
                                                                )}
                                                                {doc.uploaded && doc.loadedUrl && (
                                                                    <a 
                                                                        href={doc.loadedUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                                    >
                                                                        Ver documento
                                                                    </a>
                                                                )}
                                                                {doc.uploaded && !doc.file && (
                                                                    <label className="cursor-pointer inline-block">
                                                                        <input
                                                                            type="file"
                                                                            accept={docType.accept}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    handleFileSelect(docType.key, file);
                                                                                }
                                                                            }}
                                                                            className="hidden"
                                                                        />
                                                                        <span className="text-xs text-blue-600 hover:text-blue-800 underline">
                                                                            Cambiar archivo
                                                                        </span>
                                                                    </label>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer">
                                                                <input
                                                                    type="file"
                                                                    accept={docType.accept}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            handleFileSelect(docType.key, file);
                                                                        }
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                                                    <UploadIcon className="w-4 h-4" />
                                                                    <span className="text-sm font-medium">
                                                                        Seleccionar archivo
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                {hasFile && (
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        onPress={() => handleRemoveFile(docType.key)}
                                                        className="min-w-0"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Nota:</strong> Los archivos se cargan automáticamente al seleccionarlos
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