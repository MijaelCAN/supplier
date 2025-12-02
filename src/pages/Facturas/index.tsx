import {useState, useMemo, useEffect, useCallback} from 'react';
import type { Selection } from '@react-types/shared';
import type { statusConfig } from '@/store/types';
import {
    Button,
    Input,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
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
    CheckIcon,
    XMarkIcon,
    ChevronDownIcon, DocumentTextIcon, ClockIcon, BanknotesIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import {useInvoices, useExtendedStore} from '@/store/extendedStore';
import { Invoice } from '@/store/types';
import {fetchInvoicesByCardCode} from "@/services/invoices/invoicesApi.ts";
import {useAuth} from "@/store/authStore.ts";

const InvoicesList = () => {
    const {
        invoices,
        setInvoices,
        approveInvoice,
        rejectInvoice,
        selectedInvoice,
        setSelectedInvoice
    } = useInvoices();

    const invoiceStatuses = useExtendedStore(state => state.invoiceStatuses);
    //const currencies = useExtendedStore(state => state.currencies);
    const todayString = useMemo(() =>  new Date().toISOString().slice(0, 10), []);
    const [startDate, setStartDate] = useState<string>(todayString);
    const [endDate, setEndDate] = useState<string>(todayString);

    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<Selection>(new Set(["all"]));
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    const isValidRange = useMemo(() => startDate && endDate && startDate <= endDate, [startDate, endDate]);

    const fetchInvoicesData = useCallback(async (): Promise<Invoice[] | null> => {
        if (!startDate || !endDate) {
            throw new Error('Selecciona un rango de fechas válido.');
        }
        if (!isValidRange) {
            throw new Error('La fecha inicial no puede ser mayor que la fecha final.');
        }
        const formatDateForApi = (value: string) => value.replace(/-/g, '');
        return fetchInvoicesByCardCode(
            currentUser?.roleType !== 'internal' ? currentUser?.userCode : undefined,
            "Todos",
            formatDateForApi(startDate),
            formatDateForApi(endDate),
        );
    }, [startDate, endDate, isValidRange, currentUser?.userCode]);

    // Cargar facturas cuando cambian las fechas o al montar el componente
    useEffect(() => {
        const loadFilteredInvoices = async () => {
            try {
                setIsLoading(true);
                const result = await fetchInvoicesData();
                if (result && result.length > 0) {
                    // Reemplazar todas las facturas con las filtradas por fecha
                    setInvoices(result);
                } else {
                    // Si no hay resultados para el rango de fechas, limpiar las facturas
                    setInvoices([]);
                }
            } catch (e) {
                console.log("Error al filtrar las facturas por fecha", e);
                // En caso de error, limpiar las facturas para evitar mostrar datos incorrectos
                setInvoices([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isValidRange && currentUser?.userCode) {
            loadFilteredInvoices();
        }
    }, [startDate, endDate, fetchInvoicesData, isValidRange, currentUser?.userCode, setInvoices]);

    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

    const filteredInvoices = useMemo(() => {
        let filtered = invoices;

        if (filterValue) {
            filtered = filtered.filter(invoice =>
                invoice.invoiceNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
                invoice.supplierName.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        const selectedStatus = statusFilter === "all" || (statusFilter instanceof Set && statusFilter.size === 0) 
            ? "all" 
            : Array.from(statusFilter as Set<string>)[0] as string;
        if (selectedStatus !== "all") {
            filtered = filtered.filter(invoice => invoice.status === selectedStatus);
        }

        return filtered;
    }, [invoices, filterValue, statusFilter]);

    const pages = Math.ceil(filteredInvoices.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredInvoices.slice(start, end);
    }, [page, filteredInvoices, rowsPerPage]);

    const getStatusColor = (status: string): statusConfig => {
        const statusConfig = invoiceStatuses.find(s => s.key === status);
        return statusConfig ?? { key: status, label: status, color: 'default' };
    };

    const handleApprove = (invoiceId: string) => {
        approveInvoice(invoiceId, 'Usuario Actual');
    };

    const handleReject = (invoiceId: string) => {
        rejectInvoice(invoiceId, 'Rechazada por el usuario');
    };

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
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
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-PE');
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
                    placeholder="Buscar por número de factura o proveedor..."
                    startContent={<MagnifyingGlassIcon className="h-4 w-4"/>}
                    value={filterValue}
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                        label="Fecha inicio"
                        type="date"
                        value={startDate}
                        size="sm"
                        onValueChange={setStartDate}
                        className="sm:w-40"
                    />
                    <Input
                        label="Fecha fin"
                        type="date"
                        value={endDate}
                        size="sm"
                        onValueChange={setEndDate}
                        className="sm:w-40"
                    />
                </div>
                <div className="flex gap-3">
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button endContent={<ChevronDownIcon className="h-4 w-4"/>} variant="flat">
                                Estado
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Filtros de estado"
                            closeOnSelect={false}
                            selectedKeys={statusFilter}
                            selectionMode="single"
                            onSelectionChange={(selection) => {
                                const value = Array.from(selection)[0] as string;
                                setStatusFilter(new Set([value]));
                            }}
                        >
                            {[
                                { key: "all", label: "Todos" },
                                ...invoiceStatuses
                            ].map(status => (
                                <DropdownItem key={status.key}>{status.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
                    <p className="text-gray-600">Gestiona las facturas de la empresa</p>
                </div>

                {/* Resumen de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total Facturas</p>
                                <p className="text-xl font-bold">{invoices.length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <ClockIcon className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-500">Pendientes</p>
                                <p className="text-xl font-bold">
                                    {invoices.filter(i => i.status === 'Recibida').length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <CheckIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Pagadas</p>
                                <p className="text-xl font-bold">
                                    {invoices.filter(i => i.status === 'Pagada').length}
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
                                            invoices
                                                .filter(i => i.currency === 'PEN')
                                                .reduce((sum, i) => sum + i.amount, 0),
                                            'PEN'
                                        )}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {formatCurrency(
                                            invoices
                                                .filter(i => i.currency === 'USD')
                                                .reduce((sum, i) => sum + i.amount, 0),
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
                                    Cargando facturas...
                                </p>
                            </div>
                        ) : (
                            <Table
                                aria-label="Tabla de facturas"
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
                                    <TableColumn>N° FACTURA</TableColumn>
                                    <TableColumn>PROVEEDOR</TableColumn>
                                    <TableColumn className="text-right">MONTO</TableColumn>
                                    <TableColumn className="text-right">IMPUESTO</TableColumn>
                                    <TableColumn className="text-right">SALDO</TableColumn>
                                    <TableColumn>COND. PAGO</TableColumn>
                                    <TableColumn>FECHA VENCIMIENTO</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                    <TableColumn>ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent={"No se encontraron facturas"}>
                                    {items.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{invoice.invoiceNumber}</p>
                                                    <p className="text-xs text-gray-500">OC: {invoice.purchaseOrderId}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{invoice.supplierName}</p>
                                                    <p className="text-xs text-gray-500">{invoice.supplierId}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-bold text-sm">
                                                        {formatCurrency(invoice.amount, invoice.currency)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Subtotal: {formatCurrency(invoice.subtotal, invoice.currency)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-bold text-sm">
                                                        {formatCurrency(invoice.taxAmount, invoice.currency)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Retención: {formatCurrency(invoice.retention, invoice.currency)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-right">{formatCurrency(invoice.saldo, invoice.currency)}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{invoice.paymentTerm}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{invoice.dueDate}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    className="capitalize" 
                                                    color={getStatusColor(invoice.status).color}
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {getStatusColor(invoice.status).label}
                                                </Chip>
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
                                                            <DropdownItem key="details" onPress={() => handleViewDetails(invoice)}>
                                                                <div className="flex items-center gap-2">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Ver detalles
                                                                </div>
                                                            </DropdownItem>
                                                            {invoice.status !== 'Recibida' ? (
                                                                <>
                                                                    <DropdownItem key="Aprobar" onPress={() => handleApprove(invoice.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckIcon className="h-4 w-4 text-green-500" />
                                                                            Aprobar
                                                                        </div>
                                                                    </DropdownItem>
                                                                    <DropdownItem key="rechazar" onPress={() => handleReject(invoice.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <XMarkIcon className="h-4 w-4 text-red-500" />
                                                                            Rechazar
                                                                        </div>
                                                                    </DropdownItem>
                                                                </>
                                                            ): null }
                                                            {invoice.status === 'En Revisión' ? (
                                                                <>
                                                                    <DropdownItem key="dsd" onPress={() => handleApprove(invoice.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckIcon className="h-4 w-4 text-green-500" />
                                                                            Aprobar
                                                                        </div>
                                                                    </DropdownItem>
                                                                    <DropdownItem key="zxccz" onPress={() => handleReject(invoice.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <XMarkIcon className="h-4 w-4 text-red-500" />
                                                                            Rechazar
                                                                        </div>
                                                                    </DropdownItem>
                                                                </>
                                                            ): null }
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
                                            <h3 className="text-xl font-semibold">Factura</h3>
                                            {selectedInvoice && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {selectedInvoice.invoiceNumber} • {selectedInvoice.supplierName}
                                                </p>
                                            )}
                                        </div>
                                        {selectedInvoice && (
                                            <Chip 
                                                color={getStatusColor(selectedInvoice.status).color}
                                                size="sm" 
                                                variant="flat"
                                            >
                                                {getStatusColor(selectedInvoice.status)?.label}
                                            </Chip>
                                        )}
                                    </div>
                                </ModalHeader>
                                <ModalBody className="space-y-4">
                                    {selectedInvoice && (
                                        <div className="space-y-4">
                                            {/* Cabecera compacta tipo factura */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Proveedor</span>
                                                    <span className="font-medium text-right">{selectedInvoice.supplierName}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">N° Orden de Compra</span>
                                                    <span className="text-right">{selectedInvoice.purchaseOrderId}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Monto Total</span>
                                                    <span className="font-semibold text-right">
                                                        {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Subtotal</span>
                                                    <span className="text-right">
                                                        {formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Impuestos</span>
                                                    <span className="text-right">
                                                        {formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Fecha Recibida</span>
                                                    <span className="text-right">{formatDate(selectedInvoice.receivedDate)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Fecha Vencimiento</span>
                                                    <span className="text-right">{formatDate(selectedInvoice.dueDate)}</span>
                                                </div>
                                                {selectedInvoice.approvedDate && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Fecha Aprobación</span>
                                                        <span className="text-right">{formatDate(selectedInvoice.approvedDate)}</span>
                                                    </div>
                                                )}
                                                {selectedInvoice.paidDate && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Fecha Pago</span>
                                                        <span className="text-right">{formatDate(selectedInvoice.paidDate)}</span>
                                                    </div>
                                                )}
                                                {selectedInvoice.reviewedBy && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Revisado por</span>
                                                        <span className="text-right">{selectedInvoice.reviewedBy}</span>
                                                    </div>
                                                )}
                                                {selectedInvoice.approvedBy && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Aprobado por</span>
                                                        <span className="text-right">{selectedInvoice.approvedBy}</span>
                                                    </div>
                                                )}
                                                {selectedInvoice.rejectedDate && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Fecha Rechazo</span>
                                                        <span className="text-right">{formatDate(selectedInvoice.rejectedDate)}</span>
                                                    </div>
                                                )}
                                                {selectedInvoice.paymentTerm && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Motivo Rechazo</span>
                                                        <span className="text-right">{selectedInvoice.paymentTerm}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedInvoice.notes && (
                                                <Card className="border-none bg-default-50">
                                                    <CardBody className="py-3">
                                                        <p className="text-xs text-gray-500 mb-1">Notas</p>
                                                        <p className="text-sm">{selectedInvoice.notes}</p>
                                                    </CardBody>
                                                </Card>
                                            )}

                                            {selectedInvoice.documentUrl && (
                                                <Card className="border-none bg-default-50">
                                                    <CardBody className="py-3">
                                                        <p className="text-xs text-gray-500 mb-1">Documento</p>
                                                        <a 
                                                            href={selectedInvoice.documentUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary hover:underline"
                                                        >
                                                            Ver documento
                                                        </a>
                                                    </CardBody>
                                                </Card>
                                            )}

                                            {/* Sección de Detalle */}
                                            {selectedInvoice.detalle && selectedInvoice.detalle.length > 0 && (
                                                <Card className="border-none bg-default-50">
                                                    <CardBody className="py-3">
                                                        <p className="text-xs text-gray-500 mb-3 font-semibold">Detalle de Factura</p>
                                                        <div className="space-y-2">
                                                            {selectedInvoice.detalle.map((item, index) => (
                                                                <div key={index} className="flex justify-between items-start gap-4 pb-2 border-b border-default-200 last:border-b-0">
                                                                    <p className="text-sm flex-1">{item.description}</p>
                                                                    <p className="text-sm font-medium text-right whitespace-nowrap">
                                                                        {formatCurrency(item.lineTotal, selectedInvoice.currency)}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            )}

                                            {/* Sección de Pagos */}
                                            {selectedInvoice.pagos && selectedInvoice.pagos.length > 0 && (
                                                <Card className="border-none bg-default-50">
                                                    <CardBody className="py-3">
                                                        <p className="text-xs text-gray-500 mb-3 font-semibold">Pagos</p>
                                                        <div className="space-y-2">
                                                            {selectedInvoice.pagos.map((pago, index) => (
                                                                <div key={index} className="flex justify-between items-center gap-4 pb-2 border-b border-default-200 last:border-b-0">
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">Pago #{index + 1}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Fecha: {formatDate(pago.docDate)}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Doc. Entry: {pago.docEntry}
                                                                        </p>
                                                                    </div>
                                                                    <p className="text-sm font-medium text-right whitespace-nowrap">
                                                                        {formatCurrency(pago.sumApplied, selectedInvoice.currency)}
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

export default InvoicesList;

