// src/pages/Agenda/DocumentGroupTabs.tsx
import {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Tab, Tabs} from "@heroui/react";
import {
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";

export interface GroupedDocument {
    name: string;
    url: string;
    type: string;
}

export interface DocumentGroup {
    key: string;
    label: string;
    docs: GroupedDocument[];
}

interface DocumentGroupTabsProps {
    groups: DocumentGroup[];
    onDocumentClick: (doc: GroupedDocument) => void;
}

const SCROLL_STEP = 200;

/**
 * Pestañas de documentos por tipo (mismo estilo que el perfil del proveedor).
 * HeroUI oculta la barra de scroll de las pestañas, así que con muchos tipos se agregan
 * flechas ‹ › para llegar a las que no caben en pantalla.
 */
const DocumentGroupTabs = ({groups, onDocumentClick}: DocumentGroupTabsProps) => {
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
                                <span>{group.label} ({group.docs.length})</span>
                            </div>
                        }
                    >
                        {group.docs.length === 0 ? (
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
                                            <span className="text-xs text-gray-500 uppercase">{doc.type}</span>
                                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
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
