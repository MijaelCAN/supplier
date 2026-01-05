import {useState, useMemo, useEffect, useCallback} from 'react';
import {
    Button,
    Input,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Card,
    CardBody,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Spinner
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    TruckIcon,
    ClipboardDocumentCheckIcon,
    DocumentTextIcon,
    BanknotesIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { DateInput } from "@/components/DateInput";
import {useReceptions} from '@/store/extendedStore';
import { Reception } from '@/store/types';
import {fetchReceptionsByCardCode} from "@/services/receptions/receptionsApi.ts";
import {useAuth} from "@/store/authStore.ts";

const ReceptionPage = () => {
    const {
        receptions,
        setReceptions,
        selectedReception,
        setSelectedReception
    } = useReceptions();

    const todayString = useMemo(() =>  new Date().toISOString().slice(0, 10), []);
    const [startDate, setStartDate] = useState<string>(todayString);
    const [endDate, setEndDate] = useState<string>(todayString);

    const [filterValue, setFilterValue] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    const isValidRange = useMemo(() => startDate && endDate && startDate <= endDate, [startDate, endDate]);

    const fetchReceptionsData = useCallback(async (): Promise<Reception[] | null> => {
        if (!startDate || !endDate) {
            throw new Error('Selecciona un rango de fechas válido.');
        }
        if (!isValidRange) {
            throw new Error('La fecha inicial no puede ser mayor que la fecha final.');
        }
        const formatDateForApi = (value: string) => value.replace(/-/g, '');
        return fetchReceptionsByCardCode(
            currentUser?.roleType !== 'internal' ? currentUser?.userCode : undefined,
            "Todos",
            formatDateForApi(startDate),
            formatDateForApi(endDate),
        );
    }, [startDate, endDate, isValidRange, currentUser?.userCode]);

    // Cargar recepciones cuando cambian las fechas o al montar el componente
    useEffect(() => {
        const loadFilteredReceptions = async () => {
            try {
                setIsLoading(true);
                const result = await fetchReceptionsData();
                if (result && result.length > 0) {
                    setReceptions(result);
                } else {
                    setReceptions([]);
                }
            } catch (e) {
                console.log("Error al filtrar las recepciones por fecha", e);
                setReceptions([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isValidRange && currentUser?.userCode) {
            loadFilteredReceptions();
        }
    }, [startDate, endDate, fetchReceptionsData, isValidRange, currentUser?.userCode, setReceptions]);

    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

    const filteredReceptions = useMemo(() => {
        let filtered = receptions;

        if (filterValue) {
            filtered = filtered.filter(reception =>
                reception.docEntry.toLowerCase().includes(filterValue.toLowerCase()) ||
                reception.supplierName.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        return filtered;
    }, [receptions, filterValue]);

    const pages = Math.ceil(filteredReceptions.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredReceptions.slice(start, end);
    }, [page, filteredReceptions, rowsPerPage]);

    const handleViewDetails = (reception: Reception) => {
        setSelectedReception(reception);
        onDetailOpen();
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            // Formato esperado: "20-11-2025"
            const [day, month, year] = dateStr.split('-');
            if (day && month && year) {
                const date = new Date(`${year}-${month}-${day}`);
                return date.toLocaleDateString('es-PE');
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    const topContent = (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Buscar por número de recepción o proveedor..."
                    startContent={<MagnifyingGlassIcon className="h-4 w-4"/>}
                    value={filterValue}
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <DateInput
                        label="Fecha inicio"
                        value={startDate}
                        size="sm"
                        onValueChange={setStartDate}
                        className="sm:w-40"
                    />
                    <DateInput
                        label="Fecha fin"
                        value={endDate}
                        size="sm"
                        onValueChange={setEndDate}
                        className="sm:w-40"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Recepción de Mercadería</h1>
                    <p className="text-gray-600">Gestiona la recepción de productos y materiales</p>
                </div>

                {/* Resumen de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total Recepciones</p>
                                <p className="text-xl font-bold">{receptions.length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <TruckIcon className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-500">Proveedores</p>
                                <p className="text-xl font-bold">
                                    {new Set(receptions.map(r => r.supplierId)).size}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Items Totales</p>
                                <p className="text-xl font-bold">
                                    {receptions.reduce((sum, r) => sum + (r.detalle?.length || 0), 0)}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <BanknotesIcon className="h-8 w-8 text-purple-500" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">Monto Total</p>
                                <div className="flex flex-col gap-1">
                                    <p className="text-lg font-bold">
                                        {formatCurrency(
                                            receptions
                                                .filter(r => r.currency === 'PEN')
                                                .reduce((sum, r) => sum + r.total, 0),
                                            'PEN'
                                        )}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {formatCurrency(
                                            receptions
                                                .filter(r => r.currency === 'USD')
                                                .reduce((sum, r) => sum + r.total, 0),
                                            'USD'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardBody className="p-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Spinner color="primary" size="lg"/>
                                <p className="text-sm text-gray-500">
                                    Cargando recepciones...
                                </p>
                            </div>
                        ) : (
                            <Table
                                aria-label="Tabla de recepción"
                                topContent={topContent}
                                topContentPlacement="outside"
                                bottomContent={
                                    pages > 0 ? (
                                        <div className="flex w-full justify-center">
                                            <Pagination
                                                isCompact
                                                showControls
                                                showShadow
                                                color="primary"
                                                page={page}
                                                total={pages}
                                                onChange={setPage}
                                            />
                                        </div>
                                    ) : null
                                }
                                classNames={{
                                    wrapper: "min-h-[222px]",
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>N° RECEPCIÓN</TableColumn>
                                    <TableColumn>PROVEEDOR</TableColumn>
                                    <TableColumn className="text-right">MONTO</TableColumn>
                                    <TableColumn>FECHA</TableColumn>
                                    <TableColumn>ITEMS</TableColumn>
                                    <TableColumn>ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent={"No se encontraron recepciones"}>
                                    {items.map((reception) => (
                                        <TableRow key={reception.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">REC-{reception.docEntry}</p>
                                                    <p className="text-xs text-gray-500">ID: {reception.supplierId}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{reception.supplierName}</p>
                                                    <p className="text-xs text-gray-500">{reception.supplierId}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-right font-bold">
                                                    {formatCurrency(reception.total, reception.currency)}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{formatDate(reception.docDate)}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{reception.detalle?.length || 0} items</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative flex justify-center items-center gap-2">
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button isIconOnly size="sm" variant="light">
                                                                <EllipsisVerticalIcon className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu>
                                                            <DropdownItem key="details" onPress={() => handleViewDetails(reception)}>
                                                                <div className="flex items-center gap-2">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Ver detalles
                                                                </div>
                                                            </DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* Modal de Detalles */}
                <Modal 
                    isOpen={isDetailOpen} 
                    onOpenChange={onDetailOpenChange}
                    size="5xl"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-baseline justify-between w-full">
                                        <div>
                                            <h3 className="text-xl font-semibold">Recepción</h3>
                                            {selectedReception && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    REC-{selectedReception.docEntry} • {selectedReception.supplierName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </ModalHeader>
                                <ModalBody className="space-y-4">
                                    {selectedReception && (
                                        <div className="space-y-4">
                                            {/* Cabecera compacta */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Proveedor</span>
                                                    <span className="font-medium text-right">{selectedReception.supplierName}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Código Proveedor</span>
                                                    <span className="text-right">{selectedReception.supplierId}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Monto Total</span>
                                                    <span className="font-semibold text-right">
                                                        {formatCurrency(selectedReception.total, selectedReception.currency)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Fecha</span>
                                                    <span className="text-right">{formatDate(selectedReception.docDate)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Dirección Destino</span>
                                                    <span className="text-right text-xs">{selectedReception.addressDestination}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Dirección Facturación</span>
                                                    <span className="text-right text-xs">{selectedReception.addressBilling}</span>
                                                </div>
                                            </div>

                                            {/* Sección de Detalle */}
                                            {selectedReception.detalle && selectedReception.detalle.length > 0 && (
                                                <Card className="border-none bg-default-50">
                                                    <CardBody className="py-3">
                                                        <p className="text-xs text-gray-500 mb-3 font-semibold">Detalle de Recepción</p>
                                                        <div className="space-y-2">
                                                            {selectedReception.detalle.map((item, index) => (
                                                                <div key={index} className="flex justify-between items-start gap-4 pb-2 border-b border-default-200 last:border-b-0">
                                                                    <p className="text-sm flex-1">{item.description}</p>
                                                                    <p className="text-sm font-medium text-right whitespace-nowrap">
                                                                        {formatCurrency(item.lineTotal, selectedReception.currency)}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            )}
                                        </div>
                                    )}
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cerrar
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </Dashboard>
    );
};

export default ReceptionPage;
