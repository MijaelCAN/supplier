import React, { useState, useMemo } from 'react';
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
    CardHeader,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Textarea
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    DocumentTextIcon,
    ChevronDownIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { usePurchaseOrders, useSuppliers, useExtendedStore } from '@/store/extendedStore';
import { PurchaseOrder, OrderItem } from '@/store/types';

const PurchaseOrdersList = () => {
    const {
        purchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        approvePurchaseOrder,
        selectedOrder,
        setSelectedOrder
    } = usePurchaseOrders();
    
    const { suppliers } = useSuppliers();
    const orderStatuses = useExtendedStore(state => state.orderStatuses);
    const priorities = useExtendedStore(state => state.priorities);
    const departments = useExtendedStore(state => state.departments);
    const currencies = useExtendedStore(state => state.currencies);

    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();

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

    const getStatusColor = (status: string) => {
        const statusConfig = orderStatuses.find(s => s.key === status);
        return statusConfig?.color || 'default';
    };

    const getPriorityColor = (priority: string) => {
        const priorityConfig = priorities.find(p => p.key === priority);
        return priorityConfig?.color || 'default';
    };

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
            status: 'Borrador',
            priority: formData.priority as any,
            createdDate: new Date().toISOString().split('T')[0],
            deliveryDate: formData.deliveryDate,
            paymentTerms: formData.paymentTerms,
            department: formData.department,
            requestedBy: formData.requestedBy,
            notes: formData.notes,
            createdBy: 'Usuario Actual',
            items: formData.items
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

    const topContent = (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Buscar por número de orden o proveedor..."
                    startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                    value={filterValue}
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
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
                            selectionMode="single"
                            onSelectionChange={(selection) => setStatusFilter(Array.from(selection)[0] as string)}
                        >
                            <DropdownItem key="all">Todos</DropdownItem>
                            {orderStatuses.map(status => (
                                <DropdownItem key={status.key}>{status.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button color="primary" endContent={<PlusIcon className="h-4 w-4" />} onPress={onCreateOpen}>
                        Nueva Orden
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
                    <p className="text-gray-600">Gestiona las órdenes de compra de la empresa</p>
                </div>

                <Card>
                    <CardBody className="p-0">
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
                                <TableColumn>PRIORIDAD</TableColumn>
                                <TableColumn>FECHA ENTREGA</TableColumn>
                                <TableColumn>DEPARTAMENTO</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
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
                                                <p className="text-xs text-gray-500">Solicitado por: {order.requestedBy}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p className="text-bold text-sm">
                                                    {formatCurrency(order.totalAmount, order.currency)}
                                                </p>
                                                <p className="text-xs text-gray-500">{order.paymentTerms} días</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                className="capitalize" 
                                                color={getStatusColor(order.status) as any} 
                                                size="sm" 
                                                variant="flat"
                                            >
                                                {order.status}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                className="capitalize" 
                                                color={getPriorityColor(order.priority) as any} 
                                                size="sm" 
                                                variant="flat"
                                            >
                                                {order.priority}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">{order.deliveryDate}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">{order.department}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative flex justify-end items-center gap-2">
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly size="sm" variant="light">
                                                            <EllipsisVerticalIcon className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu>
                                                        <DropdownItem onPress={() => handleViewDetails(order)}>
                                                            <div className="flex items-center gap-2">
                                                                <EyeIcon className="h-4 w-4" />
                                                                Ver detalles
                                                            </div>
                                                        </DropdownItem>
                                                        {order.status === 'Pendiente' && (
                                                            <>
                                                                <DropdownItem onPress={() => handleApprove(order.id)}>
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                                                        Aprobar
                                                                    </div>
                                                                </DropdownItem>
                                                                <DropdownItem onPress={() => handleReject(order.id)}>
                                                                    <div className="flex items-center gap-2">
                                                                        <XMarkIcon className="h-4 w-4 text-red-500" />
                                                                        Rechazar
                                                                    </div>
                                                                </DropdownItem>
                                                            </>
                                                        )}
                                                        {order.status === 'Borrador' && (
                                                            <DropdownItem>
                                                                <div className="flex items-center gap-2">
                                                                    <PencilIcon className="h-4 w-4" />
                                                                    Editar
                                                                </div>
                                                            </DropdownItem>
                                                        )}
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Modal de Detalles */}
                <Modal 
                    isOpen={isDetailOpen} 
                    onOpenChange={onDetailOpenChange}
                    size="2xl"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h3>Detalles de Orden de Compra</h3>
                                    {selectedOrder && (
                                        <p className="text-sm text-gray-500">{selectedOrder.orderNumber}</p>
                                    )}
                                </ModalHeader>
                                <ModalBody>
                                    {selectedOrder && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Proveedor</p>
                                                    <p className="text-sm">{selectedOrder.supplierName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Estado</p>
                                                    <Chip 
                                                        color={getStatusColor(selectedOrder.status) as any} 
                                                        size="sm" 
                                                        variant="flat"
                                                    >
                                                        {selectedOrder.status}
                                                    </Chip>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Monto Total</p>
                                                    <p className="text-sm font-bold">
                                                        {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Fecha de Entrega</p>
                                                    <p className="text-sm">{selectedOrder.deliveryDate}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Departamento</p>
                                                    <p className="text-sm">{selectedOrder.department}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Solicitado por</p>
                                                    <p className="text-sm">{selectedOrder.requestedBy}</p>
                                                </div>
                                            </div>
                                            
                                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                                <div>
                                                    <h4 className="text-lg font-medium mb-2">Items de la Orden</h4>
                                                    <div className="space-y-2">
                                                        {selectedOrder.items.map((item) => (
                                                            <Card key={item.id} className="p-3">
                                                                <div className="grid grid-cols-4 gap-2 text-sm">
                                                                    <div>
                                                                        <p className="font-medium">{item.productName}</p>
                                                                        <p className="text-gray-500">{item.productCode}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500">Cantidad</p>
                                                                        <p>{item.quantity} {item.unit}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500">Precio Unit.</p>
                                                                        <p>{formatCurrency(item.unitPrice, selectedOrder.currency)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500">Total</p>
                                                                        <p className="font-medium">
                                                                            {formatCurrency(item.totalPrice, selectedOrder.currency)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedOrder.notes && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Notas</p>
                                                    <p className="text-sm">{selectedOrder.notes}</p>
                                                </div>
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
                                                <SelectItem key={supplier.docEntry} value={supplier.docEntry}>
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
                                                <SelectItem key={dept.key} value={dept.key}>
                                                    {dept.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Monto Total"
                                            type="number"
                                            value={formData.totalAmount.toString()}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                totalAmount: parseFloat(e.target.value) || 0
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
                                                <SelectItem key={currency.key} value={currency.key}>
                                                    {currency.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Fecha de Entrega"
                                            type="date"
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                deliveryDate: e.target.value
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
                                                <SelectItem key={priority.key} value={priority.key}>
                                                    {priority.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Solicitado por"
                                            value={formData.requestedBy}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                requestedBy: e.target.value
                                            })}
                                        />

                                        <Input
                                            label="Términos de Pago (días)"
                                            type="number"
                                            value={formData.paymentTerms}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                paymentTerms: e.target.value
                                            })}
                                        />
                                    </div>

                                    <Textarea
                                        label="Notas"
                                        placeholder="Notas adicionales sobre la orden"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            notes: e.target.value
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
