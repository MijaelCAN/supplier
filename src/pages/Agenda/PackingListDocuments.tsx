// src/pages/Agenda/PackingListDocuments.tsx
import {ReactNode, useEffect, useRef} from 'react';
import {addToast, Button, Chip, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs} from "@heroui/react";
import {CheckCircleIcon, ClockIcon, DocumentTextIcon, TrashIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {COMMERCIAL_DOCUMENT_TYPES, mapFileNameToDocumentType, meetsRequiredFile} from '@/config/commercialDocuments';
import {fetchParteIngresoPdfUrl} from '@/services/agenda/packingListApi';
import {areDocumentTypesComplete, PackingListDocumentGroup, UNASSIGNED_PACKING_LIST} from '@/utils/packingListDocuments';
import {getParteIngresoFileName, NumberEntry, NumberList} from './DocumentGroupTabs';
import type {LoadedDocument} from './DocumentsModal';

interface DocumentRow {
    key: string;
    typeLabel: string;
    /** Archivos del mismo tipo en el packing list (para el estado SUNAT de la factura) */
    typeDocs: LoadedDocument[];
    doc?: LoadedDocument;
    /** Fila de un tipo sin archivo válido: "Falta" o "Falta XML" */
    missing?: string;
    /** Tipo opcional sin archivo (ej: la Letra, OBS-030): se muestra para saber que se puede cargar */
    optional?: boolean;
}

interface PackingListDocumentsProps {
    groups: PackingListDocumentGroup[];
    /** Partes de Ingreso del packing list; undefined no muestra la sección */
    getParteIngreso?: (packingList: string) => NumberEntry[] | undefined;
    onDocumentClick: (doc: LoadedDocument) => void;
    /** Si se pasa, muestra la papelera en los documentos guardados (con docEntry) - OBS-005 */
    onDeleteDocument?: (doc: LoadedDocument) => void;
    /** Estado propio del archivo (ej: SUNAT en la factura); null muestra "Cargado" */
    renderStatus?: (doc: LoadedDocument, typeDocs: LoadedDocument[]) => ReactNode;
    /** N.º del documento (ej: serie-número de la factura); sin dato muestra "—" */
    getDocumentNumber?: (doc: LoadedDocument, typeDocs: LoadedDocument[]) => string | undefined;
    /** Archivo a resaltar; abre la pestaña de su packing list (ej: la factura que se abrió desde el cronograma de pagos) */
    highlightFileName?: string;
}

const getTabKey = (packingList: string) => packingList || 'unassigned';

const getPackingListLabel = (packingList: string) =>
    packingList === UNASSIGNED_PACKING_LIST ? 'Sin packing list' : packingList;

/**
 * Una fila por archivo, en el orden del modal de carga, una fila "Falta" por cada tipo requerido sin archivo válido
 * y una fila "Opcional" por cada tipo opcional sin archivos.
 */
const buildRows = (docs: LoadedDocument[]): DocumentRow[] => {
    const rows: DocumentRow[] = [];
    COMMERCIAL_DOCUMENT_TYPES.forEach((docType) => {
        const typeDocs = docs.filter((doc) => mapFileNameToDocumentType(doc.name) === docType.key);
        typeDocs.forEach((doc, index) => rows.push({key: `${docType.key}-${doc.docEntry ?? index}`, typeLabel: docType.label, typeDocs, doc}));
        if (docType.optional) {
            if (typeDocs.length === 0) {
                rows.push({key: `${docType.key}-optional`, typeLabel: docType.label, typeDocs, missing: 'Opcional', optional: true});
            }
        } else if (!typeDocs.some((doc) => meetsRequiredFile(docType.key, doc.name))) {
            rows.push({
                key: `${docType.key}-missing`,
                typeLabel: docType.label,
                typeDocs,
                missing: typeDocs.length > 0 && docType.requiredLabel ? `Falta ${docType.requiredLabel}` : 'Falta',
            });
        }
    });
    docs.filter((doc) => !mapFileNameToDocumentType(doc.name)).forEach((doc, index) =>
        rows.push({key: `other-${doc.docEntry ?? index}`, typeLabel: 'Otros', typeDocs: [], doc})
    );
    return rows;
};

/**
 * Documentos de la cita por packing list: con uno solo, la grilla directa; con varios, una pestaña por packing list.
 */
const PackingListDocuments = ({groups, getParteIngreso, onDocumentClick, onDeleteDocument, renderStatus, getDocumentNumber, highlightFileName}: PackingListDocumentsProps) => {
    const highlightedGroup = highlightFileName
        ? groups.find((group) => group.documents.some((doc) => doc.u_name_file === highlightFileName))
        : undefined;

    // PDF del Parte de Ingreso: se pide al API al abrirlo (por DocNum) y se guarda para no repetir la consulta
    const parteIngresoUrls = useRef(new Map<string, string>());
    useEffect(() => {
        const urls = parteIngresoUrls.current;
        return () => {
            urls.forEach((url) => url.startsWith('blob:') && URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);
    const handleOpenParteIngreso = async (entry: NumberEntry, packingList: string) => {
        try {
            let url = parteIngresoUrls.current.get(entry.number) ?? null;
            if (!url) {
                url = await fetchParteIngresoPdfUrl(entry.number);
                if (url) parteIngresoUrls.current.set(entry.number, url);
            }
            if (!url) {
                addToast({title: 'PDF no disponible', description: `El Parte de Ingreso ${entry.number} aún no tiene documento.`, color: 'warning'});
                return;
            }
            onDocumentClick({name: getParteIngresoFileName(entry.number), url, type: 'pdf', packingList});
        } catch (error) {
            console.error('Error al obtener el PDF del Parte de Ingreso:', error);
            addToast({title: 'No se pudo abrir el Parte de Ingreso', description: 'Intente nuevamente en unos minutos.', color: 'danger'});
        }
    };

    const renderGroup = (group: PackingListDocumentGroup) => {
        const docs: LoadedDocument[] = group.documents.map((doc) => ({
            name: doc.u_name_file,
            url: doc.u_link_documento,
            type: doc.u_name_file.split('.').pop()?.toLowerCase() || 'unknown',
            docEntry: doc.document_doc_entry,
            packingList: group.packingList,
        }));
        const rows = buildRows(docs);
        const parteIngreso = group.packingList === UNASSIGNED_PACKING_LIST ? undefined : getParteIngreso?.(group.packingList);

        return (
            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <Table aria-label={`Documentos del packing list ${getPackingListLabel(group.packingList)}`} removeWrapper isCompact>
                        <TableHeader>
                            <TableColumn width={140}>ESTADO</TableColumn>
                            <TableColumn width={180}>TIPO</TableColumn>
                            <TableColumn width={150}>N.º DOC</TableColumn>
                            <TableColumn>ARCHIVO</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.key} className={row.doc && row.doc.name === highlightFileName ? 'bg-blue-50' : undefined}>
                                    <TableCell>
                                        {row.doc ? (
                                            renderStatus?.(row.doc, row.typeDocs) ?? (
                                                <Chip size="sm" variant="flat" color="success" startContent={<CheckCircleIcon className="w-3 h-3" />}>
                                                    Cargado
                                                </Chip>
                                            )
                                        ) : row.optional ? (
                                            <Chip size="sm" variant="flat">
                                                {row.missing}
                                            </Chip>
                                        ) : (
                                            <Chip size="sm" variant="flat" color="warning" startContent={<XCircleIcon className="w-3 h-3" />}>
                                                {row.missing}
                                            </Chip>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-700 whitespace-nowrap">{row.typeLabel}</TableCell>
                                    <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                                        {(row.doc && getDocumentNumber?.(row.doc, row.typeDocs)) || '—'}
                                    </TableCell>
                                    <TableCell>
                                        {row.doc ? (
                                            <div className="flex items-center justify-between gap-2 min-w-0">
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-2 min-w-0 text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                    onClick={() => onDocumentClick(row.doc!)}
                                                    title={row.doc.name}
                                                >
                                                    <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate max-w-[280px]">{row.doc.name}</span>
                                                </button>
                                                {onDeleteDocument && row.doc.docEntry && (
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        aria-label="Eliminar documento"
                                                        onPress={() => onDeleteDocument(row.doc!)}
                                                        className="min-w-0 flex-shrink-0"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {parteIngreso && (
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Parte de Ingreso</p>
                        {parteIngreso.length === 0 ? (
                            <div className="mt-2 flex items-center gap-2 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-100">
                                <XCircleIcon className="w-5 h-5 text-gray-400" />
                                Aún no se ha generado el Parte de Ingreso
                            </div>
                        ) : (
                            <NumberList entries={parteIngreso} onOpenDocument={(entry) => handleOpenParteIngreso(entry, group.packingList)} />
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (groups.length === 0) return null;

    if (groups.length === 1) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-gray-600">
                    Packing List <span className="font-semibold text-gray-900">{getPackingListLabel(groups[0].packingList)}</span>
                </p>
                {renderGroup(groups[0])}
            </div>
        );
    }

    return (
        <Tabs
            aria-label="Documentos por packing list"
            className="w-full"
            defaultSelectedKey={highlightedGroup ? getTabKey(highlightedGroup.packingList) : undefined}
            classNames={{tabList: "w-full justify-start gap-4 overflow-x-auto", cursor: "w-full", tab: "max-w-fit"}}
        >
            {groups.map((group) => (
                <Tab
                    key={getTabKey(group.packingList)}
                    title={
                        <div className="flex items-center gap-2">
                            {group.packingList !== UNASSIGNED_PACKING_LIST && (areDocumentTypesComplete(group.documents)
                                ? <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                                : <ClockIcon className="h-4 w-4 text-amber-500" />)}
                            <span>{getPackingListLabel(group.packingList)} ({group.documents.length})</span>
                        </div>
                    }
                >
                    <div className="mt-2">{renderGroup(group)}</div>
                </Tab>
            ))}
        </Tabs>
    );
};

export default PackingListDocuments;
