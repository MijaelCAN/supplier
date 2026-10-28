// src/pages/Reclamos/index.tsx
// Módulo de Reclamos a proveedor (OBS-008, parte 3): el proveedor ve y responde los suyos; Calidad/Almacén los gestionan y cierran.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Pagination,
    Select,
    SelectItem,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';
import {
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Dashboard from '@/layouts/Dashboard';
import { DateInput } from '@/components/DateInput';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import { SupplierClaim } from '@/store/types';
import { CLAIMS_API_ENABLED, ClaimListFilters, fetchClaims } from '@/services/agenda/claimsApi';
import ClaimDetailModal, { CLAIM_STATUS_COLORS } from './ClaimDetailModal';

const ROWS_PER_PAGE = 10;

const toApiDate = (value: string) => value.replace(/-/g, '');

const ReclamosPage = () => {
    const { currentUser } = useAuth();
    const isProvider = currentUser?.role === UserRole.PROVEEDOR;

    const todayString = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const monthAgoString = useMemo(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().slice(0, 10);
    }, []);

    const [claims, setClaims] = useState<SupplierClaim[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(monthAgoString);
    const [endDate, setEndDate] = useState(todayString);
    const [estado, setEstado] = useState<ClaimListFilters['estado'] | ''>(isProvider ? 'ABIERTO' : '');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedClaim, setSelectedClaim] = useState<SupplierClaim | null>(null);

    const isValidRange = !!startDate && !!endDate && startDate <= endDate;

    const loadClaims = useCallback(async () => {
        if (!CLAIMS_API_ENABLED || !isValidRange) return;
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await fetchClaims({
                // El RUC del proveedor está en su username; el backend también lo restringe
                ruc: isProvider ? currentUser?.username : undefined,
                estado: estado || undefined,
                fechaInicio: toApiDate(startDate),
                fechaFin: toApiDate(endDate),
            });
            setClaims(data);
            setPage(1);
        } catch (error) {
            console.error('Error al cargar reclamos:', error);
            setLoadError(error instanceof Error ? error.message : 'Error al cargar los reclamos');
            setClaims([]);
        } finally {
            setIsLoading(false);
        }
    }, [isProvider, currentUser?.username, estado, startDate, endDate, isValidRange]);

    useEffect(() => {
        loadClaims();
    }, [loadClaims]);

    const filteredClaims = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return claims;
        return claims.filter((c) =>
            [c.numeroReclamo, c.proveedor, c.codCita, c.rucProveedor].some((v) => v?.toLowerCase().includes(term))
        );
    }, [claims, search]);

    const pages = Math.max(1, Math.ceil(filteredClaims.length / ROWS_PER_PAGE));
    const pageItems = filteredClaims.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    const countByStatus = (status: SupplierClaim['status']) => claims.filter((c) => c.status === status).length;

    const handleClaimUpdated = (updated: SupplierClaim) => {
        setClaims((prev) => prev.map((c) => (c.docEntry === updated.docEntry ? updated : c)));
    };

    const getActionLabel = (claim: SupplierClaim) => {
        if (isProvider && claim.status === 'Abierto') return 'Responder';
        if (!isProvider && claim.status === 'En Respuesta') return 'Revisar y cerrar';
        return 'Ver';
    };

    if (!CLAIMS_API_ENABLED) {
        return (
            <Dashboard>
                <Card>
                    <CardBody className="p-6 text-gray-600">
                        El módulo de reclamos aún no está habilitado.
                    </CardBody>
                </Card>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reclamos</h1>
                    <p className="text-gray-600">
                        {isProvider
                            ? 'Reclamos recibidos por productos rechazados. Registre su respuesta y plan de acciones.'
                            : 'Reclamos emitidos a proveedores por productos rechazados en la recepción.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: claims.length, icon: <DocumentTextIcon className="h-8 w-8 text-blue-500" /> },
                        { label: 'Abiertos', value: countByStatus('Abierto'), icon: <ExclamationTriangleIcon className="h-8 w-8 text-red-500" /> },
                        { label: 'En respuesta', value: countByStatus('En Respuesta'), icon: <ClockIcon className="h-8 w-8 text-amber-500" /> },
                        { label: 'Cerrados', value: countByStatus('Cerrado'), icon: <CheckCircleIcon className="h-8 w-8 text-green-500" /> },
                    ].map((stat) => (
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
                                placeholder={isProvider ? 'Buscar por número o cita...' : 'Buscar por número, proveedor o cita...'}
                                startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                                value={search}
                                onClear={() => setSearch('')}
                                onValueChange={(value) => {
                                    setSearch(value);
                                    setPage(1);
                                }}
                            />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Select
                                    size="sm"
                                    label="Estado"
                                    className="sm:w-44"
                                    selectedKeys={[estado || 'TODOS']}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0] as string;
                                        setEstado(value === 'TODOS' ? '' : (value as ClaimListFilters['estado']));
                                    }}
                                >
                                    <SelectItem key="TODOS">Todos</SelectItem>
                                    <SelectItem key="ABIERTO">Abierto</SelectItem>
                                    <SelectItem key="EN_RESPUESTA">En respuesta</SelectItem>
                                    <SelectItem key="CERRADO">Cerrado</SelectItem>
                                </Select>
                                <DateInput label="Fecha inicio" value={startDate} size="sm" onValueChange={setStartDate} className="sm:w-40" />
                                <DateInput label="Fecha fin" value={endDate} size="sm" onValueChange={setEndDate} className="sm:w-40" />
                            </div>
                        </div>

                        {!isValidRange && (
                            <p className="text-sm text-red-600">La fecha de inicio debe ser menor o igual a la fecha fin.</p>
                        )}
                        {loadError && (
                            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
                                No se pudieron cargar los reclamos: {loadError}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Spinner color="primary" size="lg" />
                                <p className="text-sm text-gray-500">Cargando reclamos...</p>
                            </div>
                        ) : (
                            <Table
                                aria-label="Listado de reclamos"
                                bottomContent={pages > 1 && (
                                    <div className="flex justify-center">
                                        <Pagination showControls page={page} total={pages} onChange={setPage} />
                                    </div>
                                )}
                            >
                                <TableHeader>
                                    <TableColumn>NÚMERO</TableColumn>
                                    <TableColumn>FECHA</TableColumn>
                                    <TableColumn>CITA</TableColumn>
                                    <TableColumn className={isProvider ? 'hidden' : ''}>PROVEEDOR</TableColumn>
                                    <TableColumn>ÁREA</TableColumn>
                                    <TableColumn>PRODUCTOS</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                    <TableColumn>ACCIÓN</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No hay reclamos para los filtros seleccionados">
                                    {pageItems.map((claim) => (
                                        <TableRow key={claim.docEntry ?? claim.numeroReclamo}>
                                            <TableCell className="whitespace-nowrap font-medium">{claim.numeroReclamo}</TableCell>
                                            <TableCell className="whitespace-nowrap">{claim.fechaReclamo}</TableCell>
                                            <TableCell className="whitespace-nowrap">{claim.codCita}</TableCell>
                                            <TableCell className={isProvider ? 'hidden' : ''}>
                                                <div className="truncate max-w-[260px]" title={claim.proveedor}>{claim.proveedor}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{claim.areaEmite}</TableCell>
                                            <TableCell className="whitespace-nowrap">{claim.productos?.length ?? 0}</TableCell>
                                            <TableCell>
                                                {claim.status && (
                                                    <Chip size="sm" variant="flat" color={CLAIM_STATUS_COLORS[claim.status]}>
                                                        {claim.status}
                                                    </Chip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="flat" color="primary" onPress={() => setSelectedClaim(claim)}>
                                                    {getActionLabel(claim)}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>

            <ClaimDetailModal
                isOpen={!!selectedClaim}
                onOpenChange={(open) => {
                    if (!open) setSelectedClaim(null);
                }}
                claim={selectedClaim}
                onClaimUpdated={handleClaimUpdated}
            />
        </Dashboard>
    );
};

export default ReclamosPage;
