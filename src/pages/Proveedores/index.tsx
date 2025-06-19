import { useState, useMemo } from "react";
import {
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Chip,
    User,
    Pagination,
    Selection,
    ChipProps,
    SortDescriptor,
    useDisclosure,
    Card,
    CardBody,
} from "@heroui/react";
import {
    ChevronDownIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    StarIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import {Supplier, useSuppliers} from "@/store";
import HeaderComponent from "@/components/headerComponent.tsx";
import OrderTable from "@/components/OrdenCompra/orderTable.tsx";
import {ModalRegister} from "@/components/Proveedores/modalRegister.tsx";
import {ModalDelete} from "@/components/Proveedores/ModalDelete.tsx";
import {ModalDetail} from "@/components/Proveedores/ModalDetail.tsx";
import {ModalEdit} from "@/components/Proveedores/ModalEdit.tsx";
import {useNavigate} from "react-router-dom";

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
    { name: "PROVEEDOR", uid: "name", sortable: true },
    { name: "CONTACTO", uid: "contact", sortable: true },
    { name: "TIPO", uid: "businessType", sortable: true },
    { name: "RATING", uid: "rating", sortable: true },
    { name: "ÓRDENES", uid: "totalOrders", sortable: true },
    { name: "ESTADO", uid: "status", sortable: true },
    { name: "ACCIONES", uid: "actions" },
];



const INITIAL_VISIBLE_COLUMNS = ["name", "contact", "businessType", "rating", "totalOrders", "status", "actions"];

export default function SupplierManagement() {
    const navigate = useNavigate()
    const { suppliers, deleteSupplier, setSelectedSupplier, selectedSupplier, addSupplier, updateSupplier} = useSuppliers()
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "name",
        direction: "ascending",
    });
    const [page, setPage] = useState(1);

    const { isOpen: isRegisterOpen, onOpen: onRegisterOpen, onClose: onRegisterClose } = useDisclosure();
    const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = useMemo(() => {
        if (visibleColumns === "all") return columns;
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = useMemo(() => {
        let filteredSuppliers = [...suppliers];

        if (hasSearchFilter) {
            filteredSuppliers = filteredSuppliers.filter((supplier) =>
                supplier.cardName.toLowerCase().includes(filterValue.toLowerCase()) ||
                supplier.email.toLowerCase().includes(filterValue.toLowerCase()) ||
                supplier.contactPerson.toLowerCase().includes(filterValue.toLowerCase())
            );
        }
        if (statusFilter !== "all" && Array.from(statusFilter).length !== 0) {
            filteredSuppliers = filteredSuppliers.filter((supplier) =>
                Array.from(statusFilter).includes(supplier.status),
            );
        }

        return filteredSuppliers;
    }, [suppliers, filterValue, statusFilter, hasSearchFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = useMemo(() => {
        return [...items].sort((a: Supplier, b: Supplier) => {
            const first = a[sortDescriptor.column as keyof Supplier] as number | string;
            const second = b[sortDescriptor.column as keyof Supplier] as number | string;
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const renderCell = (supplier: Supplier, columnKey: React.Key) => {
        const cellValue = supplier[columnKey as keyof Supplier];

        switch (columnKey) {
            case "name":
                return (
                    <User
                        avatarProps={{ radius: "lg", src: supplier.avatar }}
                        description={supplier.email}
                        name={supplier.cardName}
                    >
                        {supplier.email}
                    </User>
                );
            case "contact":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{supplier.contactPerson}</p>
                        <p className="text-bold text-sm capitalize text-default-400">{supplier.contactEmail}</p>
                    </div>
                );
            case "businessType":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">{supplier.businessType}</p>
                        <p className="text-bold text-sm capitalize text-default-400">{supplier.city}</p>
                    </div>
                );
            case "rating":
                return (
                    <div className="flex items-center gap-2">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-semibold">{supplier.rating}</span>
                    </div>
                );
            case "totalOrders":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm">{supplier.totalOrders}</p>
                        <p className="text-bold text-sm text-default-400">
                            S/ {supplier.totalAmount.toLocaleString()}
                        </p>
                    </div>
                );
            case "status":
                return (
                    <Chip className="capitalize" color={statusColorMap[supplier.status]} size="sm" variant="flat">
                        {statusLabels[supplier.status]}
                    </Chip>
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
                                        /*setSelectedSupplier(supplier);
                                        onViewOpen();*/
                                        navigate("/proveedor/perfil")
                                    }}
                                >
                                    Ver detalles
                                </DropdownItem>
                                <DropdownItem
                                    key="edit"
                                    startContent={<PencilIcon className="h-4 w-4" />}
                                    onPress={() => {
                                        console.log(supplier)
                                        setSelectedSupplier(supplier);
                                        onEditOpen();
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
                                        setSelectedSupplier(supplier);
                                        onDeleteOpen();
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

    const onNextPage = () => {
        if (page < pages) {
            setPage(page + 1);
        }
    };

    const onPreviousPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

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

    const topContent = useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Buscar proveedor..."
                        startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                        value={filterValue}
                        onClear={() => onClear()}
                        onValueChange={onSearchChange}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="flat">
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
                                <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="flat">
                                    Columnas
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Columnas de tabla"
                                closeOnSelect={false}
                                selectedKeys={visibleColumns}
                                selectionMode="multiple"
                                onSelectionChange={ setVisibleColumns }
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
                    <span className="text-default-400 text-small">Total {suppliers.length} proveedores</span>
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
        );
    }, [
        filterValue,
        statusFilter,
        visibleColumns,
        onRowsPerPageChange,
        suppliers.length,
        onSearchChange,
        hasSearchFilter,
    ]);

    const bottomContent = useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400">
                    {selectedKeys === "all"
                        ? "Todos los elementos seleccionados"
                        : `${selectedKeys.size} de ${filteredItems.length} seleccionados`}
                </span>
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                />
                <div className="hidden sm:flex w-[30%] justify-end gap-2">
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
                        Anterior
                    </Button>
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
                        Siguiente
                    </Button>
                </div>
            </div>
        );
    }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

    const title = "Gestion de Proveedores"
    const subtitle = "Administra todos tus proveedores, evaluaciones y homologaciones"

    return (
        <Dashboard>
            <div className="w-full space-y-6">

                <HeaderComponent title={title} subtitle={subtitle} isOptions={true} onRegisterOpen={onRegisterOpen} />
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Proveedores</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {suppliers.filter(s => s.status === 'A').length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {suppliers.filter(s => s.status === 'P').length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <StarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Rating Promedio</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {(suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length).toFixed(1)}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Table */}
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
                />

                <ModalRegister isRegisterOpen={isRegisterOpen} onRegisterClose={onRegisterClose} addSupplier={addSupplier} />
                <ModalDetail isViewOpen={isViewOpen} onViewClose={onViewClose} selectedSupplier={selectedSupplier} onEditOpen={onEditOpen} />
                <ModalEdit isEditOpen={isEditOpen} onEditClose={onEditClose} selectedSupplier={selectedSupplier} updateSupplier={updateSupplier}/>
                <ModalDelete isDeleteOpen={isDeleteOpen} onDeleteClose={onDeleteClose} selectedSupplier={selectedSupplier} deleteSupplier={deleteSupplier} />

            </div>
        </Dashboard>
    );
}
// CARGAR COTIZACION ARIBA

{/*<Card>
                    <CardBody className="p-6">
                        <Table
                            aria-label="Tabla de proveedores"
                            isHeaderSticky
                            bottomContent={bottomContent}
                            bottomContentPlacement="outside"
                            classNames={{
                                wrapper: "max-h-[400px]",
                            }}
                            selectedKeys={selectedKeys}
                            selectionMode="multiple"
                            sortDescriptor={sortDescriptor}
                            topContent={topContent}
                            topContentPlacement="outside"
                            onSelectionChange={setSelectedKeys}
                            onSortChange={setSortDescriptor}
                        >
                            <TableHeader columns={headerColumns}>
                                {(column) => (
                                    <TableColumn
                                        key={column.uid}
                                        align={column.uid === "actions" ? "center" : "start"}
                                        allowsSorting={column.sortable}
                                    >
                                        {column.name}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody emptyContent={"No se encontraron proveedores"} items={sortedItems}>
                                {(item) => (
                                    <TableRow key={item.docEntry}>
                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>*/}