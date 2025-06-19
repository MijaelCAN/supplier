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
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    Select,
    SelectItem
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    TruckIcon,
    ClipboardDocumentCheckIcon,
    ChevronDownIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { usePurchaseOrders, useExtendedStore } from '@/store/extendedStore';

const ReceptionPage = () => {
    const { purchaseOrders, updatePurchaseOrder } = usePurchaseOrders();
    
    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isReceiveOpen, onOpen: onReceiveOpen, onOpenChange: onReceiveOpenChange } = useDisclosure();

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [receptionNotes, setReceptionNotes] = useState('');
    const [receptionStatus, setReceptionStatus] = useState('Recibido Completo');

    // Solo órdenes aprobadas o en proceso pueden ser recibidas
    const receivableOrders = purchaseOrders.filter(order => 
        order.status === 'Aprobada' || order.status === 'En Proceso'
    );

    const filteredOrders = useMemo(() => {
        let filtered = receivableOrders;

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
    }, [receivableOrders, filterValue, statusFilter]);

    const pages = Math.ceil(filteredOrders.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredOrders.slice(start, end);
    }, [page, filteredOrders, rowsPerPage]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aprobada': return 'success';
            case 'En Proceso': return 'primary';
            case 'Completada': return 'success';
            default: return 'default';
        }
    };

    const handleReceiveOrder = () => {
        if (selectedOrder) {
            updatePurchaseOrder(selectedOrder.id, {
                status: 'Completada',
                notes: `${selectedOrder.notes || ''}\n\nRecepción: ${receptionNotes}`
            });
            setSelectedOrder(null);
            setReceptionNotes('');
            onReceiveOpenChange();
        }
    };

    const openReceiveModal = (order: any) => {
        setSelectedOrder(order);
        setReceptionNotes('');
        onReceiveOpen();
    };

    const openDetailModal = (order: any) => {
        setSelectedOrder(order);
        onDetailOpen();
    };

    const receptionStatuses = [
        { key: 'Recibido Completo', label: 'Recibido Completo' },
        { key: 'Recibido Parcial', label: 'Recibido Parcial' },
        { key: 'Con Observaciones', label: 'Con Observaciones' }
    ];

    const getDaysUntilDelivery = (deliveryDate: string) => {
        const today = new Date();
        const delivery = new Date(deliveryDate);
        const diffTime = delivery.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                            <DropdownItem key="Aprobada">Aprobadas</DropdownItem>
                            <DropdownItem key="En Proceso">En Proceso</DropdownItem>
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
                    <h1 className="text-2xl font-bold text-gray-900">Recepción de Mercadería</h1>
                    <p className="text-gray-600">Gestiona la recepción de productos y materiales de órdenes de compra</p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <TruckIcon className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Órdenes por Recibir</p>
                                <p className="text-xl font-bold">{receivableOrders.length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Completadas</p>
                                <p className="text-xl font-bold">
                                    {purchaseOrders.filter(o => o.status === 'Completada').length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <CheckIcon className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-gray-500">En Proceso</p>
                                <p className="text-xl font-bold">
                                    {purchaseOrders.filter(o => o.status === 'En Proceso').length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <XMarkIcon className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-500">Próximas a Vencer</p>
                                <p className="text-xl font-bold">
                                    {receivableOrders.filter(o => getDaysUntilDelivery(o.deliveryDate) <= 3).length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardBody className="p-0">
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
                                <TableColumn>N° ORDEN</TableColumn>
                                <TableColumn>PROVEEDOR</TableColumn>
                                <TableColumn>MONTO</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                                <TableColumn>FECHA ENTREGA</TableColumn>
                                <TableColumn>DÍAS RESTANTES</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {items.map((order) => {
                                    const daysUntilDelivery = getDaysUntilDelivery(order.deliveryDate);
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{order.orderNumber}</p>
                                                    <p className="text-xs text-gray-500">{order.department}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{order.supplierName}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-bold text-sm">
                                                    {formatCurrency(order.totalAmount, order.currency)}
                                                </p>
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
                                                <p className="text-sm">{order.deliveryDate}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    color={
                                                        daysUntilDelivery < 0 ? 'danger' : 
                                                        daysUntilDelivery <= 3 ? 'warning' : 'success'
                                                    }
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {daysUntilDelivery < 0 ? `${Math.abs(daysUntilDelivery)} días vencido` : 
                                                     daysUntilDelivery === 0 ? 'Hoy' : `${daysUntilDelivery} días`}
                                                </Chip>
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
                                                            <DropdownItem onPress={() => openDetailModal(order)}>
                                                                <div className="flex items-center gap-2">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Ver detalles
                                                                </div>
                                                            </DropdownItem>
                                                            {order.status !== 'Completada' && (
                                                                <DropdownItem onPress={() => openReceiveModal(order)}>
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                                                        Recibir Mercadería
                                                                    </div>
                                                                </DropdownItem>
                                                            )}
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
                                    <h3>Detalles de la Orden</h3>
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
                                            </div>
                                            
                                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                                <div>
                                                    <h4 className="text-lg font-medium mb-2">Items a Recibir</h4>
                                                    <div className="space-y-2">
                                                        {selectedOrder.items.map((item: any) => (
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

                {/* Modal de Recepción */}
                <Modal 
                    isOpen={isReceiveOpen} 
                    onOpenChange={onReceiveOpenChange}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Registrar Recepción de Mercadería</h3>
                                </ModalHeader>
                                <ModalBody>
                                    {selectedOrder && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="font-medium">Orden: {selectedOrder.orderNumber}</p>
                                                <p className="text-sm text-gray-600">Proveedor: {selectedOrder.supplierName}</p>
                                                <p className="text-sm text-gray-600">
                                                    Monto: {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                                                </p>
                                            </div>

                                            <Select
                                                label="Estado de Recepción"
                                                selectedKeys={[receptionStatus]}
                                                onSelectionChange={(keys) => 
                                                    setReceptionStatus(Array.from(keys)[0] as string)
                                                }
                                            >
                                                {receptionStatuses.map(status => (
                                                    <SelectItem key={status.key} value={status.key}>
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Textarea
                                                label="Observaciones de Recepción"
                                                placeholder="Ingrese observaciones sobre la recepción de la mercadería..."
                                                value={receptionNotes}
                                                onChange={(e) => setReceptionNotes(e.target.value)}
                                                minRows={3}
                                            />
                                        </div>
                                    )}
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        color="success" 
                                        onPress={handleReceiveOrder}
                                        isDisabled={!receptionNotes.trim()}
                                    >
                                        Confirmar Recepción
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
