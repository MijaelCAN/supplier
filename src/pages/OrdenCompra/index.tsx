import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
    useDisclosure
} from "@heroui/react";
import {
    CheckIcon,
    ChevronDownIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    XMarkIcon,
    ClockIcon,
    BanknotesIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import {StatusColor, useExtendedStore, usePurchaseOrders, useSuppliers} from '@/store/extendedStore';
import {OrderItem, PurchaseOrder, type statusConfig} from '@/store/types';
import {fetchOrdersByCardCode} from "@/services/orders/ordersApi.ts";
import {useAuth} from "@/store/authStore.ts";
import {LoadingSpinner} from "@/components/LoadingSpinner.tsx";


const PurchaseOrdersList = () => {
    const {
        purchaseOrders,
        setPurchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        approvePurchaseOrder,
        selectedOrder,
        setSelectedOrder
    } = usePurchaseOrders();
    
    const { suppliers } = useSuppliers();
    const orderStatuses = useExtendedStore(state => state.orderStatuses);
    const priorities = useExtendedStore(state => state.priorities);
    const departments = useExtendedStore(state => state.departments);
    const currencies = useExtendedStore(state => state.currencies);

    const getDateString = (date: Date) =>
        date.toISOString().slice(0, 10);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const todayString = useMemo(() => getDateString(today), []);
    const thirtyDaysAgoString = useMemo(() => getDateString(thirtyDaysAgo), []);
    //const todayString = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [startDate, setStartDate] = useState<string>(thirtyDaysAgoString);
    const [endDate, setEndDate] = useState<string>(todayString);

    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser, isProveedor, isCompras } = useAuth();

    const isValidRange = useMemo(() => startDate && endDate && startDate <= endDate, [startDate, endDate]);

    const fetchOrdersData = useCallback(async (): Promise<PurchaseOrder[] | null> => {
        if (!startDate || !endDate) {
            console.log("Selecciona un rango de fechas válido.")
            throw new Error('Selecciona un rango de fechas válido.');
        }
        if (!isValidRange) {
            console.log('La fecha inicial no puede ser mayor que la fecha final.')
            throw new Error('La fecha inicial no puede ser mayor que la fecha final.');
        }
        const formatDateForApi = (value: string) => value.replace(/-/g, '');
        return fetchOrdersByCardCode(
            currentUser?.roleType !== 'internal' ? currentUser?.userCode : undefined,
            "Todos",
            formatDateForApi(startDate),
            formatDateForApi(endDate),
        );
    }, [startDate, endDate, isValidRange]);

    // Cargar órdenes cuando cambian las fechas o al montar el componente
    useEffect(() => {
        const loadFilteredOrders = async () => {
            try {
                setIsLoading(true);
                const result = await fetchOrdersData();
                if (result && result.length > 0) {
                    // Reemplazar todas las órdenes con las filtradas por fecha
                    setPurchaseOrders(result);
                } else {
                    // Si no hay resultados para el rango de fechas, limpiar las órdenes
                    setPurchaseOrders([]);
                }
            } catch (e) {
                console.log("Error al filtrar las ordenes de compra por fecha", e);
                // En caso de error, limpiar las órdenes para evitar mostrar datos incorrectos
                setPurchaseOrders([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isValidRange && currentUser?.userCode) {
            loadFilteredOrders();
        }
    }, [startDate, endDate, fetchOrdersData, isValidRange, currentUser?.userCode, setPurchaseOrders]);


    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
    //const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();

    // Estado para formulario
    const [formData, setFormData] = useState({
        supplierId: '',
        supplierName: '',
        totalAmount: 0,
        currency: 'PEN',
        priority: 'Media',
        deliveryDate: '',
        paymentTerms: '30',
        department: '',
        requestedBy: '',
        notes: '',
        items: [] as OrderItem[]
    });

    const filteredOrders = useMemo(() => {
        let filtered = purchaseOrders;
        if (filterValue) {
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
                order.supplierName.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        return filtered;
    }, [purchaseOrders, filterValue, statusFilter]);

    const pages = Math.ceil(filteredOrders.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredOrders.slice(start, end);
    }, [page, filteredOrders, rowsPerPage]);


    const getStatusColor = (status: string): statusConfig => {
        const statusConfig = orderStatuses.find(s => s.key === status);
        return statusConfig ?? { key: status, label: status, color: 'default' };
    };

    function obtenerColorPorAvance(porcentaje: number): { color: StatusColor; label: string } {
        if (porcentaje === 0) {
            return { color: 'default', label: 'Sin inicio' };
        }
        if (porcentaje > 0 && porcentaje <= 25) {
            return { color: 'danger', label: 'Inicio' };
        }
        if (porcentaje > 25 && porcentaje <= 50) {
            return { color: 'warning', label: 'En progreso' };
        }
        if (porcentaje > 50 && porcentaje < 100) {
            return { color: 'primary', label: 'Avanzado' };
        }
        if (porcentaje === 100) {
            return { color: 'success', label: 'Completado' };
        }
        return { color: 'default', label: 'Desconocido' };
    }


    const handleCreateOrder = () => {
        if (!formData.supplierId || !formData.deliveryDate || !formData.department || !formData.requestedBy) {
            return;
        }

        const supplier = suppliers.find(s => s.docEntry === formData.supplierId);
        if (!supplier) return;

        const newOrder: Omit<PurchaseOrder, 'id'> = {
            orderNumber: `OC-2024-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
            supplierId: formData.supplierId,
            supplierName: supplier.cardName,
            totalAmount: formData.totalAmount,
            currency: formData.currency,
            status: 'Pendiente', // Borrador
            priority: formData.priority as any,
            createdDate: new Date().toISOString().split('T')[0],
            deliveryDate: formData.deliveryDate,
            paymentTerms: formData.paymentTerms,
            department: formData.department,
            requestedBy: formData.requestedBy,
            notes: formData.notes,
            createdBy: 'Usuario Actual',
            items: formData.items,
            avance: 0
        };

        addPurchaseOrder(newOrder);
        setFormData({
            supplierId: '',
            supplierName: '',
            totalAmount: 0,
            currency: 'PEN',
            priority: 'Media',
            deliveryDate: '',
            paymentTerms: '30',
            department: '',
            requestedBy: '',
            notes: '',
            items: []
        });
        onCreateOpenChange();
    };

    const handleApprove = (orderId: string) => {
        approvePurchaseOrder(orderId, 'Usuario Actual');
    };

    const handleReject = (orderId: string) => {
        updatePurchaseOrder(orderId, { status: 'Cancelada' });
    };

    const handleViewDetails = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        onDetailOpen();
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    // Calcular métricas
    const metrics = useMemo(() => {
        const total = purchaseOrders.length;
        const abiertos = purchaseOrders.filter(o => 
            o.status === 'Pendiente' || o.status === 'En Proceso' || o.status === 'Aprobada'
        ).length;
        const cerrados = purchaseOrders.filter(o => 
            o.status === 'Completada' || o.status === 'Cancelada'
        ).length;
        const montoTotal = purchaseOrders.reduce((sum, order) => {
            // Convertir a PEN si es necesario para sumar
            const amount = order.currency === 'USD' ? order.totalAmount * 3.7 : order.totalAmount;
            return sum + amount;
        }, 0);

        return { total, abiertos, cerrados, montoTotal };
    }, [purchaseOrders]);

    // Mensaje según el rol
    const getWelcomeMessage = () => {
        if (isProveedor) {
            return {
                title: "Mis Órdenes de Compra",
                description: "Consulta y gestiona tus órdenes de compra asignadas"
            };
        } else if (isCompras) {
            return {
                title: "Órdenes de Compra",
                description: "Gestiona y supervisa todas las órdenes de compra de la empresa"
            };
        } else {
            return {
                title: "Órdenes de Compra",
                description: "Gestiona las órdenes de compra de la empresa"
            };
        }
    };
    const getSearchMessage = () => isProveedor ? "Buscar por número de orden" : "Buscar por número de orden o proveedor";

    const welcomeMessage = getWelcomeMessage();
    const searchMessage = getSearchMessage();

    const topContent = (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder={searchMessage}
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
                            onSelectionChange={(selection) => setStatusFilter(Array.from(selection)[0] as string)}
                        >
                            {[
                                { key: "all", label: "Todos" },
                                ...orderStatuses
                            ].map(status => (
                                <DropdownItem key={status.key}>{status.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    {/*<Button color="primary" endContent={<PlusIcon className="h-4 w-4"/>} onPress={onCreateOpen}>
                        Nueva Orden
                    </Button>*/}
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="space-y-6">
                {/* Header con mensaje según rol */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{welcomeMessage.title}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{welcomeMessage.description}</p>
                </div>

                {/* Indicadores de métricas */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                            <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Órdenes</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.total}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-azul/10">
                                        <DocumentTextIcon className="h-6 w-6 text-azul" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                            <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Abiertas</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.abiertos}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-yellow-500/10">
                                        <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                            <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cerradas</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.cerrados}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-500" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                            <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto Total</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                            {formatCurrency(metrics.montoTotal, 'PEN')}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-rojo/10">
                                        <BanknotesIcon className="h-6 w-6 text-rojo" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardBody className="p-4">
                        {isLoading ? (
                            <LoadingSpinner message="Cargando órdenes de compra..." />
                        ) : (
                            <Table
                                aria-label="Tabla de órdenes de compra"
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
                                    <TableColumn>N° ORDEN</TableColumn>
                                    <TableColumn>PROVEEDOR</TableColumn>
                                    <TableColumn>MONTO</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                    <TableColumn>AVANCE</TableColumn>
                                    {/*<TableColumn>FECHA ENTREGA</TableColumn>
                                    <TableColumn>DEPARTAMENTO</TableColumn>*/}
                                    <TableColumn className="flex justify-center items-center">ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {items.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{order.orderNumber}</p>
                                                    <p className="text-xs text-gray-500">{order.createdDate}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{order.supplierName}</p>
                                                    <p className="text-xs text-gray-500">Encargado compra: {order.requestedBy}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">
                                                        {formatCurrency(order.totalAmount, order.currency)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{order.paymentTerms}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    className="capitalize" 
                                                    color={getStatusColor(order.status).color || 'default'}
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {getStatusColor(order.status).label}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    className="capitalize" 
                                                    color={obtenerColorPorAvance(order.avance).color}
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {order.avance}%
                                                </Chip>
                                            </TableCell>
                                            {/*<TableCell>
                                                <p className="text-sm">{order.deliveryDate}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{order.department}</p>
                                            </TableCell>*/}
                                            <TableCell>
                                                <div className="relative flex justify-center items-center gap-2">
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button isIconOnly size="sm" variant="light">
                                                                <EllipsisVerticalIcon className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu>
                                                            <DropdownItem key="detail" onPress={() => handleViewDetails(order)}>
                                                                <div className="flex items-center gap-2">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Ver detalles
                                                                </div>
                                                            </DropdownItem>
                                                            {order.status === 'Pendiente' ? (
                                                                <>
                                                                    <DropdownItem key="Aprobar" onPress={() => handleApprove(order.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckIcon className="h-4 w-4 text-green-500" />
                                                                            Aprobar
                                                                        </div>
                                                                    </DropdownItem>
                                                                    <DropdownItem key="rechazar" onPress={() => handleReject(order.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <XMarkIcon className="h-4 w-4 text-red-500" />
                                                                            Rechazar
                                                                        </div>
                                                                    </DropdownItem>
                                                                </>
                                                            ): null}
                                                            {order.status === 'Borrador' ? (
                                                                <DropdownItem key="Editar">
                                                                    <div className="flex items-center gap-2">
                                                                        <PencilIcon className="h-4 w-4" />
                                                                        Editar
                                                                    </div>
                                                                </DropdownItem>
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
                                            <h3 className="text-xl font-semibold">Orden de Compra</h3>
                                            {selectedOrder && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {selectedOrder.orderNumber} • {selectedOrder.supplierName}
                                                </p>
                                            )}
                                        </div>
                                        {selectedOrder && (
                                            <Chip 
                                                color={getStatusColor(selectedOrder.status)?.color}
                                                size="sm" 
                                                variant="flat"
                                            >
                                                {getStatusColor(selectedOrder.status)?.label}
                                            </Chip>
                                        )}
                                    </div>
                                </ModalHeader>
                                <ModalBody className="space-y-4">
                                    {selectedOrder && (
                                        <div className="space-y-4">
                                            {/* Cabecera compacta tipo orden (sin cards) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Proveedor</span>
                                                    <span className="font-medium text-right">{selectedOrder.supplierName}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Monto Total</span>
                                                    <span className="font-semibold text-right">
                                                        {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Fecha de Entrega</span>
                                                    <span className="text-right">{selectedOrder.deliveryDate}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Encargado compra</span>
                                                    <span className="text-right">{selectedOrder.requestedBy}</span>
                                                </div>
                                                {selectedOrder.department && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Departamento</span>
                                                        <span className="text-right">{selectedOrder.department}</span>
                                                    </div>
                                                )}
                                                {selectedOrder.paymentTerms && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-500">Términos de Pago</span>
                                                        <span className="text-right">{selectedOrder.paymentTerms}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tabla de Items con cabecera fija y scroll */}
                                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                                <Card>
                                                    <CardHeader className="pb-0 px-4 pt-4">
                                                        <div className="flex items-center justify-between w-full">
                                                            <h4 className="text-base font-semibold">Detalle de Ítems</h4>
                                                            <p className="text-xs text-gray-500">
                                                                {selectedOrder.items.length} ítem(s)
                                                            </p>
                                                        </div>
                                                    </CardHeader>
                                                    <CardBody className="px-0">
                                                        <div className="max-h-[50vh] overflow-auto">
                                                            <Table
                                                                aria-label="Detalle de items de la orden"
                                                                isHeaderSticky
                                                                classNames={{ wrapper: "max-h-[50vh]" }}
                                                            >
                                                                <TableHeader>
                                                                    <TableColumn className="w-[140px]">CÓDIGO</TableColumn>
                                                                    <TableColumn className="w-[740px]">DESCRIPCIÓN</TableColumn>
                                                                    <TableColumn className="text-right w-[110px]">CANT.</TableColumn>
                                                                    <TableColumn className="text-right w-[110px]">CANT.PEND</TableColumn>
                                                                    <TableColumn className="text-right w-[140px]">ESTADO</TableColumn>
                                                                    <TableColumn className="text-right w-[140px]">P.UNIT.</TableColumn>
                                                                    <TableColumn className="text-right w-[140px]">TOTAL</TableColumn>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {selectedOrder.items.map((item) => (
                                                                        <TableRow key={item.id}>
                                                                            <TableCell>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-medium">{item.productCode}</span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="flex flex-col">
                                                                                    {/*<span className="text-sm font-medium">{item.productName}</span>*/}
                                                                                    {item.description && (
                                                                                        <span className="text-xs text-gray-500">{item.description}</span>
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="text-right text-sm">
                                                                                    {item.quantity} {item.unit}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="text-right text-sm">
                                                                                    {item.qtyPend }
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-end">
                                                                                <Chip
                                                                                    size="sm"
                                                                                    variant="flat"
                                                                                    color={getStatusColor(item.state === "Cerrado" ? 'Completada':'En Proceso')?.color}
                                                                                >
                                                                                    {getStatusColor(item.state === "Cerrado" ? 'Completada':'En Proceso')?.label}
                                                                                </Chip>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="text-right text-sm">
                                                                                    {formatCurrency(item.unitPrice, selectedOrder.currency)}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="text-right text-sm font-semibold">
                                                                                    {formatCurrency(item.totalPrice, selectedOrder.currency)}
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            )}

                                            {selectedOrder.notes && (
                                                <Card className="border-none bg-default-50">
                                                    <CardBody className="py-3">
                                                        <p className="text-xs text-gray-500 mb-1">Notas</p>
                                                        <p className="text-sm">{selectedOrder.notes}</p>
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

                {/* Modal de Crear Orden */}
                <Modal 
                    isOpen={isCreateOpen} 
                    onOpenChange={onCreateOpenChange}
                    size="2xl"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Nueva Orden de Compra</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Proveedor"
                                            placeholder="Seleccionar proveedor"
                                            selectedKeys={formData.supplierId ? [formData.supplierId] : []}
                                            onSelectionChange={(keys) => {
                                                const supplierId = Array.from(keys)[0] as string;
                                                const supplier = suppliers.find(s => s.docEntry === supplierId);
                                                setFormData({
                                                    ...formData,
                                                    supplierId,
                                                    supplierName: supplier?.cardName || '',
                                                    paymentTerms: supplier?.paymentTerms || '30'
                                                });
                                            }}
                                        >
                                            {suppliers.map(supplier => (
                                                <SelectItem key={supplier.docEntry}>
                                                    {supplier.cardName}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="Departamento"
                                            placeholder="Seleccionar departamento"
                                            selectedKeys={formData.department ? [formData.department] : []}
                                            onSelectionChange={(keys) => 
                                                setFormData({
                                                    ...formData,
                                                    department: Array.from(keys)[0] as string
                                                })
                                            }
                                        >
                                            {departments.map(dept => (
                                                <SelectItem key={dept.key}>
                                                    {dept.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Monto Total"
                                            type="number"
                                            value={formData.totalAmount.toString()}
                                            onValueChange={(value) => setFormData({
                                                ...formData,
                                                totalAmount: parseFloat(value) || 0
                                            })}
                                        />

                                        <Select
                                            label="Moneda"
                                            selectedKeys={[formData.currency]}
                                            onSelectionChange={(keys) => 
                                                setFormData({
                                                    ...formData,
                                                    currency: Array.from(keys)[0] as string
                                                })
                                            }
                                        >
                                            {currencies.map(currency => (
                                                <SelectItem key={currency.key} >
                                                    {currency.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Fecha de Entrega"
                                            type="date"
                                            value={formData.deliveryDate}
                                            onValueChange={(value) => setFormData({
                                                ...formData,
                                                deliveryDate: value
                                            })}
                                        />

                                        <Select
                                            label="Prioridad"
                                            selectedKeys={[formData.priority]}
                                            onSelectionChange={(keys) => 
                                                setFormData({
                                                    ...formData,
                                                    priority: Array.from(keys)[0] as string
                                                })
                                            }
                                        >
                                            {priorities.map(priority => (
                                                <SelectItem key={priority.key}>
                                                    {priority.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Solicitado por"
                                            value={formData.requestedBy}
                                            onValueChange={(value) => setFormData({
                                                ...formData,
                                                requestedBy: value
                                            })}
                                        />

                                        <Input
                                            label="Términos de Pago (días)"
                                            type="number"
                                            value={formData.paymentTerms}
                                            onValueChange={(value) => setFormData({
                                                ...formData,
                                                paymentTerms: value
                                            })}
                                        />
                                    </div>

                                    <Textarea
                                        label="Notas"
                                        placeholder="Notas adicionales sobre la orden"
                                        value={formData.notes}
                                        onValueChange={(value) => setFormData({
                                            ...formData,
                                            notes: value
                                        })}
                                    />
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button color="primary" onPress={handleCreateOrder}>
                                        Crear Orden
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

export default PurchaseOrdersList;
