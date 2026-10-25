// src/pages/PartesIngreso/index.tsx
// Partes de Ingreso (Contabilidad): entradas de mercancía del rango, cuáles faltan facturar y los documentos de su cita.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Card,
    CardBody,
    Chip,
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
    DocumentTextIcon,
    ExclamationTriangleIcon,
    InboxArrowDownIcon,
    MagnifyingGlassIcon,
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
import { exportPartesIngresoReport, formatFecha, formatTotal, getDocumentoLinks } from './partesIngresoReport';

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
        case 'ruc': return row.ruc;
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

const PartesIngresoPage = () => {
    // Al volver del detalle de la cita se restauran el rango y el proveedor buscados
    const [searchParams] = useSearchParams();
    const week = useMemo(getCurrentWeekRange, []);

    const [fechaInicio, setFechaInicio] = useState(searchParams.get('desde') || week.start);
    const [fechaFin, setFechaFin] = useState(searchParams.get('hasta') || week.end);
    const [proveedorKey, setProveedorKey] = useState<string | null>(searchParams.get('proveedor'));
    const [proveedorInput, setProveedorInput] = useState('');

    const [rows, setRows] = useState<ParteIngresoContabilidad[]>([]);
    // Rango y proveedor de la última consulta: se usan para exportar y para volver del detalle de la cita
    const [appliedQuery, setAppliedQuery] = useState<{ start: string; end: string; proveedor?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [rangeError, setRangeError] = useState<string | null>(null);
    // Con el API real no hay maestro de proveedores: se arma con los de los resultados ya consultados
    const [proveedoresConsultados, setProveedoresConsultados] = useState<ProveedorParteIngreso[]>([]);

    const [estadoFactura, setEstadoFactura] = useState<FiltroEstadoFactura>('TODOS');
    const [validacion, setValidacion] = useState<FiltroValidacion>('TODOS');
    const [search, setSearch] = useState('');
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'fecha', direction: 'ascending' });
    const [page, setPage] = useState(1);

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

    const buscar = useCallback(async (start: string, end: string, codigoProveedor?: string) => {
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
            setPage(1);
        } catch (error) {
            console.error('Error al cargar partes de ingreso:', error);
            setLoadError(error instanceof Error ? error.message : 'No se pudieron consultar los partes de ingreso.');
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Primera carga con el rango por defecto (o el restaurado al volver de la cita)
    useEffect(() => {
        buscar(fechaInicio, fechaFin, proveedorKey ?? undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
    const pageItems = sortedRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    const summary = [
        { label: 'Partes de ingreso', value: filteredRows.length, icon: <InboxArrowDownIcon className="h-8 w-8 text-blue-500" /> },
        { label: 'Falta factura', value: filteredRows.filter((r) => r.estadoFactura === 'FALTA FACTURA').length, icon: <DocumentTextIcon className="h-8 w-8 text-red-500" /> },
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

    return (
        <Dashboard>
            <div className="space-y-6">
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
                                    label="Estado factura"
                                    className="sm:w-48"
                                    selectedKeys={[estadoFactura]}
                                    onSelectionChange={(keys) => resetPage(setEstadoFactura)((Array.from(keys)[0] as FiltroEstadoFactura) ?? 'TODOS')}
                                >
                                    <SelectItem key="TODOS">Todos</SelectItem>
                                    <SelectItem key="FALTA FACTURA">Falta factura</SelectItem>
                                    <SelectItem key="FACTURA REGISTRADA">Factura registrada</SelectItem>
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
                                bottomContent={pages > 1 && (
                                    <div className="flex justify-center">
                                        <Pagination showControls page={page} total={pages} onChange={setPage} />
                                    </div>
                                )}
                            >
                                <TableHeader>
                                    <TableColumn key="fecha" allowsSorting>FECHA</TableColumn>
                                    <TableColumn key="parteIngreso" allowsSorting>PARTE DE INGRESO</TableColumn>
                                    <TableColumn key="guia" allowsSorting>GUÍA</TableColumn>
                                    <TableColumn key="proveedor" allowsSorting>PROVEEDOR</TableColumn>
                                    <TableColumn key="ruc" allowsSorting>RUC</TableColumn>
                                    <TableColumn key="oc" allowsSorting>OC</TableColumn>
                                    <TableColumn key="condicionPago" allowsSorting>CONDICIÓN DE PAGO</TableColumn>
                                    <TableColumn key="moneda" allowsSorting>MONEDA</TableColumn>
                                    <TableColumn key="total" allowsSorting className="text-right">TOTAL</TableColumn>
                                    <TableColumn key="factura" allowsSorting>FACTURA</TableColumn>
                                    <TableColumn key="estadoFactura" allowsSorting>ESTADO FACTURA</TableColumn>
                                    <TableColumn key="cita" allowsSorting>CITA</TableColumn>
                                    <TableColumn key="packingList" allowsSorting>PACKING LIST</TableColumn>
                                    <TableColumn key="validacion" allowsSorting>VALIDACIÓN</TableColumn>
                                    <TableColumn key="documentos">DOCUMENTOS</TableColumn>
                                </TableHeader>
                                <TableBody
                                    emptyContent={loadError ? 'No se pudo cargar la información' : 'No hay partes de ingreso para los filtros seleccionados'}
                                >
                                    {pageItems.map((row) => (
                                        <TableRow
                                            key={row.numeroParteIngreso}
                                            className={row.validacionDocumentos === 'REVISAR' ? 'bg-amber-50' : undefined}
                                        >
                                            <TableCell className="whitespace-nowrap">{formatFecha(row.fechaParteIngreso)}</TableCell>
                                            <TableCell className="whitespace-nowrap font-medium">{row.numeroParteIngreso}</TableCell>
                                            <TableCell className="whitespace-nowrap">{row.numeroGuia}</TableCell>
                                            <TableCell>
                                                <div className="truncate max-w-[240px]" title={row.proveedor}>{row.proveedor}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{row.ruc}</TableCell>
                                            <TableCell>{row.ordenesCompra ?? '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{row.condicionPago ?? '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{row.moneda}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatTotal(row)}</TableCell>
                                            <TableCell>{row.numeroFactura ?? '-'}</TableCell>
                                            <TableCell>
                                                <Chip size="sm" variant="flat" color={ESTADO_FACTURA_COLORS[row.estadoFactura]} className="whitespace-nowrap">
                                                    {row.estadoFactura}
                                                </Chip>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {row.numeroCita !== null ? (
                                                    <RouterLink
                                                        to={`/agenda/detail/${row.numeroCita}`}
                                                        state={{ returnTo: getCitaReturnTo() }}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        {row.numeroCita}
                                                    </RouterLink>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{row.numeroPackingList ?? '-'}</TableCell>
                                            <TableCell>
                                                {row.validacionDocumentos === 'REVISAR' ? (
                                                    <Tooltip content={REVISAR_TOOLTIP} className="max-w-xs">
                                                        <Chip size="sm" variant="flat" color="warning" className="cursor-help whitespace-nowrap">
                                                            {row.validacionDocumentos}
                                                        </Chip>
                                                    </Tooltip>
                                                ) : (
                                                    <Chip size="sm" variant="flat" color={VALIDACION_COLORS[row.validacionDocumentos]} className="whitespace-nowrap">
                                                        {row.validacionDocumentos}
                                                    </Chip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 min-w-[180px]">
                                                    {getDocumentoLinks(row).map((link) => (
                                                        <a
                                                            key={link.key}
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title={link.url}
                                                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                                                        >
                                                            <DocumentTextIcon className="h-3.5 w-3.5" />
                                                            {link.label}
                                                        </a>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </Dashboard>
    );
};

export default PartesIngresoPage;
