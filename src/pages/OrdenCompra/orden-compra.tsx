import {
    ShoppingCartIcon,
    TruckIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    ClockIcon,
    PlusIcon,
    Squares2X2Icon,
    TableCellsIcon,
    StarIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon, ChevronDownIcon, H1Icon,
} from '@heroicons/react/24/outline';
import Dashboard from "@/layouts/Dashboard";
import {
    Button,
    Card,
    CardBody,
    Chip, ChipProps,
    Dropdown, DropdownItem,
    DropdownMenu,
    DropdownTrigger, Input,
    Selection,
    SortDescriptor,
    User
} from "@heroui/react";
import {PurchaseOrder} from "@/components/OrdenCompra/Types/orderTypes.ts";
import OrderCard from "@/components/OrdenCompra/orderCard.tsx";
import {OrderDetail} from "@/components/OrdenCompra/orderDetail.tsx";
import {Key, useMemo, useState} from "react";
import HeaderComponent from "@/components/headerComponent.tsx";
import OrderTable from "@/components/OrdenCompra/orderTable.tsx";

const statusColorMap: Record<string, ChipProps["color"]> = {
    A: "success",
    P: "warning",
    S: "danger",
    I: "default",
};

const statusLabels: Record<string, string> = {
    A: "Activo",
    P: "Pendiente",
    S: "Suspendido",
    I: "Inactivo",
};

const columns = [
    { name: "OC", uid: "id", sortable: true },
    { name: "PROVEEDOR", uid: "name", sortable: true },
    { name: "FECHA", uid: "fecha", sortable: true },
    { name: "ENTREGA", uid: "entrega", sortable: true },
    { name: "TOTAL", uid: "total", sortable: true },
    { name: "ESTADO", uid: "status", sortable: true },
    { name: "ITEMS", uid: "items", sortable: true },
    { name: "NOTAS", uid: "notas", sortable: true },
    { name: "ACCIONES", uid: "actions" },
];
const INITIAL_VISIBLE_COLUMNS = ["id", "fecha", "entrega", "total", "status", "items", "notas", "actions"];

const PurchaseOrderReception = () => {
    const [userRole] = useState('admin'); // 'admin' | 'supplier'
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reception'
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState<Selection>("all");
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "name",
        direction: "ascending",
    });

    // Datos de ejemplo
    const purchaseOrders: PurchaseOrder[] = [
        {
            id: 'PO-2024-001',
            supplier: 'Proveedor ABC S.A.C.',
            date: '2024-06-10',
            deliveryDate: '2024-06-15',
            total: 15750.00,
            status: 'pending',
            items: [
                { id: 1, name: 'Producto A', quantity: 10, price: 150.00, received: 0 },
                { id: 2, name: 'Producto B', quantity: 5, price: 300.00, received: 0 }
            ],
            notes: 'Entrega urgente requerida'
        },
        {
            id: 'PO-2024-002',
            supplier: 'Distribuidora XYZ E.I.R.L.',
            date: '2024-06-08',
            deliveryDate: '2024-06-12',
            total: 8900.00,
            status: 'in_transit',
            items: [
                { id: 3, name: 'Producto C', quantity: 20, price: 45.00, received: 0 },
                { id: 4, name: 'Producto D', quantity: 15, price: 520.00, received: 0 }
            ],
            notes: 'Verificar calidad al recibir'
        },
        {
            id: 'PO-2024-003',
            supplier: 'Suministros DEF S.A.',
            date: '2024-06-05',
            deliveryDate: '2024-06-10',
            total: 12300.00,
            status: 'partially_received',
            items: [
                { id: 5, name: 'Producto E', quantity: 8, price: 200.00, received: 5 },
                { id: 6, name: 'Producto F', quantity: 12, price: 850.00, received: 12 }
            ],
            notes: 'Pendiente 3 unidades del Producto E'
        }
    ];

    const headerColumns = useMemo(() => {
        if (visibleColumns === "all") return columns;
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const hasSearchFilter = Boolean(filterValue);
    const [page, setPage] = useState(1);

    const filteredItems = useMemo(() => {
        let filteredOrders = [...purchaseOrders];

        if (hasSearchFilter) {
            filteredOrders = filteredOrders.filter((order) =>
                order.id.toLowerCase().includes(filterValue.toLowerCase()) ||
                order.supplier.toLowerCase().includes(filterValue.toLowerCase())
                //order.total.includes(filterValue.toLowerCase())
            );
        }
        if (statusFilter !== "all" && Array.from(statusFilter).length !== 0) {
            filteredOrders = filteredOrders.filter((order) =>
                Array.from(statusFilter).includes(order.status),
            );
        }

        return filteredOrders;
    }, [purchaseOrders, filterValue, statusFilter, hasSearchFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);
    const sortedItems = useMemo(() => {
        return [...items].sort((a: PurchaseOrder, b: PurchaseOrder) => {
            const first = a[sortDescriptor.column as keyof PurchaseOrder] as number | string;
            const second = b[sortDescriptor.column as keyof PurchaseOrder] as number | string;
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const filteredOrders: PurchaseOrder[] = purchaseOrders.filter(order =>
        filterStatus === 'all' || order.status === filterStatus
    );
    const onRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    };
    const onSearchChange = (value?: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    };
    const onClear = () => {
        setFilterValue("");
        setPage(1);
    };

    type ViewMode = 'table' | 'cards';
    const title = "Orden de compra"
    const subtitle = "Panel de Administración"
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    const renderCell = (order: PurchaseOrder, columnKey: Key) => {
        const cellValue = order[columnKey as keyof PurchaseOrder];

        switch (columnKey) {
            case "id":
                return (
                    <User
                        avatarProps={{ radius: "lg", src: "order.avatar" }}
                        description={order.supplier}
                        name={order.id}
                    >
                        {order.supplier}
                    </User>
                );
            case "entrega":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{order.date}</p>
                        <p className="text-bold text-sm capitalize text-default-400">{"order.city"}</p>
                    </div>
                );
            case "total":
                return (
                    <div className="flex items-center gap-2">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-semibold">{order.total}</span>
                    </div>
                );
            case "status":
                return (
                    <Chip className="capitalize" color={statusColorMap[order.status]} size="sm" variant="flat">
                        {statusLabels[order.status]}
                    </Chip>
                );
            case "items":
                return (
                <div className="flex flex-col">
                    <p className="text-bold text-sm">{order.items.length}</p>
                    <p className="text-bold text-sm text-default-400">
                        S/ {order.items.length.toLocaleString()}
                    </p>
                </div>
            );
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVerticalIcon className="h-4 w-4" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem
                                    key="view"
                                    startContent={<EyeIcon className="h-4 w-4" />}
                                    onPress={() => {
                                        /*setSelectedSupplier(order);
                                        onViewOpen();*/
                                    }}
                                >
                                    Ver detalles
                                </DropdownItem>
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="h-4 w-4" />}
                                    onPress={() => {
                                        /*console.log(order)
                                        setSelectedSupplier(order);
                                        onEditOpen();*/
                                    }}
                                >
                                    Editar
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<TrashIcon className="h-4 w-4" />}
                                    onPress={() => {
                                        /*setSelectedSupplier(supplier);
                                        onDeleteOpen();*/
                                    }}
                                >
                                    Eliminar
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return cellValue;
        }
    };
    const topContent = useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Buscar orden..."
                        startContent={<MagnifyingGlassIcon className="h-4 w-4"/>}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
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
                                selectionMode="multiple"
                                onSelectionChange={setStatusFilter}
                            >
                                <DropdownItem key="A">Activo</DropdownItem>
                                <DropdownItem key="P">Pendiente</DropdownItem>
                                <DropdownItem key="S">Suspendido</DropdownItem>
                                <DropdownItem key="I">Inactivo</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="h-4 w-4"/>} variant="flat">
                                    Columnas
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Columnas de tabla"
                                closeOnSelect={false}
                                selectedKeys={visibleColumns}
                                selectionMode="multiple"
                                onSelectionChange={setVisibleColumns}
                            >
                                {columns.map((column) => (
                                    <DropdownItem key={column.uid} className="capitalize">
                                        {column.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        {/*<Button color="primary" endContent={<PlusIcon className="h-4 w-4" />} onPress={()=> {onRegisterOpen()}}>
                            Nuevo Proveedor
                        </Button>*/}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {purchaseOrders.length} ordenes</span>
                    <label className="flex items-center text-default-400 text-small">
                        Filas por página:
                        <select
                            className="bg-transparent outline-none text-default-400 text-small"
                            onChange={onRowsPerPageChange}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                        </select>
                    </label>
                </div>
            </div>
        )
    },[])
    const bottomContent = useMemo(() => {
        return(
          <h1>Pie de Tabla</h1>
        );
    },[])

    const messageEmpty = useMemo(() =>{
        return (
            <div className="text-center py-12">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes</h3>
                <p className="text-gray-500">No se encontraron órdenes con los filtros seleccionados.</p>
            </div>
        );
    },[])


    return (
        <Dashboard>
            <div className="w-full space-y-6">
                <HeaderComponent title={title} subtitle={subtitle} isOptions={false}/>

                {/* Métricas Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShoppingCartIcon className="h-6 w-6 text-blue-600"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Órdenes Activas</p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <ClockIcon className="h-6 w-6 text-yellow-600"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pendientes</p>
                                <p className="text-2xl font-bold">3</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-green-600"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Completadas</p>
                                <p className="text-2xl font-bold">8</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <CurrencyDollarIcon className="h-6 w-6 text-purple-600"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Valor Total</p>
                                <p className="text-2xl font-bold">$89.2K</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Main Content */}
                <div>
                    {/* Tabs */}
                    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                                activeTab === 'orders'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <DocumentTextIcon className="w-5 h-5"/>
                                <span>Órdenes de Compra</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('reception')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                                activeTab === 'reception'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <TruckIcon className="w-5 h-5"/>
                                <span>Recepción de Mercancías</span>
                            </div>
                        </button>

                        <div className="flex space-x-2 ml-4">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-md transition-colors duration-200 ${
                                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                                aria-label="Vista en tabla"
                                title="Vista en tabla"
                            >
                                <TableCellsIcon className="w-6 h-6"/>
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`p-2 rounded-md transition-colors duration-200 ${
                                    viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                                aria-label="Vista en tarjetas"
                                title="Vista en tarjetas"
                            >
                                <Squares2X2Icon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="pending">Pendiente</option>
                                <option value="in_transit">En Tránsito</option>
                                <option value="partially_received">Parcialmente Recibido</option>
                                <option value="completed">Completado</option>
                            </select>
                        </div>

                        {userRole === 'admin' && (
                            <button
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                <PlusIcon className="w-5 h-5 mr-2"/>
                                Nueva Orden
                            </button>
                        )}
                    </div>

                    {/* Orders Grid */}
                    {viewMode === 'table' ? (
                        <OrderTable
                            headerColumns={headerColumns}
                            sortedItems={sortedItems}
                            renderCell={renderCell}
                            topContent={topContent}
                            bottomContent={bottomContent}
                            selectedKeys={selectedKeys}
                            setSelectedKeys={setSelectedKeys}
                            sortDescriptor={sortDescriptor}
                            setSortDescriptor={setSortDescriptor}
                            messageEmpty = {messageEmpty}
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredOrders.map((order) => (
                                <OrderCard userRole={userRole} order={order} setSelectedOrder={setSelectedOrder}/>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes</h3>
                            <p className="text-gray-500">No se encontraron órdenes con los filtros seleccionados.</p>
                        </div>
                    )}
                </div>

                {/* Order Detail Modal */}
                {selectedOrder && (
                    <OrderDetail
                        key={selectedOrder.id}
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )}
            </div>
        </Dashboard>
    );
};

export default PurchaseOrderReception;