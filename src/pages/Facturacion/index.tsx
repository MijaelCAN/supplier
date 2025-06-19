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
    Textarea,
    Divider
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    DocumentTextIcon,
    ChevronDownIcon,
    BanknotesIcon,
    ClockIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useInvoices, usePurchaseOrders, useSuppliers, useExtendedStore } from '@/store/extendedStore';
import { Invoice } from '@/store/types';

const InvoicesList = () => {
    const {
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        approveInvoice,
        rejectInvoice,
        selectedInvoice,
        setSelectedInvoice
    } = useInvoices();
    
    const { purchaseOrders } = usePurchaseOrders();
    const { suppliers } = useSuppliers();
    const invoiceStatuses = useExtendedStore(state => state.invoiceStatuses);
    const currencies = useExtendedStore(state => state.currencies);

    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
    const { isOpen: isApproveOpen, onOpen: onApproveOpen, onOpenChange: onApproveOpenChange } = useDisclosure();
    const { isOpen: isRejectOpen, onOpen: onRejectOpen, onOpenChange: onRejectOpenChange } = useDisclosure();

    // Estado para formularios
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        purchaseOrderId: '',
        supplierId: '',
        amount: 0,
        currency: 'PEN',
        dueDate: '',
        taxAmount: 0,
        subtotal: 0,
        notes: ''
    });

    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedInvoiceForAction, setSelectedInvoiceForAction] = useState<Invoice | null>(null);

    const filteredInvoices = useMemo(() => {
        let filtered = invoices;

        if (filterValue) {
            filtered = filtered.filter(invoice =>
                invoice.invoiceNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
                invoice.supplierName.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(invoice => invoice.status === statusFilter);
        }

        return filtered;
    }, [invoices, filterValue, statusFilter]);

    const pages = Math.ceil(filteredInvoices.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredInvoices.slice(start, end);
    }, [page, filteredInvoices, rowsPerPage]);

    const getStatusColor = (status: string) => {
        const statusConfig = invoiceStatuses.find(s => s.key === status);
        return statusConfig?.color || 'default';
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    const calculateTotals = (subtotal: number) => {
        const taxAmount = subtotal * 0.18; // IGV 18%
        const total = subtotal + taxAmount;
        return { taxAmount, total };
    };

    const handleCreateInvoice = () => {
        if (!formData.invoiceNumber || !formData.purchaseOrderId || !formData.dueDate || !formData.subtotal) {
            return;
        }

        const purchaseOrder = purchaseOrders.find(po => po.id === formData.purchaseOrderId);
        if (!purchaseOrder) return;

        const { taxAmount, total } = calculateTotals(formData.subtotal);

        const newInvoice: Omit<Invoice, 'id'> = {
            invoiceNumber: formData.invoiceNumber,
            purchaseOrderId: formData.purchaseOrderId,
            supplierId: purchaseOrder.supplierId,
            supplierName: purchaseOrder.supplierName,
            amount: total,
            currency: formData.currency,
            status: 'Recibida',
            receivedDate: new Date().toISOString().split('T')[0],
            dueDate: formData.dueDate,
            taxAmount: taxAmount,
            subtotal: formData.subtotal,
            notes: formData.notes
        };

        addInvoice(newInvoice);
        setFormData({
            invoiceNumber: '',
            purchaseOrderId: '',
            supplierId: '',
            amount: 0,
            currency: 'PEN',
            dueDate: '',
            taxAmount: 0,
            subtotal: 0,
            notes: ''
        });
        onCreateOpenChange();
    };

    const handleApprove = () => {
        if (selectedInvoiceForAction) {
            approveInvoice(selectedInvoiceForAction.id, 'Usuario Actual');
            setSelectedInvoiceForAction(null);
            onApproveOpenChange();
        }
    };

    const handleReject = () => {
        if (selectedInvoiceForAction && rejectionReason.trim()) {
            rejectInvoice(selectedInvoiceForAction.id, rejectionReason);
            setSelectedInvoiceForAction(null);
            setRejectionReason('');
            onRejectOpenChange();
        }
    };

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        onDetailOpen();
    };

    const openApproveModal = (invoice: Invoice) => {
        setSelectedInvoiceForAction(invoice);
        onApproveOpen();
    };

    const openRejectModal = (invoice: Invoice) => {
        setSelectedInvoiceForAction(invoice);
        onRejectOpen();
    };

    const getDaysUntilDue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const approvedPurchaseOrders = purchaseOrders.filter(po => po.status === 'Aprobada' || po.status === 'Completada');

    const topContent = (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Buscar por número de factura o proveedor..."
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
                            {invoiceStatuses.map(status => (
                                <DropdownItem key={status.key}>{status.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button color="primary" endContent={<PlusIcon className="h-4 w-4" />} onPress={onCreateOpen}>
                        Nueva Factura
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h1>
                    <p className="text-gray-600">Administra las facturas recibidas de proveedores</p>
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
                                <p className="text-sm text-gray-500">En Revisión</p>
                                <p className="text-xl font-bold">
                                    {invoices.filter(i => i.status === 'En Revisión').length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <CheckIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Aprobadas</p>
                                <p className="text-xl font-bold">
                                    {invoices.filter(i => i.status === 'Aprobada').length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <BanknotesIcon className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-gray-500">Monto Total</p>
                                <p className="text-xl font-bold">
                                    {formatCurrency(
                                        invoices.reduce((sum, i) => sum + i.amount, 0),
                                        'PEN'
                                    )}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardBody className="p-0">
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
                                <TableColumn>ORDEN COMPRA</TableColumn>
                                <TableColumn>MONTO</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                                <TableColumn>FECHA VENCIMIENTO</TableColumn>
                                <TableColumn>DÍAS RESTANTES</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {items.map((invoice) => {
                                    const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                                    return (
                                        <TableRow key={invoice.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{invoice.invoiceNumber}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Recibida: {invoice.receivedDate}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{invoice.supplierName}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{invoice.purchaseOrderId}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">
                                                        {formatCurrency(invoice.amount, invoice.currency)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Subtotal: {formatCurrency(invoice.subtotal, invoice.currency)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    className="capitalize" 
                                                    color={getStatusColor(invoice.status) as any} 
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {invoice.status}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{invoice.dueDate}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    color={daysUntilDue < 0 ? 'danger' : daysUntilDue <= 7 ? 'warning' : 'success'}
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencida` : `${daysUntilDue} días`}
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
                                                            <DropdownItem onPress={() => handleViewDetails(invoice)}>
                                                                <div className="flex items-center gap-2">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Ver detalles
                                                                </div>
                                                            </DropdownItem>
                                                            {invoice.status === 'En Revisión' && (
                                                                <>
                                                                    <DropdownItem onPress={() => openApproveModal(invoice)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckIcon className="h-4 w-4 text-green-500" />
                                                                            Aprobar
                                                                        </div>
                                                                    </DropdownItem>
                                                                    <DropdownItem onPress={() => openRejectModal(invoice)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <XMarkIcon className="h-4 w-4 text-red-500" />
                                                                            Rechazar
                                                                        </div>
                                                                    </DropdownItem>
                                                                </>
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
                                    <h3>Detalles de Factura</h3>
                                    {selectedInvoice && (
                                        <p className="text-sm text-gray-500">{selectedInvoice.invoiceNumber}</p>
                                    )}
                                </ModalHeader>
                                <ModalBody>
                                    {selectedInvoice && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Proveedor</p>
                                                    <p className="text-sm">{selectedInvoice.supplierName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Estado</p>
                                                    <Chip 
                                                        color={getStatusColor(selectedInvoice.status) as any} 
                                                        size="sm" 
                                                        variant="flat"
                                                    >
                                                        {selectedInvoice.status}
                                                    </Chip>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Orden de Compra</p>
                                                    <p className="text-sm">{selectedInvoice.purchaseOrderId}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Fecha de Vencimiento</p>
                                                    <p className="text-sm">{selectedInvoice.dueDate}</p>
                                                </div>
                                            </div>

                                            <Divider />

                                            <div className="space-y-2">
                                                <h4 className="text-lg font-medium">Desglose de Montos</h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                    <div className="flex justify-between">
                                                        <span>Subtotal:</span>
                                                        <span>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>IGV (18%):</span>
                                                        <span>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                                                    </div>
                                                    <Divider />
                                                    <div className="flex justify-between font-bold text-lg">
                                                        <span>Total:</span>
                                                        <span>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedInvoice.notes && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Notas</p>
                                                    <p className="text-sm">{selectedInvoice.notes}</p>
                                                </div>
                                            )}

                                            {selectedInvoice.status === 'Rechazada' && selectedInvoice.rejectionReason && (
                                                <div>
                                                    <p className="text-sm font-medium text-red-500">Motivo de Rechazo</p>
                                                    <p className="text-sm text-red-600">{selectedInvoice.rejectionReason}</p>
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

                {/* Modal de Crear Factura */}
                <Modal 
                    isOpen={isCreateOpen} 
                    onOpenChange={onCreateOpenChange}
                    size="2xl"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Registrar Nueva Factura</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Número de Factura"
                                            placeholder="F001-00001"
                                            value={formData.invoiceNumber}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                invoiceNumber: e.target.value
                                            })}
                                        />

                                        <Select
                                            label="Orden de Compra"
                                            placeholder="Seleccionar orden de compra"
                                            selectedKeys={formData.purchaseOrderId ? [formData.purchaseOrderId] : []}
                                            onSelectionChange={(keys) => {
                                                const orderId = Array.from(keys)[0] as string;
                                                const order = purchaseOrders.find(po => po.id === orderId);
                                                setFormData({
                                                    ...formData,
                                                    purchaseOrderId: orderId,
                                                    supplierId: order?.supplierId || '',
                                                    currency: order?.currency || 'PEN'
                                                });
                                            }}
                                        >
                                            {approvedPurchaseOrders.map(order => (
                                                <SelectItem key={order.id} value={order.id}>
                                                    {order.orderNumber} - {order.supplierName}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Subtotal"
                                            type="number"
                                            step="0.01"
                                            value={formData.subtotal.toString()}
                                            onChange={(e) => {
                                                const subtotal = parseFloat(e.target.value) || 0;
                                                const { taxAmount, total } = calculateTotals(subtotal);
                                                setFormData({
                                                    ...formData,
                                                    subtotal,
                                                    taxAmount,
                                                    amount: total
                                                });
                                            }}
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
                                            label="Fecha de Vencimiento"
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                dueDate: e.target.value
                                            })}
                                        />

                                        <div className="col-span-2">
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>{formatCurrency(formData.subtotal, formData.currency)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>IGV (18%):</span>
                                                    <span>{formatCurrency(formData.taxAmount, formData.currency)}</span>
                                                </div>
                                                <Divider />
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total:</span>
                                                    <span>{formatCurrency(formData.amount, formData.currency)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Textarea
                                        label="Notas"
                                        placeholder="Notas adicionales sobre la factura"
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
                                    <Button color="primary" onPress={handleCreateInvoice}>
                                        Registrar Factura
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Modal de Aprobación */}
                <Modal isOpen={isApproveOpen} onOpenChange={onApproveOpenChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Confirmar Aprobación</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <p>¿Está seguro que desea aprobar la factura <strong>{selectedInvoiceForAction?.invoiceNumber}</strong>?</p>
                                    <p className="text-sm text-gray-500">
                                        Monto: {selectedInvoiceForAction && formatCurrency(selectedInvoiceForAction.amount, selectedInvoiceForAction.currency)}
                                    </p>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button color="success" onPress={handleApprove}>
                                        Aprobar Factura
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Modal de Rechazo */}
                <Modal isOpen={isRejectOpen} onOpenChange={onRejectOpenChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Rechazar Factura</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <p>Factura: <strong>{selectedInvoiceForAction?.invoiceNumber}</strong></p>
                                    <Textarea
                                        label="Motivo del Rechazo"
                                        placeholder="Especifique el motivo del rechazo..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        isRequired
                                    />
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        color="danger" 
                                        onPress={handleReject}
                                        isDisabled={!rejectionReason.trim()}
                                    >
                                        Rechazar Factura
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
