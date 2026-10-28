import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Progress,
    Chip,
    Select,
    SelectItem,
} from '@heroui/react';
import { CheckCircleIcon, ClockIcon, LockClosedIcon, XMarkIcon, ArrowUpTrayIcon as UploadIcon } from '@heroicons/react/24/outline';
import {
    COMMERCIAL_DOCUMENT_TYPES,
    CommercialDocumentType,
    isInvoiceXmlFileName,
    mapFileNameToDocumentType,
    meetsRequiredFile
} from "@/config/commercialDocuments";
import { isCdrXml, isXmlFile } from "@/services/agenda/sunatInvoiceApi";

interface DocumentFile {
    id: string;
    file: File | null;
    uploaded: boolean;
    progress: number;
    loadedName?: string;
    loadedUrl?: string;
    loadedDocEntry?: string;
}

export interface LoadedDocument {
    name: string;
    url: string;
    type: string;
    docEntry?: string; // DocEntry del documento en el API (necesario para eliminarlo)
    packingList?: string; // Packing list al que pertenece
}

interface DocumentsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAppointment: any;
    handleUploadDocument: (type: string, file: File, packingList?: string) => Promise<void>;
    loadedDocuments?: LoadedDocument[];
    /**
     * Packing lists de la cita: los documentos se cargan a uno de ellos (con uno solo se preselecciona).
     * Sin packing lists, el modal trabaja sobre la cita entera.
     */
    packingLists?: string[];
    /** Si se pasa, los documentos ya cargados muestran la opción de eliminar (OBS-005) */
    onDeleteDocument?: (doc: LoadedDocument) => void;
    /**
     * Proveedor: orden obligatorio. 1) XML de la factura, 2) PDF de la factura, 3) el resto de documentos.
     * Hasta cumplir cada paso no se puede cargar lo siguiente.
     */
    enforceInvoiceOrder?: boolean;
}

const INVOICE_TYPE = 'invoice';

const generateEntryId = (type: string): string =>
    `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DocumentsModal: React.FC<DocumentsModalProps> = ({
    isOpen,
    onOpenChange,
    selectedAppointment,
    handleUploadDocument,
    loadedDocuments = [],
    packingLists = [],
    onDeleteDocument,
    enforceInvoiceOrder = false,
}) => {
    // Estado para tipos de documentos (puede venir de API en el futuro)
    const [documentTypes ] = useState<CommercialDocumentType[]>(COMMERCIAL_DOCUMENT_TYPES);

    // Packing list al que se cargan los documentos: con varios, el proveedor elige al abrir
    const hasPackingLists = packingLists.length > 0;
    const packingListsKey = packingLists.join('|');
    const [selectedPackingList, setSelectedPackingList] = useState('');
    useEffect(() => {
        if (isOpen) setSelectedPackingList(packingLists.length === 1 ? packingLists[0] : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, packingListsKey]);
    const needsPackingList = hasPackingLists && !selectedPackingList;
    const packingListDocuments = useMemo(
        () => hasPackingLists ? loadedDocuments.filter((doc) => doc.packingList === selectedPackingList) : loadedDocuments,
        [hasPackingLists, loadedDocuments, selectedPackingList]
    );

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
                    loadedUrl: doc.url,
                    loadedDocEntry: doc.docEntry
                });
            }
        });

        return mapped;
    };

    // Inicializar con documentos cargados cuando se abre el modal
    const [documents, setDocuments] = useState<Record<string, DocumentFile[]>>(() =>
        mapLoadedDocumentsToTypes(packingListDocuments)
    );

    // Actualizar cuando cambian los documentos cargados, el packing list elegido o se abre el modal
    useEffect(() => {
        if (isOpen) {
            setDocuments(mapLoadedDocumentsToTypes(packingListDocuments));
        }
    }, [isOpen, packingListDocuments, documentTypes]);

    // Orden de carga del proveedor: se mira lo ya subido de la factura (nombre original o el guardado)
    const invoiceFileNames = (documents[INVOICE_TYPE] || [])
        .filter((entry) => entry.uploaded)
        .map((entry) => entry.file?.name ?? entry.loadedName ?? '');
    const hasInvoiceXml = invoiceFileNames.some(isInvoiceXmlFileName);
    const hasInvoicePdf = invoiceFileNames.some((name) => /\.pdf$/i.test(name));

    /** Por qué no se puede cargar todavía este tipo (null = se puede) */
    const getLockReason = (type: string): string | null => {
        if (!enforceInvoiceOrder) return null;
        if (type === INVOICE_TYPE) return null;
        if (!hasInvoiceXml) return 'Primero sube el XML de la factura.';
        if (!hasInvoicePdf) return 'Primero sube el PDF de la factura.';
        return null;
    };

    /** Mientras falte el XML, la factura solo acepta .xml */
    const getAccept = (docType: CommercialDocumentType): string =>
        enforceInvoiceOrder && docType.key === INVOICE_TYPE && !hasInvoiceXml ? '.xml' : docType.accept;

    const handleFileSelect = async (type: string, file: File) => {
        if (!selectedAppointment) return;
        if (needsPackingList) {
            alert('Selecciona el Packing List al que pertenecen los documentos.');
            return;
        }

        if (enforceInvoiceOrder) {
            const lockReason = getLockReason(type);
            if (lockReason) {
                alert(lockReason);
                return;
            }
            // Primer archivo de la factura: debe ser su XML (ni el PDF ni el CDR, que también es XML)
            if (type === INVOICE_TYPE && !hasInvoiceXml) {
                const isInvoiceXml = isXmlFile(file.name) && !isCdrXml(await file.text().catch(() => ''));
                if (!isInvoiceXml) {
                    alert('El primer archivo de la factura debe ser su XML (no el PDF ni el CDR).');
                    return;
                }
            }
        }

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

            await handleUploadDocument(type, file, selectedPackingList || undefined);

            setDocuments((prev) => ({
                ...prev,
                [type]: (prev[type] || []).map((entry) =>
                    entry.id === entryId ? { ...entry, uploaded: true, progress: 100 } : entry
                ),
            }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'No se pudo subir el archivo');
            // Si falla la subida, se descarta solo esta entrada (no afecta a los demás archivos del tipo)
            setDocuments((prev) => ({
                ...prev,
                [type]: (prev[type] || []).filter((entry) => entry.id !== entryId),
            }));
        }
    };

    // Un archivo ya guardado solo se puede quitar eliminándolo en el API;
    // quitarlo solo de pantalla hacía que reapareciera al volver a abrir el modal.
    const canRemoveEntry = (entry: DocumentFile): boolean =>
        !entry.uploaded || (!!onDeleteDocument && !!entry.loadedDocEntry);

    const handleRemoveFile = (type: string, entry: DocumentFile) => {
        if (entry.uploaded) {
            if (onDeleteDocument && entry.loadedDocEntry) {
                onDeleteDocument({
                    name: entry.loadedName || '',
                    url: entry.loadedUrl || '',
                    type,
                    docEntry: entry.loadedDocEntry,
                });
            }
            return;
        }
        setDocuments((prev) => ({
            ...prev,
            [type]: (prev[type] || []).filter((e) => e.id !== entry.id),
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
                            {hasPackingLists && (
                                <Select
                                    label="Packing List"
                                    placeholder="Selecciona a qué Packing List pertenecen los documentos"
                                    size="sm"
                                    isRequired
                                    selectedKeys={selectedPackingList ? [selectedPackingList] : []}
                                    onSelectionChange={(keys) => setSelectedPackingList(String(Array.from(keys)[0] ?? ''))}
                                    isDisabled={packingLists.length === 1}
                                    className="mb-4"
                                >
                                    {packingLists.map((number) => (
                                        <SelectItem key={number}>{number}</SelectItem>
                                    ))}
                                </Select>
                            )}
                            {needsPackingList ? (
                                <div className="flex items-center gap-2 p-4 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-100">
                                    <LockClosedIcon className="w-4 h-4 flex-shrink-0" />
                                    La cita tiene varios Packing List: selecciona uno para ver y cargar sus documentos.
                                </div>
                            ) : (
                            <div className="space-y-4">
                                {documentTypes.map((docType) => {
                                    const entries = documents[docType.key] || [];
                                    const uploadedEntries = entries.filter((entry) => entry.uploaded);
                                    // La factura no queda cargada sin su XML (isRequiredFile)
                                    const hasUploaded = uploadedEntries.some((entry) =>
                                        meetsRequiredFile(docType.key, entry.file?.name ?? entry.loadedName ?? '')
                                    );
                                    const missingRequired = !hasUploaded && uploadedEntries.length > 0 && !!docType.isRequiredFile;
                                    const lockReason = getLockReason(docType.key);
                                    // Proveedor: qué toca subir en la factura
                                    const invoiceStep = enforceInvoiceOrder && docType.key === INVOICE_TYPE
                                        ? !hasInvoiceXml ? 'Paso 1: subir el XML de la factura'
                                            : !hasInvoicePdf ? 'Paso 2: subir el PDF de la factura'
                                            : null
                                        : null;

                                    return (
                                        <div
                                            key={docType.key}
                                            className={`relative rounded-lg border-2 border-dashed p-4 transition-all ${
                                                lockReason
                                                    ? 'border-gray-200 dark:border-gray-800 opacity-60'
                                                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                                            }`}
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
                                                        ) : docType.optional ? (
                                                            <Chip size="sm" variant="flat">
                                                                Opcional
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
                                                                {missingRequired ? `Falta ${docType.requiredLabel}` : 'Pendiente'}
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
                                                                    {canRemoveEntry(entry) && (
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="light"
                                                                            color="danger"
                                                                            aria-label="Eliminar documento"
                                                                            onPress={() => handleRemoveFile(docType.key, entry)}
                                                                            className="min-w-0 flex-shrink-0"
                                                                        >
                                                                            <XMarkIcon className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {lockReason ? (
                                                        <div className="flex items-center gap-2 text-gray-400">
                                                            <LockClosedIcon className="w-4 h-4" />
                                                            <span className="text-sm">{lockReason}</span>
                                                        </div>
                                                    ) : (
                                                        <label className="cursor-pointer inline-block">
                                                            <input
                                                                type="file"
                                                                accept={getAccept(docType)}
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
                                                                    {invoiceStep ?? (entries.length === 0 ? 'Seleccionar archivo' : 'Agregar otro archivo')}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            )}

                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Nota:</strong> Los archivos se cargan automáticamente al seleccionarlos. Puedes agregar más de un archivo por tipo de documento.
                                    {enforceInvoiceOrder && ' Primero sube el XML de la factura, luego su PDF; después se habilitan los demás documentos.'}
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
