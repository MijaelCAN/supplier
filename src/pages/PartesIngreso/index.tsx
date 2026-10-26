// src/pages/PartesIngreso/index.tsx
// Partes de Ingreso (Contabilidad): entradas de mercancía del rango, cuáles faltan facturar y los documentos de su cita.
import { Key, useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Card,
    CardBody,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    DropdownTrigger,
    Input,
    Pagination,
    Select,
    SelectItem,
    SortDescriptor,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
} from '@heroui/react';
import {
    ArrowDownTrayIcon,
    ArrowTopRightOnSquareIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    InboxArrowDownIcon,
    MagnifyingGlassIcon,
    ViewColumnsIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import Dashboard from '@/layouts/Dashboard';
import { DateInput } from '@/components/DateInput';
import {
    EstadoFactura,
    getProveedoresUnicos,
    listar,
    ParteIngresoContabilidad,
    PROVEEDORES_SIMULADOS,
    ProveedorParteIngreso,
    ValidacionDocumentos,
} from '@/services/contabilidad/partesIngresoApi';
import {
    DocumentoGrupo,
    DocumentoLink,
    exportPartesIngresoReport,
    formatFecha,
    formatTotal,
    getDocumentoGrupos,
    getDocumentosVisor,
    getOtrosDocumentos,
    isPdfLink,
    REGISTRO_SAP_LABELS,
} from './partesIngresoReport';
import DocumentViewerPanel, { getDocumentoInicial, VISOR_ANCHO, VisorSeleccion } from './DocumentViewerPanel';

const ROWS_PER_PAGE = 10;
const PAGE_PATH = '/contabilidad/partes-ingreso';
const REVISAR_TOOLTIP = 'Hay más de una entrega posible de la misma OC ese día. Validar los documentos contra el número de guía.';

const ESTADO_FACTURA_COLORS: Record<EstadoFactura, 'danger' | 'success'> = {
    'FALTA FACTURA': 'danger',
    'FACTURA REGISTRADA': 'success',
};

const VALIDACION_COLORS: Record<ValidacionDocumentos, 'success' | 'warning' | 'default'> = {
    'OK': 'success',
    'REVISAR': 'warning',
    'SIN CITA': 'default',
};

const CHIP_BASE = 'inline-flex items-center justify-center gap-1 min-w-[58px] rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap';
const CHIP_ACTIVE = `${CHIP_BASE} bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer`;
const CHIP_EMPTY = `${CHIP_BASE} bg-gray-100 text-gray-400 dark:bg-gray-800`;
const CHIP_OTROS = `${CHIP_BASE} bg-violet-50 text-violet-700 hover:bg-violet-100 cursor-pointer`;

interface DocumentosCellProps {
    grupos: DocumentoGrupo[];
    otros: DocumentoGrupo[];
    /** Abre el PDF en el visor de cotejo; los demás archivos (XML) se abren en otra pestaña */
    onVer: (linkKey: string) => void;
}

const abrirDocumento = (link: DocumentoLink, onVer: (linkKey: string) => void) => {
    if (isPdfLink(link)) onVer(link.key);
    else window.open(link.url, '_blank', 'noopener,noreferrer');
};

/**
 * Lista desplegable de los archivos de uno o varios tipos. Es una función y no un componente porque Dropdown
 * necesita el DropdownMenu como hijo directo para pasarle sus props.
 */
const renderDocumentosMenu = (label: string, grupos: DocumentoGrupo[], onVer: (linkKey: string) => void) => {
    const links = grupos.flatMap((grupo) => grupo.links);
    return (
        <DropdownMenu
            aria-label={label}
            className="max-h-80 overflow-y-auto"
            onAction={(key) => {
                const link = links.find((l) => l.key === key);
                if (link) abrirDocumento(link, onVer);
            }}
        >
            {grupos.map((grupo) => (
                <DropdownSection key={grupo.key} title={`${grupo.label} (${grupo.links.length})`} items={grupo.links}>
                    {(link) => (
                        <DropdownItem
                            key={link.key}
                            startContent={<DocumentTextIcon className="h-4 w-4" />}
                            endContent={!isPdfLink(link) && <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-gray-400" />}
                        >
                            {link.label}
                        </DropdownItem>
                    )}
                </DropdownSection>
            ))}
        </DropdownMenu>
    );
};

/**
 * Un chip por tipo con su cantidad (alto de fila fijo): gris si no hay archivos, abre directo si hay uno
 * y despliega la lista si hay varios.
 */
const DocumentosCell = ({ grupos, otros, onVer }: DocumentosCellProps) => (
    <div className="flex gap-1">
        {grupos.map((grupo) => {
            const content = <>{grupo.shortLabel} <span className="font-semibold">{grupo.links.length}</span></>;

            if (grupo.links.length === 0) {
                return (
                    <Tooltip key={grupo.key} content={`Sin documentos de ${grupo.label}`}>
                        <span className={CHIP_EMPTY}>{content}</span>
                    </Tooltip>
                );
            }

            if (grupo.links.length === 1) {
                const [link] = grupo.links;
                return (
                    <Tooltip key={grupo.key} content={isPdfLink(link) ? `Ver ${link.label}` : `Abrir ${link.label} en otra pestaña`}>
                        <button type="button" onClick={() => abrirDocumento(link, onVer)} className={CHIP_ACTIVE}>
                            {content}
                        </button>
                    </Tooltip>
                );
            }

            return (
                <Dropdown key={grupo.key} placement="bottom-end">
                    <DropdownTrigger>
                        <button type="button" className={CHIP_ACTIVE} aria-label={`Documentos de ${grupo.label}`}>
                            {content}
                        </button>
                    </DropdownTrigger>
                    {renderDocumentosMenu(`Documentos de ${grupo.label}`, [grupo], onVer)}
                </Dropdown>
            );
        })}
        {otros.length > 0 && <OtrosDocumentosChip otros={otros} onVer={onVer} />}
    </div>
);

/** Solo si la cita trae archivos de otros tipos (Letra, Hoja de Seguridad...): un chip con la lista agrupada por tipo */
const OtrosDocumentosChip = ({ otros, onVer }: { otros: DocumentoGrupo[]; onVer: (linkKey: string) => void }) => {
    const total = otros.reduce((sum, grupo) => sum + grupo.links.length, 0);
    return (
        <Tooltip content={otros.map((grupo) => grupo.label).join(', ')}>
            <div>
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <button type="button" className={CHIP_OTROS} aria-label="Otros documentos">
                            + Otros <span className="font-semibold">{total}</span>
                        </button>
                    </DropdownTrigger>
                    {renderDocumentosMenu('Otros documentos', otros, onVer)}
                </Dropdown>
            </div>
        </Tooltip>
    );
};

type FiltroEstadoFactura = 'TODOS' | EstadoFactura;
type FiltroValidacion = 'TODOS' | ValidacionDocumentos;

const toDateString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Lunes a domingo de la semana actual (hora local) */
const getCurrentWeekRange = () => {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toDateString(monday), end: toDateString(sunday) };
};

/** Valor de la columna para ordenar (las columnas sin valor van al final en orden ascendente) */
const getSortValue = (row: ParteIngresoContabilidad, column: string): string | number | null => {
    switch (column) {
        case 'fecha': return row.fechaParteIngreso;
        case 'parteIngreso': return row.numeroParteIngreso;
        case 'guia': return row.numeroGuia;
        case 'proveedor': return row.proveedor;
        case 'oc': return row.ordenesCompra;
        case 'condicionPago': return row.condicionPago;
        case 'moneda': return row.moneda;
        case 'total': return row.total;
        case 'factura': return row.numeroFactura;
        case 'estadoFactura': return row.estadoFactura;
        case 'cita': return row.numeroCita;
        case 'packingList': return row.numeroPackingList;
        case 'validacion': return row.validacionDocumentos;
        default: return null;
    }
};

const compareRows = (a: ParteIngresoContabilidad, b: ParteIngresoContabilidad, column: string): number => {
    const first = getSortValue(a, column);
    const second = getSortValue(b, column);
    if (first === second) return a.numeroParteIngreso - b.numeroParteIngreso;
    if (first === null) return 1;
    if (second === null) return -1;
    return typeof first === 'number' && typeof second === 'number'
        ? first - second
        : String(first).localeCompare(String(second), 'es', { numeric: true });
};

interface ColumnaTabla {
    key: string;
    label: string;
    nombre: string;             // como se lista en el selector de columnas
    sortable?: boolean;
    align?: 'right';
    fija?: boolean;             // siempre visible, no aparece en el selector de columnas
}

const COLUMNAS: ColumnaTabla[] = [
    { key: 'fecha', label: 'FECHA', nombre: 'Fecha', sortable: true },
    { key: 'proveedor', label: 'PROVEEDOR', nombre: 'Proveedor', sortable: true },
    { key: 'parteIngreso', label: 'PARTE DE INGRESO', nombre: 'Parte de ingreso', sortable: true, fija: true },
    { key: 'factura', label: 'FACTURA', nombre: 'Factura', sortable: true },
    { key: 'oc', label: 'OC', nombre: 'OC', sortable: true },
    { key: 'guia', label: 'GUÍA', nombre: 'Guía', sortable: true },
    { key: 'condicionPago', label: 'CONDICIÓN DE PAGO', nombre: 'Condición de pago', sortable: true },
    { key: 'moneda', label: 'MONEDA', nombre: 'Moneda', sortable: true },
    { key: 'total', label: 'TOTAL', nombre: 'Total', sortable: true, align: 'right' },
    { key: 'estadoFactura', label: 'REGISTRO SAP', nombre: 'Registro SAP', sortable: true },
    { key: 'cita', label: 'CITA', nombre: 'Cita', sortable: true },
    { key: 'packingList', label: 'PACKING LIST', nombre: 'Packing list', sortable: true },
    { key: 'validacion', label: 'VALIDACIÓN', nombre: 'Validación', sortable: true },
    { key: 'documentos', label: 'DOCUMENTOS', nombre: 'Documentos' },
];

const COLUMNAS_SELECCIONABLES = COLUMNAS.filter((col) => !col.fija);

/**
 * Columnas de la tabla mientras el visor de cotejo está abierto. PDF cuenta los que el proveedor cargó en la cita;
 * el del Parte de Ingreso se consulta aparte y no entra en la cuenta.
 */
const COLUMNAS_VISOR: ColumnaTabla[] = [
    ...['proveedor', 'parteIngreso', 'factura', 'oc', 'guia'].map((key) => COLUMNAS.find((col) => col.key === key)!),
    { key: 'pdfs', label: 'PDF', nombre: 'PDF', sortable: false },
];
// Ocultas por defecto (al mostrarlas quedan en su lugar de COLUMNAS); el usuario puede mostrarlas u ocultar las demás desde "Columnas"
const COLUMNAS_OCULTAS_POR_DEFECTO = ['condicionPago', 'moneda', 'packingList'];
const COLUMNAS_STORAGE_KEY = 'partesIngreso.columnasVisibles';

const leerColumnasVisibles = (): Set<string> => {
    try {
        const saved = localStorage.getItem(COLUMNAS_STORAGE_KEY);
        if (saved) {
            const keys = (JSON.parse(saved) as string[]).filter((key) => COLUMNAS_SELECCIONABLES.some((col) => col.key === key));
            return new Set(keys);
        }
    } catch {
        // sin almacenamiento o valor inválido: se usan las de por defecto
    }
    return new Set(COLUMNAS_SELECCIONABLES.map((col) => col.key).filter((key) => !COLUMNAS_OCULTAS_POR_DEFECTO.includes(key)));
};

/**
 * Consulta y filtros aplicados: se guardan en la sesión del navegador para que sigan al ir a la cita (o a otra
 * pantalla) y volver, hasta que el usuario los cambie o los limpie.
 */
interface FiltrosGuardados {
    desde: string;
    hasta: string;
    proveedor: string | null;
    proveedorNombre: string;
    estadoFactura: FiltroEstadoFactura;
    validacion: FiltroValidacion;
    search: string;
    sortDescriptor: SortDescriptor;
    page: number;
}

const FILTROS_STORAGE_KEY = 'partesIngreso.filtros';

const leerFiltrosGuardados = (): Partial<FiltrosGuardados> => {
    try {
        const saved = sessionStorage.getItem(FILTROS_STORAGE_KEY);
        return saved ? JSON.parse(saved) as Partial<FiltrosGuardados> : {};
    } catch {
        return {};
    }
};

const PartesIngresoPage = () => {
    // Al volver del detalle de la cita se restauran la consulta (URL) y los filtros (sesión)
    const [searchParams] = useSearchParams();
    const week = useMemo(getCurrentWeekRange, []);
    const [guardados] = useState(leerFiltrosGuardados);
    const proveedorInicial = searchParams.get('proveedor') ?? guardados.proveedor ?? null;

    const [fechaInicio, setFechaInicio] = useState(searchParams.get('desde') || guardados.desde || week.start);
    const [fechaFin, setFechaFin] = useState(searchParams.get('hasta') || guardados.hasta || week.end);
    const [proveedorKey, setProveedorKey] = useState<string | null>(proveedorInicial);
    const [proveedorInput, setProveedorInput] = useState(
        proveedorInicial && proveedorInicial === guardados.proveedor ? guardados.proveedorNombre ?? '' : ''
    );

    const [rows, setRows] = useState<ParteIngresoContabilidad[]>([]);
    // Rango y proveedor de la última consulta: se usan para exportar y para volver del detalle de la cita
    const [appliedQuery, setAppliedQuery] = useState<{ start: string; end: string; proveedor?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [rangeError, setRangeError] = useState<string | null>(null);
    // Con el API real no hay maestro de proveedores: se arma con los de los resultados ya consultados
    const [proveedoresConsultados, setProveedoresConsultados] = useState<ProveedorParteIngreso[]>([]);

    const [estadoFactura, setEstadoFactura] = useState<FiltroEstadoFactura>(guardados.estadoFactura ?? 'TODOS');
    const [validacion, setValidacion] = useState<FiltroValidacion>(guardados.validacion ?? 'TODOS');
    const [search, setSearch] = useState(guardados.search ?? '');
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(guardados.sortDescriptor ?? { column: 'fecha', direction: 'ascending' });
    const [page, setPage] = useState(guardados.page ?? 1);
    const [columnasVisibles, setColumnasVisiblesState] = useState<Set<string>>(leerColumnasVisibles);
    // Visor de cotejo abierto: parte y documento que se están revisando
    const [visor, setVisor] = useState<VisorSeleccion | null>(null);
    const cerrarVisor = useCallback(() => setVisor(null), []);
    const [visorAmpliado, setVisorAmpliado] = useState(false);

    // Con el visor abierto, clic en una fila la pasa al visor con su primer PDF de la cita. Si el clic fue en un chip
    // de documento, ese ya eligió parte y documento y se respeta (la actualización funcional no lo pisa).
    const handleRowAction = (key: Key) => {
        const parte = Number(key);
        setVisor((prev) => {
            if (!prev || prev.parte === parte) return prev;
            const row = sortedRows.find((r) => r.numeroParteIngreso === parte);
            return row ? { parte, documento: getDocumentoInicial(row) } : prev;
        });
    };

    const setColumnasVisibles = (keys: Set<string>) => {
        setColumnasVisiblesState(keys);
        try {
            localStorage.setItem(COLUMNAS_STORAGE_KEY, JSON.stringify(Array.from(keys)));
        } catch {
            // sin almacenamiento solo se pierde la preferencia
        }
    };

    // Con el visor abierto la tabla queda angosta: solo lo que se coteja, sin importar la selección de "Columnas"
    const headerColumns = useMemo(
        () => visor ? COLUMNAS_VISOR : COLUMNAS.filter((col) => col.fija || columnasVisibles.has(col.key)),
        [columnasVisibles, visor]
    );

    const proveedores = PROVEEDORES_SIMULADOS ?? proveedoresConsultados;

    // Nombre del proveedor restaurado desde la URL, cuando ya se conoce
    useEffect(() => {
        if (!proveedorKey || proveedorInput) return;
        const proveedor = proveedores.find((p) => p.codigoProveedor === proveedorKey);
        setProveedorInput(proveedor?.proveedor ?? proveedorKey);
    }, [proveedorKey, proveedorInput, proveedores]);

    const proveedorOptions = useMemo(() => {
        const term = proveedorInput.trim().toLowerCase();
        const selected = proveedores.find((p) => p.codigoProveedor === proveedorKey);
        // Con un proveedor elegido se muestran todos para poder cambiarlo
        if (!term || selected?.proveedor === proveedorInput) return proveedores;
        return proveedores.filter((p) =>
            [p.codigoProveedor, p.proveedor, p.ruc].some((value) => value.toLowerCase().includes(term))
        );
    }, [proveedores, proveedorInput, proveedorKey]);

    const buscar = useCallback(async (start: string, end: string, codigoProveedor?: string, keepPage = false) => {
        if (!start || !end) {
            setRangeError('Ingrese la fecha de inicio y la fecha fin.');
            return;
        }
        if (start > end) {
            setRangeError('La fecha de inicio no puede ser mayor que la fecha fin.');
            return;
        }
        setRangeError(null);
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await listar(start, end, codigoProveedor);
            setRows(data);
            setAppliedQuery({ start, end, proveedor: codigoProveedor });
            setProveedoresConsultados((prev) => {
                const byCode = new Map(prev.map((p) => [p.codigoProveedor, p]));
                getProveedoresUnicos(data).forEach((p) => byCode.set(p.codigoProveedor, p));
                return Array.from(byCode.values()).sort((a, b) => a.proveedor.localeCompare(b.proveedor));
            });
            if (!keepPage) setPage(1);
        } catch (error) {
            console.error('Error al cargar partes de ingreso:', error);
            setLoadError(error instanceof Error ? error.message : 'No se pudieron consultar los partes de ingreso.');
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Primera carga con el rango por defecto (o el restaurado al volver de la cita), en la página que se dejó
    useEffect(() => {
        buscar(fechaInicio, fechaFin, proveedorKey ?? undefined, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!appliedQuery) return;
        const filtros: FiltrosGuardados = {
            desde: appliedQuery.start,
            hasta: appliedQuery.end,
            proveedor: appliedQuery.proveedor ?? null,
            proveedorNombre: appliedQuery.proveedor ? proveedorInput : '',
            estadoFactura,
            validacion,
            search,
            sortDescriptor,
            page,
        };
        try {
            sessionStorage.setItem(FILTROS_STORAGE_KEY, JSON.stringify(filtros));
        } catch {
            // sin almacenamiento los filtros solo se pierden al salir de la pantalla
        }
        // proveedorInput solo acompaña a la consulta aplicada; no se guarda mientras se escribe
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedQuery, estadoFactura, validacion, search, sortDescriptor, page]);

    const hayFiltrosLocales = estadoFactura !== 'TODOS' || validacion !== 'TODOS' || search.trim() !== '';

    const limpiarFiltros = () => {
        setEstadoFactura('TODOS');
        setValidacion('TODOS');
        setSearch('');
        setPage(1);
    };

    const handleBuscar = () => {
        // Sin elegir de la lista se envía lo escrito como código de proveedor
        const codigo = proveedorKey ?? (proveedorInput.trim() || undefined);
        buscar(fechaInicio, fechaFin, codigo);
    };

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter((row) =>
            (estadoFactura === 'TODOS' || row.estadoFactura === estadoFactura) &&
            (validacion === 'TODOS' || row.validacionDocumentos === validacion) &&
            (!term || [row.numeroGuia, String(row.numeroParteIngreso), row.ordenesCompra, row.numeroFactura]
                .some((value) => value?.toLowerCase().includes(term)))
        );
    }, [rows, estadoFactura, validacion, search]);

    const sortedRows = useMemo(() => {
        const column = String(sortDescriptor.column ?? 'fecha');
        const sorted = [...filteredRows].sort((a, b) => compareRows(a, b, column));
        return sortDescriptor.direction === 'descending' ? sorted.reverse() : sorted;
    }, [filteredRows, sortDescriptor]);

    const pages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE));
    // La página restaurada puede no existir si al volver hay menos resultados
    const currentPage = Math.min(page, pages);
    const pageItems = sortedRows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    // La tabla reutiliza la fila mientras su item sea el mismo objeto: el item lleva si está en el visor para que
    // el resaltado siga al parte que se está viendo
    const parteEnVisor = visor?.parte ?? null;
    const tableItems = useMemo(
        () => pageItems.map((row) => ({ row, enVisor: row.numeroParteIngreso === parteEnVisor })),
        [pageItems, parteEnVisor]
    );

    // La fila del visor queda a la vista dentro del scroll de la tabla
    useEffect(() => {
        if (parteEnVisor === null) return;
        document.querySelector(`[data-parte="${parteEnVisor}"]`)?.closest('tr')?.scrollIntoView({ block: 'nearest' });
    }, [parteEnVisor, page]);

    // Al avanzar en el visor, la tabla pasa a la página del parte que se está cotejando
    useEffect(() => {
        if (!visor) return;
        const index = sortedRows.findIndex((r) => r.numeroParteIngreso === visor.parte);
        if (index >= 0) setPage(Math.floor(index / ROWS_PER_PAGE) + 1);
    }, [visor, sortedRows]);

    const summary = [
        { label: 'Partes de ingreso', value: filteredRows.length, icon: <InboxArrowDownIcon className="h-8 w-8 text-blue-500" /> },
        { label: 'Sin asiento', value: filteredRows.filter((r) => r.estadoFactura === 'FALTA FACTURA').length, icon: <DocumentTextIcon className="h-8 w-8 text-red-500" /> },
        { label: 'Para revisar', value: filteredRows.filter((r) => r.validacionDocumentos === 'REVISAR').length, icon: <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" /> },
    ];

    const getCitaReturnTo = () => {
        const params = new URLSearchParams({ desde: appliedQuery?.start ?? fechaInicio, hasta: appliedQuery?.end ?? fechaFin });
        if (appliedQuery?.proveedor) params.set('proveedor', appliedQuery.proveedor);
        return `${PAGE_PATH}?${params}`;
    };

    const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
        setter(value);
        setPage(1);
    };

    const renderCell = (row: ParteIngresoContabilidad, columnKey: string) => {
        switch (columnKey) {
            case 'parteIngreso':
                return <span className="whitespace-nowrap font-medium" data-parte={row.numeroParteIngreso}>{row.numeroParteIngreso}</span>;
            case 'factura':
                return row.numeroFactura ?? '-';
            case 'oc':
                return row.ordenesCompra ?? '-';
            case 'proveedor':
                return (
                    <div className="max-w-[260px]">
                        <div className="truncate font-medium" title={row.proveedor}>{row.proveedor}</div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">RUC {row.ruc}</div>
                    </div>
                );
            case 'fecha':
                return <span className="whitespace-nowrap">{formatFecha(row.fechaParteIngreso)}</span>;
            case 'guia':
                return <span className="whitespace-nowrap">{row.numeroGuia}</span>;
            case 'condicionPago':
                return <span className="whitespace-nowrap">{row.condicionPago ?? '-'}</span>;
            case 'moneda':
                return <span className="whitespace-nowrap">{row.moneda}</span>;
            case 'total':
                return <div className="whitespace-nowrap text-right">{formatTotal(row)}</div>;
            case 'estadoFactura':
                return (
                    <Chip size="sm" variant="flat" color={ESTADO_FACTURA_COLORS[row.estadoFactura]} className="whitespace-nowrap">
                        {REGISTRO_SAP_LABELS[row.estadoFactura]}
                    </Chip>
                );
            case 'cita':
                return row.numeroCita !== null ? (
                    <RouterLink
                        to={`/agenda/detail/${row.numeroCita}`}
                        state={{ returnTo: getCitaReturnTo() }}
                        className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                    >
                        {row.numeroCita}
                    </RouterLink>
                ) : '-';
            case 'packingList':
                return <span className="whitespace-nowrap">{row.numeroPackingList ?? '-'}</span>;
            case 'validacion':
                return row.validacionDocumentos === 'REVISAR' ? (
                    <Tooltip content={REVISAR_TOOLTIP} className="max-w-xs">
                        <Chip size="sm" variant="flat" color="warning" className="cursor-help whitespace-nowrap">
                            {row.validacionDocumentos}
                        </Chip>
                    </Tooltip>
                ) : (
                    <Chip size="sm" variant="flat" color={VALIDACION_COLORS[row.validacionDocumentos]} className="whitespace-nowrap">
                        {row.validacionDocumentos}
                    </Chip>
                );
            case 'pdfs': {
                const total = getDocumentosVisor(row).length;
                return total > 0 ? (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        <DocumentTextIcon className="h-3.5 w-3.5" />
                        {total}
                    </span>
                ) : (
                    <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-400 dark:bg-gray-800">Sin PDF</span>
                );
            }
            case 'documentos':
                return (
                    <DocumentosCell
                        grupos={getDocumentoGrupos(row)}
                        otros={getOtrosDocumentos(row)}
                        onVer={(linkKey) => setVisor({ parte: row.numeroParteIngreso, documento: linkKey })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dashboard>
            {/* Con el visor abierto la pantalla se corre a la izquierda para que la tabla siga a la vista */}
            <div className={`space-y-6 ${visor ? VISOR_ANCHO[visorAmpliado ? 'ampliado' : 'normal'].margen : ''}`}>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Partes de Ingreso</h1>
                    <p className="text-gray-600">
                        Entradas de mercancía del rango, su estado de factura y los documentos que el proveedor cargó en la cita.
                    </p>
                </div>

                <Card>
                    <CardBody className="p-4 space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                            <DateInput label="Fecha inicio" value={fechaInicio} size="sm" onValueChange={setFechaInicio} isClearable={false} className="md:w-44" />
                            <DateInput label="Fecha fin" value={fechaFin} size="sm" onValueChange={setFechaFin} isClearable={false} className="md:w-44" />
                            <Autocomplete
                                size="sm"
                                label="Proveedor"
                                placeholder="Código, nombre o RUC (opcional)"
                                className="md:flex-1"
                                allowsCustomValue
                                items={proveedorOptions}
                                inputValue={proveedorInput}
                                selectedKey={proveedorKey}
                                // El filtro lo hacemos nosotros (código, nombre o RUC)
                                defaultFilter={() => true}
                                onInputChange={(value) => {
                                    setProveedorInput(value);
                                    const selected = proveedores.find((p) => p.codigoProveedor === proveedorKey);
                                    if (selected && selected.proveedor !== value) setProveedorKey(null);
                                }}
                                onSelectionChange={(key) => {
                                    const codigo = key ? String(key) : null;
                                    setProveedorKey(codigo);
                                    setProveedorInput(proveedores.find((p) => p.codigoProveedor === codigo)?.proveedor ?? '');
                                }}
                            >
                                {(proveedor) => (
                                    <AutocompleteItem key={proveedor.codigoProveedor} textValue={proveedor.proveedor}>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{proveedor.proveedor}</span>
                                            <span className="text-xs text-gray-500">{proveedor.codigoProveedor} · RUC {proveedor.ruc}</span>
                                        </div>
                                    </AutocompleteItem>
                                )}
                            </Autocomplete>
                            <Button
                                color="primary"
                                startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                                onPress={handleBuscar}
                                isLoading={isLoading}
                            >
                                Buscar
                            </Button>
                        </div>
                        {rangeError && <p className="text-sm text-red-600">{rangeError}</p>}
                    </CardBody>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {summary.map((stat) => (
                        <Card key={stat.label}>
                            <CardBody className="flex flex-row items-center gap-4">
                                {stat.icon}
                                <div>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                    <p className="text-xl font-bold">{stat.value}</p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardBody className="p-4 space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <Input
                                isClearable
                                className="w-full md:max-w-[36%]"
                                placeholder="Buscar por guía, parte de ingreso, OC o factura..."
                                startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                                value={search}
                                onClear={() => resetPage(setSearch)('')}
                                onValueChange={resetPage(setSearch)}
                            />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Select
                                    size="sm"
                                    label="Registro SAP"
                                    className="sm:w-48"
                                    selectedKeys={[estadoFactura]}
                                    onSelectionChange={(keys) => resetPage(setEstadoFactura)((Array.from(keys)[0] as FiltroEstadoFactura) ?? 'TODOS')}
                                >
                                    <SelectItem key="TODOS">Todos</SelectItem>
                                    <SelectItem key="FALTA FACTURA">Sin asiento</SelectItem>
                                    <SelectItem key="FACTURA REGISTRADA">Con asiento</SelectItem>
                                </Select>
                                <Select
                                    size="sm"
                                    label="Validación de documentos"
                                    className="sm:w-48"
                                    selectedKeys={[validacion]}
                                    onSelectionChange={(keys) => resetPage(setValidacion)((Array.from(keys)[0] as FiltroValidacion) ?? 'TODOS')}
                                >
                                    <SelectItem key="TODOS">Todos</SelectItem>
                                    <SelectItem key="OK">OK</SelectItem>
                                    <SelectItem key="REVISAR">Revisar</SelectItem>
                                    <SelectItem key="SIN CITA">Sin cita</SelectItem>
                                </Select>
                                {hayFiltrosLocales && (
                                    <Button variant="light" color="danger" startContent={<XMarkIcon className="h-4 w-4" />} onPress={limpiarFiltros}>
                                        Limpiar filtros
                                    </Button>
                                )}
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button variant="flat" startContent={<ViewColumnsIcon className="h-4 w-4" />}>
                                            Columnas
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Columnas visibles"
                                        closeOnSelect={false}
                                        selectionMode="multiple"
                                        selectedKeys={columnasVisibles}
                                        onSelectionChange={(keys) => setColumnasVisibles(
                                            keys === 'all' ? new Set(COLUMNAS_SELECCIONABLES.map((col) => col.key)) : new Set(Array.from(keys, String))
                                        )}
                                        className="max-h-96 overflow-y-auto"
                                    >
                                        {COLUMNAS_SELECCIONABLES.map((col) => (
                                            <DropdownItem key={col.key}>{col.nombre}</DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                                <Button
                                    variant="flat"
                                    color="success"
                                    startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
                                    isDisabled={sortedRows.length === 0 || !appliedQuery}
                                    onPress={() => appliedQuery && exportPartesIngresoReport(sortedRows, appliedQuery.start, appliedQuery.end)}
                                >
                                    Exportar Excel
                                </Button>
                            </div>
                        </div>

                        {loadError && (
                            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
                                {loadError}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Spinner color="primary" size="lg" />
                                <p className="text-sm text-gray-500">Cargando partes de ingreso...</p>
                            </div>
                        ) : (
                            <Table
                                aria-label="Partes de ingreso"
                                sortDescriptor={sortDescriptor}
                                onSortChange={setSortDescriptor}
                                onRowAction={visor ? handleRowAction : undefined}
                                // Alto limitado: el scroll horizontal queda a la vista sin bajar hasta el último registro
                                isHeaderSticky
                                classNames={{ wrapper: 'max-h-[calc(100vh-14rem)]' }}
                                bottomContentPlacement="outside"
                                bottomContent={pages > 1 && (
                                    <div className="flex justify-center">
                                        <Pagination showControls page={currentPage} total={pages} onChange={setPage} />
                                    </div>
                                )}
                            >
                                <TableHeader columns={headerColumns}>
                                    {(col) => (
                                        <TableColumn key={col.key} allowsSorting={col.sortable} className={col.align === 'right' ? 'text-right' : undefined}>
                                            {col.label}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody
                                    items={tableItems}
                                    emptyContent={loadError ? 'No se pudo cargar la información' : 'No hay partes de ingreso para los filtros seleccionados'}
                                >
                                    {({ row, enVisor }) => (
                                        <TableRow
                                            key={row.numeroParteIngreso}
                                            className={
                                                enVisor
                                                    ? 'cursor-pointer bg-blue-100 outline outline-2 -outline-offset-2 outline-blue-500 dark:bg-blue-900/40'
                                                    : `${visor ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''} ${
                                                        row.validacionDocumentos === 'REVISAR' ? 'bg-amber-50' : ''
                                                    }`
                                            }
                                        >
                                            {(columnKey) => <TableCell>{renderCell(row, String(columnKey))}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>

            {visor && (
                <DocumentViewerPanel
                    rows={sortedRows}
                    seleccion={visor}
                    onChange={setVisor}
                    onClose={cerrarVisor}
                    ampliado={visorAmpliado}
                    onToggleAmpliado={() => setVisorAmpliado((value) => !value)}
                />
            )}
        </Dashboard>
    );
};

export default PartesIngresoPage;
