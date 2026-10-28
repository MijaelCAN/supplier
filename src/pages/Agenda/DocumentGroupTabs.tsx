// src/pages/Agenda/DocumentGroupTabs.tsx
import {ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import {Button, Spinner, Tab, Tabs} from "@heroui/react";
import {
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    DocumentTextIcon,
    TrashIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";

export interface GroupedDocument {
    name: string;
    url: string;
    type: string;
    docEntry?: string; // DocEntry del documento en el API (necesario para eliminarlo)
}

export interface NumberEntry {
    number: string;
    /** Texto al lado del número (ej: "Guía T070-0211277") */
    detail?: string;
    /** true: va en "Pendientes"; false: en "Con factura registrada"; sin dato: sin separar */
    pending?: boolean;
}

export interface DocumentGroup {
    key: string;
    label: string;
    docs: GroupedDocument[];
    /** Pestaña sin archivos que solo muestra números (Parte de Ingreso, hasta que se tenga el documento) */
    numbers?: NumberEntry[];
    emptyMessage?: string;
}

/** Abre el PDF del número (ej: Parte de Ingreso); se resuelve al terminar de abrirlo o avisar que no existe */
type OpenNumberDocument = (entry: NumberEntry) => Promise<void>;

/** Nombre con que se muestra el PDF del Parte de Ingreso */
export const getParteIngresoFileName = (number: string) => `Parte_Ingreso_${number}.pdf`;

const NumberRow = ({entry, onOpenDocument}: {entry: NumberEntry; onOpenDocument?: OpenNumberDocument}) => {
    const [isOpening, setIsOpening] = useState(false);
    const handleOpen = async () => {
        if (!onOpenDocument || isOpening) return;
        setIsOpening(true);
        try {
            await onOpenDocument(entry);
        } finally {
            setIsOpening(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
                <DocumentTextIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="text-sm text-gray-600">N.º</span>
                <span className="text-sm font-semibold text-gray-900">{entry.number}</span>
                {entry.detail && <span className="text-sm text-gray-600 truncate">· {entry.detail}</span>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                {onOpenDocument && (
                    <button
                        type="button"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-400 disabled:no-underline"
                        onClick={handleOpen}
                        disabled={isOpening}
                        title={`Ver PDF del Parte de Ingreso ${entry.number}`}
                    >
                        {isOpening ? <Spinner size="sm" /> : <DocumentTextIcon className="w-4 h-4" />}
                        <span className="truncate max-w-[220px]">{getParteIngresoFileName(entry.number)}</span>
                    </button>
                )}
                {entry.pending
                    ? <ClockIcon className="w-5 h-5 text-amber-500" />
                    : <CheckCircleIcon className="w-5 h-5 text-emerald-500" />}
            </div>
        </div>
    );
};

/** Pendientes arriba y con factura abajo, para ubicar rápido lo que falta (OBS-022) */
export const NumberList = ({entries, onOpenDocument}: {entries: NumberEntry[]; onOpenDocument?: OpenNumberDocument}) => {
    const pending = entries.filter((entry) => entry.pending === true);
    const done = entries.filter((entry) => entry.pending === false);
    const unknown = entries.filter((entry) => entry.pending === undefined);
    const sections = [
        {key: 'pending', title: 'Pendientes de registrar factura', className: 'text-amber-700', items: pending},
        {key: 'done', title: 'Con factura registrada', className: 'text-emerald-700', items: done},
    ];

    if (pending.length === 0 && done.length === 0) {
        return (
            <div className="mt-4 space-y-2">
                {unknown.map((entry) => <NumberRow key={entry.number} entry={entry} onOpenDocument={onOpenDocument} />)}
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-1">
            {sections.filter((section) => section.items.length > 0).map((section) => (
                <div key={section.key} className="space-y-2">
                    <p className={`text-xs font-semibold uppercase ${section.className}`}>
                        {section.title} ({section.items.length})
                    </p>
                    {section.items.map((entry) => <NumberRow key={entry.number} entry={entry} onOpenDocument={onOpenDocument} />)}
                </div>
            ))}
            {unknown.length > 0 && (
                <div className="space-y-2">
                    {unknown.map((entry) => <NumberRow key={entry.number} entry={entry} onOpenDocument={onOpenDocument} />)}
                </div>
            )}
        </div>
    );
};

interface DocumentGroupTabsProps {
    groups: DocumentGroup[];
    onDocumentClick: (doc: GroupedDocument) => void;
    /** Si se pasa, muestra la papelera en los documentos guardados (con docEntry) - OBS-005 */
    onDeleteDocument?: (doc: GroupedDocument) => void;
    /** Contenido extra a la izquierda del tipo de archivo (ej: estado SUNAT de la factura) */
    renderDocumentBadge?: (doc: GroupedDocument, group: DocumentGroup) => ReactNode;
}

const SCROLL_STEP = 200;

/**
 * Pestañas de documentos por tipo (mismo estilo que el perfil del proveedor).
 * HeroUI oculta la barra de scroll de las pestañas, así que con muchos tipos se agregan
 * flechas ‹ › para llegar a las que no caben en pantalla.
 */
const DocumentGroupTabs = ({groups, onDocumentClick, onDeleteDocument, renderDocumentBadge}: DocumentGroupTabsProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const getTabList = () => containerRef.current?.querySelector<HTMLElement>('[role="tablist"]') ?? null;

    const updateScrollState = useCallback(() => {
        const tabList = getTabList();
        if (!tabList) return;
        setCanScrollLeft(tabList.scrollLeft > 0);
        setCanScrollRight(tabList.scrollLeft + tabList.clientWidth < tabList.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const tabList = getTabList();
        if (!tabList) return;
        updateScrollState();
        tabList.addEventListener('scroll', updateScrollState);
        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(tabList);
        return () => {
            tabList.removeEventListener('scroll', updateScrollState);
            resizeObserver.disconnect();
        };
    }, [groups.length, updateScrollState]);

    const scrollTabs = (direction: -1 | 1) => {
        getTabList()?.scrollBy({left: direction * SCROLL_STEP, behavior: 'smooth'});
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {canScrollLeft && (
                <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    radius="full"
                    aria-label="Ver pestañas anteriores"
                    className="absolute left-0 top-1 z-20 bg-white shadow"
                    onPress={() => scrollTabs(-1)}
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </Button>
            )}
            {canScrollRight && (
                <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    radius="full"
                    aria-label="Ver más pestañas"
                    className="absolute right-0 top-1 z-20 bg-white shadow"
                    onPress={() => scrollTabs(1)}
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </Button>
            )}
            <Tabs
                aria-label="Documentos por tipo"
                className="w-full"
                defaultSelectedKey={groups.find((group) => group.docs.length > 0)?.key}
                classNames={{
                    // Alineado a la izquierda: con 9-10 tipos no caben y, centrados, los de los extremos quedaban inalcanzables
                    tabList: "w-full justify-start gap-4",
                    cursor: "w-full",
                    tab: "max-w-fit",
                }}
            >
                {groups.map((group) => (
                    <Tab
                        key={group.key}
                        title={
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="h-4 w-4" />
                                <span>{group.label} ({group.numbers ? group.numbers.length : group.docs.length})</span>
                            </div>
                        }
                    >
                        {group.numbers ? (
                            group.numbers.length === 0 ? (
                                <div className="mt-4 flex items-center gap-2 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-100">
                                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                                    {group.emptyMessage ?? `Sin ${group.label}`}
                                </div>
                            ) : (
                                <NumberList entries={group.numbers} />
                            )
                        ) : group.docs.length === 0 ? (
                            <div className="mt-4 flex items-center gap-2 p-3 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-100">
                                <XCircleIcon className="w-5 h-5 text-amber-500" />
                                Falta cargar {group.label}
                            </div>
                        ) : (
                            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
                                {group.docs.map((doc, index) => (
                                    <div
                                        key={`${group.key}-${index}`}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                                        onClick={() => onDocumentClick(doc)}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <DocumentTextIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                                                {doc.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {renderDocumentBadge?.(doc, group)}
                                            <span className="text-xs text-gray-500 uppercase">{doc.type}</span>
                                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                            {onDeleteDocument && doc.docEntry && (
                                                // stopPropagation: que no abra el visor de la fila al eliminar
                                                <span onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        aria-label="Eliminar documento"
                                                        onPress={() => onDeleteDocument(doc)}
                                                        className="min-w-0"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Tab>
                ))}
            </Tabs>
        </div>
    );
};

export default DocumentGroupTabs;
