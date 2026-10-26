// src/pages/PartesIngreso/DocumentViewerPanel.tsx
// Visor lateral para cotejar los PDF de cada parte contra su factura, OC y guía sin salir de la pantalla ni tapar la tabla.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Spinner, Tooltip } from '@heroui/react';
import {
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    ArrowTopRightOnSquareIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ParteIngresoContabilidad } from '@/services/contabilidad/partesIngresoApi';
import { fetchParteIngresoPdfUrl } from '@/services/agenda/packingListApi';
import { formatFecha, formatTotal, getDocumentosVisor } from './partesIngresoReport';

export interface VisorSeleccion {
    parte: number;              // numeroParteIngreso
    documento: string;          // PARTE_INGRESO_DOC_KEY o key del DocumentoLink
}

interface DocumentViewerPanelProps {
    /** Filas en el orden de la tabla (filtradas y ordenadas): la navegación las recorre en ese orden */
    rows: ParteIngresoContabilidad[];
    seleccion: VisorSeleccion;
    onChange: (seleccion: VisorSeleccion) => void;
    onClose: () => void;
    ampliado: boolean;
    onToggleAmpliado: () => void;
}

/** Ancho del panel; la página deja ese mismo margen a la derecha para que la tabla no quede debajo */
export const VISOR_ANCHO = {
    normal: { panel: 'md:w-[50vw] xl:w-[45vw]', margen: 'md:mr-[50vw] xl:mr-[45vw]' },
    ampliado: { panel: 'md:w-[65vw] xl:w-[60vw]', margen: 'md:mr-[65vw] xl:mr-[60vw]' },
};

/**
 * El PDF del Parte de Ingreso no viene en el listado: se pide a SAP (/api/Documentos/EntradaMarcancia) al
 * seleccionar el parte. Como demora, va al final y no se abre por defecto: se habilita cuando termina de cargar.
 */
export const PARTE_INGRESO_DOC_KEY = 'parteIngreso';

type ParteIngresoPdf =
    | { status: 'cargando' }
    | { status: 'ok'; url: string }
    | { status: 'sin-pdf' }
    | { status: 'error'; mensaje: string };

interface DocumentoPanel {
    key: string;
    label: string;
    url: string | null;         // null para el Parte de Ingreso: su URL sale de la consulta a SAP
}

/** Documentos del parte en el orden del visor: los PDF de la cita y al final el Parte de Ingreso */
const getDocumentosPanel = (row: ParteIngresoContabilidad): DocumentoPanel[] => [
    ...getDocumentosVisor(row).map(({ key, label, url }) => ({ key, label, url })),
    { key: PARTE_INGRESO_DOC_KEY, label: 'Parte de ingreso', url: null },
];

/** Documento con que se abre un parte: el primer PDF de la cita (el Parte de Ingreso solo si no hay otro) */
export const getDocumentoInicial = (row: ParteIngresoContabilidad): string =>
    getDocumentosVisor(row)[0]?.key ?? PARTE_INGRESO_DOC_KEY;

/** El visor del navegador ajusta la página al ancho del panel; todas las páginas se recorren con scroll */
const getVisorUrl = (url: string) => `${url}#view=FitH`;

const DocumentViewerPanel = ({ rows, seleccion, onChange, onClose, ampliado, onToggleAmpliado }: DocumentViewerPanelProps) => {
    const rowIndex = rows.findIndex((r) => r.numeroParteIngreso === seleccion.parte);
    const row = rowIndex >= 0 ? rows[rowIndex] : null;
    const documentos = useMemo(() => (row ? getDocumentosPanel(row) : []), [row]);
    const docIndex = Math.max(0, documentos.findIndex((d) => d.key === seleccion.documento));
    const documento = documentos[docIndex] ?? null;

    // PDF del Parte de Ingreso por número de parte; se consulta una sola vez y las URL blob: se liberan al cerrar
    const [partesPdf, setPartesPdf] = useState<Record<number, ParteIngresoPdf>>({});
    const blobUrls = useRef<string[]>([]);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const cargarParteIngreso = useCallback(async (parte: number) => {
        setPartesPdf((prev) => ({ ...prev, [parte]: { status: 'cargando' } }));
        let resultado: ParteIngresoPdf;
        try {
            const url = await fetchParteIngresoPdfUrl(String(parte));
            if (url && !mounted.current) {
                URL.revokeObjectURL(url);
                return;
            }
            if (url) blobUrls.current.push(url);
            resultado = url ? { status: 'ok', url } : { status: 'sin-pdf' };
        } catch (error) {
            console.error('Error al obtener el PDF del Parte de Ingreso:', error);
            resultado = { status: 'error', mensaje: error instanceof Error ? error.message : 'No se pudo consultar el Parte de Ingreso.' };
        }
        if (mounted.current) setPartesPdf((prev) => ({ ...prev, [parte]: resultado }));
    }, []);

    // Se pide apenas se selecciona el parte, aunque se esté viendo otro documento, para tenerlo listo
    const parteActual = row?.numeroParteIngreso ?? null;
    const parteActualPdf = parteActual !== null ? partesPdf[parteActual] : undefined;
    useEffect(() => {
        if (parteActual !== null && !parteActualPdf) cargarParteIngreso(parteActual);
    }, [parteActual, parteActualPdf, cargarParteIngreso]);

    const esParteIngreso = documento?.key === PARTE_INGRESO_DOC_KEY;
    const documentoUrl = esParteIngreso
        ? (parteActualPdf?.status === 'ok' ? parteActualPdf.url : null)
        : documento?.url ?? null;

    /**
     * Documentos a los que llega Anterior/Siguiente: el Parte de Ingreso solo cuando ya cargó (o si es el que se
     * está viendo, o el único del parte).
     */
    const getNavegables = (target: ParteIngresoContabilidad, actual?: string): string[] => {
        const docs = getDocumentosPanel(target).map((d) => d.key);
        const listo = partesPdf[target.numeroParteIngreso]?.status === 'ok';
        return docs.length === 1 ? docs : docs.filter((key) => key !== PARTE_INGRESO_DOC_KEY || listo || key === actual);
    };

    /** Documento anterior/siguiente; al terminar los del parte pasa al parte vecino */
    const getDocumentoVecino = (delta: 1 | -1): VisorSeleccion | null => {
        if (!row || !documento) return null;
        const navegables = getNavegables(row, documento.key);
        const next = navegables[navegables.indexOf(documento.key) + delta];
        if (next) return { parte: row.numeroParteIngreso, documento: next };
        const target = rows[rowIndex + delta];
        if (!target) return null;
        if (delta === 1) return { parte: target.numeroParteIngreso, documento: getDocumentoInicial(target) };
        const anteriores = getNavegables(target);
        return { parte: target.numeroParteIngreso, documento: anteriores[anteriores.length - 1] };
    };

    const getParteVecino = (delta: 1 | -1): VisorSeleccion | null => {
        const target = rows[rowIndex + delta];
        return target ? { parte: target.numeroParteIngreso, documento: getDocumentoInicial(target) } : null;
    };

    const docAnterior = getDocumentoVecino(-1);
    const docSiguiente = getDocumentoVecino(1);
    const parteAnterior = getParteVecino(-1);
    const parteSiguiente = getParteVecino(1);

    // El parte dejó de estar en la tabla (cambió un filtro o la búsqueda)
    useEffect(() => {
        if (!row) onClose();
    }, [row, onClose]);

    // ← → documento, Esc cierra (no mientras se escribe en un campo)
    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
            if (event.key === 'Escape') onClose();
            else if (event.key === 'ArrowRight' && docSiguiente) onChange(docSiguiente);
            else if (event.key === 'ArrowLeft' && docAnterior) onChange(docAnterior);
            else return;
            event.preventDefault();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [docAnterior, docSiguiente, onChange, onClose]);

    if (!row || !documento) return null;

    const datosCotejo = [
        { label: 'Factura', value: row.numeroFactura },
        { label: 'OC', value: row.ordenesCompra },
        { label: 'Guía', value: row.numeroGuia },
    ];

    const renderParteIngresoEstado = () => {
        if (!parteActualPdf || parteActualPdf.status === 'cargando') {
            return (
                <>
                    <Spinner color="primary" />
                    <p className="text-sm">Consultando el Parte de Ingreso {row.numeroParteIngreso} en SAP...</p>
                </>
            );
        }
        if (parteActualPdf.status === 'sin-pdf') {
            return (
                <>
                    <DocumentTextIcon className="h-12 w-12 opacity-50" />
                    <p className="text-sm">El Parte de Ingreso {row.numeroParteIngreso} aún no tiene documento.</p>
                </>
            );
        }
        if (parteActualPdf.status === 'error') {
            return (
                <>
                    <DocumentTextIcon className="h-12 w-12 opacity-50" />
                    <p className="max-w-sm text-center text-sm">{parteActualPdf.mensaje}</p>
                    <Button size="sm" variant="flat" color="primary" onPress={() => cargarParteIngreso(row.numeroParteIngreso)}>
                        Reintentar
                    </Button>
                </>
            );
        }
        return null;
    };

    return (
        <aside
            className={`fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 ${
                VISOR_ANCHO[ampliado ? 'ampliado' : 'normal'].panel
            }`}
            aria-label="Cotejo de documentos"
        >
            {/* Parte y navegación entre partes */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-800">
                <div className="flex items-center gap-1">
                    <Tooltip content="Parte anterior">
                        <Button isIconOnly size="sm" variant="light" isDisabled={!parteAnterior} onPress={() => parteAnterior && onChange(parteAnterior)} aria-label="Parte anterior">
                            <ChevronDoubleLeftIcon className="h-4 w-4" />
                        </Button>
                    </Tooltip>
                    <div className="px-1 text-sm">
                        <span className="text-gray-500">Parte </span>
                        <span className="font-semibold">{row.numeroParteIngreso}</span>
                        <span className="text-gray-500"> · {rowIndex + 1} de {rows.length}</span>
                    </div>
                    <Tooltip content="Parte siguiente">
                        <Button isIconOnly size="sm" variant="light" isDisabled={!parteSiguiente} onPress={() => parteSiguiente && onChange(parteSiguiente)} aria-label="Parte siguiente">
                            <ChevronDoubleRightIcon className="h-4 w-4" />
                        </Button>
                    </Tooltip>
                </div>
                <div className="flex items-center gap-1">
                    <Tooltip content={ampliado ? 'Reducir visor' : 'Ampliar visor'}>
                        <Button isIconOnly size="sm" variant="light" className="hidden md:flex" onPress={onToggleAmpliado} aria-label={ampliado ? 'Reducir visor' : 'Ampliar visor'}>
                            {ampliado ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
                        </Button>
                    </Tooltip>
                    {documentoUrl && (
                        <Tooltip content="Abrir en otra pestaña">
                            <Button isIconOnly size="sm" variant="light" onPress={() => window.open(documentoUrl, '_blank', 'noopener,noreferrer')} aria-label="Abrir en otra pestaña">
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip content="Cerrar (Esc)">
                        <Button isIconOnly size="sm" variant="light" onPress={onClose} aria-label="Cerrar visor">
                            <XMarkIcon className="h-5 w-5" />
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Datos a cotejar contra el documento */}
            <div className="space-y-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                <div className="grid grid-cols-3 gap-3">
                    {datosCotejo.map((dato) => (
                        <div key={dato.label} className="min-w-0">
                            <p className="text-[11px] font-medium uppercase text-gray-500">{dato.label}</p>
                            <p className="truncate font-mono text-sm font-semibold text-gray-900 dark:text-white" title={dato.value ?? undefined}>
                                {dato.value || '-'}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <span className="max-w-full truncate font-medium" title={row.proveedor}>{row.proveedor}</span>
                    <span>RUC {row.ruc}</span>
                    <span>{formatFecha(row.fechaParteIngreso)}</span>
                    <span className="font-medium">{formatTotal(row)}</span>
                </div>
            </div>

            {/* Documentos del parte */}
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4 py-2 dark:border-gray-800">
                {documentos.map((doc) => {
                    const seleccionado = doc.key === documento.key;
                    const esParte = doc.key === PARTE_INGRESO_DOC_KEY;
                    const parteCargando = esParte && (!parteActualPdf || parteActualPdf.status === 'cargando');
                    const parteSinPdf = esParte && (parteActualPdf?.status === 'sin-pdf' || parteActualPdf?.status === 'error');
                    return (
                        <button
                            key={doc.key}
                            type="button"
                            // Mientras SAP responde no se puede abrir (salvo que sea el único documento del parte)
                            disabled={parteCargando && !seleccionado}
                            title={parteCargando ? 'Cargando el Parte de Ingreso desde SAP...' : undefined}
                            onClick={() => onChange({ parte: row.numeroParteIngreso, documento: doc.key })}
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                seleccionado
                                    ? 'bg-blue-600 text-white'
                                    : parteCargando
                                        ? 'cursor-wait bg-gray-100 text-gray-400 dark:bg-gray-800'
                                        : parteSinPdf
                                            ? 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800'
                                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                            {parteCargando && (
                                <Spinner size="sm" color={seleccionado ? 'white' : 'primary'} classNames={{ wrapper: 'h-3 w-3' }} />
                            )}
                            {doc.label}
                        </button>
                    );
                })}
            </div>

            {/* PDF */}
            <div className="min-h-0 flex-1 bg-gray-100 dark:bg-gray-800">
                {documentoUrl ? (
                    <iframe key={documentoUrl} src={getVisorUrl(documentoUrl)} title={documento.label} className="block h-full w-full border-0" />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500">
                        {esParteIngreso && renderParteIngresoEstado()}
                    </div>
                )}
            </div>

            {/* Navegación entre documentos */}
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-4 py-2 dark:border-gray-800">
                <Button size="sm" variant="flat" isDisabled={!docAnterior} onPress={() => docAnterior && onChange(docAnterior)} startContent={<ChevronLeftIcon className="h-4 w-4" />}>
                    Anterior
                </Button>
                <p className="truncate text-center text-xs text-gray-500">
                    {documento.label} · {docIndex + 1} de {documentos.length}
                    <span className="hidden sm:inline"> · ← → para navegar</span>
                </p>
                <Button size="sm" variant="flat" color="primary" isDisabled={!docSiguiente} onPress={() => docSiguiente && onChange(docSiguiente)} endContent={<ChevronRightIcon className="h-4 w-4" />}>
                    Siguiente
                </Button>
            </div>
        </aside>
    );
};

export default DocumentViewerPanel;
