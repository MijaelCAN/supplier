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
    PlayIcon,
    DocumentTextIcon,
    ChevronDownIcon,
    BanknotesIcon,
    ClockIcon,
    CreditCardIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { usePayments, useInvoices, useExtendedStore } from '@/store/extendedStore';
import { Payment } from '@/store/types';

const PaymentsList = () => {
    const {
        payments,
        addPayment,
        updatePayment,
        processPayment,
        completePayment
    } = usePayments();
    
    const { invoices } = useInvoices();
    const paymentMethods = useExtendedStore(state => state.paymentMethods);
    const currencies = useExtendedStore(state => state.currencies);

    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
    const { isOpen: isProcessOpen, onOpen: onProcessOpen, onOpenChange: onProcessOpenChange } = useDisclosure();

    // Estado para formularios
    const [formData, setFormData] = useState({
        invoiceId: '',
        amount: 0,
        currency: 'PEN',
        scheduledDate: '',
        paymentMethod: 'Transferencia',
        bankAccount: '',
        reference: '',
        notes: ''
    });

    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [selectedPaymentForProcess, setSelectedPaymentForProcess] = useState<Payment | null>(null);

    const paymentStatuses = [
        { key: 'Programado', label: 'Programado', color: 'warning' },
        { key: 'Procesado', label: 'Procesado', color: 'primary' },
        { key: 'Completado', label: 'Completado', color: 'success' },
        { key: 'Fallido', label: 'Fallido', color: 'danger' }
    ];

    const filteredPayments = useMemo(() => {
        let filtered = payments;

        if (filterValue) {
            filtered = filtered.filter(payment =>
                payment.invoiceNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
                payment.supplierName.toLowerCase().includes(filterValue.toLowerCase()) ||
                payment.reference.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(payment => payment.status === statusFilter);
        }

        return filtered.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
    }, [payments, filterValue, statusFilter]);

    const pages = Math.ceil(filteredPayments.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredPayments.slice(start, end);
    }, [page, filteredPayments, rowsPerPage]);

    const getStatusColor = (status: string) => {
        const statusConfig = paymentStatuses.find(s => s.key === status);
        return statusConfig?.color || 'default';
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    const handleCreatePayment = () => {
        if (!formData.invoiceId || !formData.scheduledDate || !formData.amount) {
            return;
        }

        const invoice = invoices.find(inv => inv.id === formData.invoiceId);
        if (!invoice) return;

        const newPayment: Omit<Payment, 'id'> = {
            invoiceId: formData.invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            supplierId: invoice.supplierId,
            supplierName: invoice.supplierName,
            amount: formData.amount,
            currency: formData.currency,
            paymentDate: '',
            scheduledDate: formData.scheduledDate,
            paymentMethod: formData.paymentMethod as any,
            reference: formData.reference || `PAY-${Date.now()}`,
            status: 'Programado',
            bankAccount: formData.bankAccount,
            notes: formData.notes
        };

        addPayment(newPayment);
        setFormData({
            invoiceId: '',
            amount: 0,
            currency: 'PEN',
            scheduledDate: '',
            paymentMethod: 'Transferencia',
            bankAccount: '',
            reference: '',
            notes: ''
        });
        onCreateOpenChange();
    };

    const handleProcessPayment = () => {
        if (selectedPaymentForProcess) {
            processPayment(selectedPaymentForProcess.id, 'Usuario Actual');
            setSelectedPaymentForProcess(null);
            onProcessOpenChange();
        }
    };

    const handleCompletePayment = (paymentId: string) => {
        completePayment(paymentId);
    };

    const handleViewDetails = (payment: Payment) => {
        setSelectedPayment(payment);
        onDetailOpen();
    };

    const openProcessModal = (payment: Payment) => {
        setSelectedPaymentForProcess(payment);
        onProcessOpen();
    };

    const getDaysUntilScheduled = (scheduledDate: string) => {
        const today = new Date();
        const scheduled = new Date(scheduledDate);
        const diffTime = scheduled.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const approvedInvoices = invoices.filter(inv => inv.status === 'Aprobada' && !payments.some(p => p.invoiceId === inv.id));

    const getPaymentStats = () => {
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const completedAmount = payments.filter(p => p.status === 'Completado').reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = payments.filter(p => p.status === 'Programado' || p.status === 'Procesado').reduce((sum, p) => sum + p.amount, 0);
        const overduePayments = payments.filter(p => p.status === 'Programado' && getDaysUntilScheduled(p.scheduledDate) < 0);

        return {
            totalAmount,
            completedAmount,
            pendingAmount,
            overdueCount: overduePayments.length
        };
    };

    const stats = getPaymentStats();

    const topContent = (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Buscar por factura, proveedor o referencia..."
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
                            {paymentStatuses.map(status => (
                                <DropdownItem key={status.key}>{status.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button color="primary" endContent={<PlusIcon className="h-4 w-4" />} onPress={onCreateOpen}>
                        Programar Pago
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
                    <p className="text-gray-600">Administra los pagos programados y realizados a proveedores</p>
                </div>

                {/* Resumen de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <BanknotesIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total Pagos</p>
                                <p className="text-xl font-bold">{formatCurrency(stats.totalAmount, 'PEN')}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <CheckIcon className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Completados</p>
                                <p className="text-xl font-bold">{formatCurrency(stats.completedAmount, 'PEN')}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <ClockIcon className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-500">Pendientes</p>
                                <p className="text-xl font-bold">{formatCurrency(stats.pendingAmount, 'PEN')}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-sm text-gray-500">Vencidos</p>
                                <p className="text-xl font-bold">{stats.overdueCount}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardBody className="p-0">
                        <Table
                            aria-label="Tabla de pagos"
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
                                <TableColumn>REFERENCIA</TableColumn>
                                <TableColumn>FACTURA</TableColumn>
                                <TableColumn>PROVEEDOR</TableColumn>
                                <TableColumn>MONTO</TableColumn>
                                <TableColumn>MÉTODO</TableColumn>
                                <TableColumn>FECHA PROGRAMADA</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {items.map((payment) => {
                                    const daysUntilScheduled = getDaysUntilScheduled(payment.scheduledDate);
                                    return (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-bold text-sm">{payment.reference}</p>
                                                    {payment.paymentDate && (
                                                        <p className="text-xs text-gray-500">
                                                            Pagado: {payment.paymentDate}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{payment.invoiceNumber}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm">{payment.supplierName}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-bold text-sm">
                                                    {formatCurrency(payment.amount, payment.currency)}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <CreditCardIcon className="h-4 w-4 text-gray-400" />
                                                    <p className="text-sm">{payment.paymentMethod}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <p className="text-sm">{payment.scheduledDate}</p>
                                                    {payment.status === 'Programado' && (
                                                        <Chip 
                                                            color={daysUntilScheduled < 0 ? 'danger' : daysUntilScheduled <= 3 ? 'warning' : 'success'}
                                                            size="sm" 
                                                            variant="flat"
                                                        >
                                                            {daysUntilScheduled < 0 ? `${Math.abs(daysUntilScheduled)} días vencido` : 
                                                             daysUntilScheduled === 0 ? 'Hoy' : `${daysUntilScheduled} días`}
                                                        </Chip>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    className="capitalize" 
                                                    color={getStatusColor(payment.status) as any} 
                                                    size="sm" 
                                                    variant="flat"
                                                >
                                                    {payment.status}
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
                                                            <DropdownItem onPress={() => handleViewDetails(payment)}>
                                                                <div className="flex items-center gap-2">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Ver detalles
                                                                </div>
                                                            </DropdownItem>
                                                            {payment.status === 'Programado' && (
                                                                <DropdownItem onPress={() => openProcessModal(payment)}>
                                                                    <div className="flex items-center gap-2">
                                                                        <PlayIcon className="h-4 w-4 text-blue-500" />
                                                                        Procesar
                                                                    </div>
                                                                </DropdownItem>
                                                            )}
                                                            {payment.status === 'Procesado' && (
                                                                <DropdownItem onPress={() => handleCompletePayment(payment.id)}>
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                                                        Completar
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
                    size="lg"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h3>Detalles del Pago</h3>
                                    {selectedPayment && (
                                        <p className="text-sm text-gray-500">{selectedPayment.reference}</p>
                                    )}
                                </ModalHeader>
                                <ModalBody>
                                    {selectedPayment && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Factura</p>
                                                    <p className="text-sm">{selectedPayment.invoiceNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Proveedor</p>
                                                    <p className="text-sm">{selectedPayment.supplierName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Monto</p>
                                                    <p className="text-lg font-bold">
                                                        {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Estado</p>
                                                    <Chip 
                                                        color={getStatusColor(selectedPayment.status) as any} 
                                                        size="sm" 
                                                        variant="flat"
                                                    >
                                                        {selectedPayment.status}
                                                    </Chip>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                                                    <p className="text-sm">{selectedPayment.paymentMethod}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Fecha Programada</p>
                                                    <p className="text-sm">{selectedPayment.scheduledDate}</p>
                                                </div>
                                                {selectedPayment.paymentDate && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Fecha de Pago</p>
                                                        <p className="text-sm">{selectedPayment.paymentDate}</p>
                                                    </div>
                                                )}
                                                {selectedPayment.bankAccount && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Cuenta Bancaria</p>
                                                        <p className="text-sm">{selectedPayment.bankAccount}</p>
                                                    </div>
                                                )}
                                                {selectedPayment.processedBy && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Procesado por</p>
                                                        <p className="text-sm">{selectedPayment.processedBy}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedPayment.notes && (
                                                <>
                                                    <Divider />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Notas</p>
                                                        <p className="text-sm">{selectedPayment.notes}</p>
                                                    </div>
                                                </>
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

                {/* Modal de Crear Pago */}
                <Modal 
                    isOpen={isCreateOpen} 
                    onOpenChange={onCreateOpenChange}
                    size="lg"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Programar Nuevo Pago</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Factura"
                                            placeholder="Seleccionar factura aprobada"
                                            selectedKeys={formData.invoiceId ? [formData.invoiceId] : []}
                                            onSelectionChange={(keys) => {
                                                const invoiceId = Array.from(keys)[0] as string;
                                                const invoice = invoices.find(inv => inv.id === invoiceId);
                                                setFormData({
                                                    ...formData,
                                                    invoiceId,
                                                    amount: invoice?.amount || 0,
                                                    currency: invoice?.currency || 'PEN'
                                                });
                                            }}
                                        >
                                            {approvedInvoices.map(invoice => (
                                                <SelectItem key={invoice.id} value={invoice.id}>
                                                    {invoice.invoiceNumber} - {invoice.supplierName} - {formatCurrency(invoice.amount, invoice.currency)}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Monto"
                                            type="number"
                                            step="0.01"
                                            value={formData.amount.toString()}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                amount: parseFloat(e.target.value) || 0
                                            })}
                                        />

                                        <Input
                                            label="Fecha Programada"
                                            type="date"
                                            value={formData.scheduledDate}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                scheduledDate: e.target.value
                                            })}
                                        />

                                        <Select
                                            label="Método de Pago"
                                            selectedKeys={[formData.paymentMethod]}
                                            onSelectionChange={(keys) => 
                                                setFormData({
                                                    ...formData,
                                                    paymentMethod: Array.from(keys)[0] as string
                                                })
                                            }
                                        >
                                            {paymentMethods.map(method => (
                                                <SelectItem key={method.key} value={method.key}>
                                                    {method.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Input
                                            label="Cuenta Bancaria"
                                            placeholder="Cuenta de destino (opcional)"
                                            value={formData.bankAccount}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                bankAccount: e.target.value
                                            })}
                                        />

                                        <Input
                                            label="Referencia"
                                            placeholder="Referencia del pago (opcional)"
                                            value={formData.reference}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                reference: e.target.value
                                            })}
                                        />
                                    </div>

                                    <Textarea
                                        label="Notas"
                                        placeholder="Notas adicionales sobre el pago"
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
                                    <Button color="primary" onPress={handleCreatePayment}>
                                        Programar Pago
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Modal de Procesar Pago */}
                <Modal isOpen={isProcessOpen} onOpenChange={onProcessOpenChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Procesar Pago</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <p>¿Está seguro que desea procesar el pago <strong>{selectedPaymentForProcess?.reference}</strong>?</p>
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span>Proveedor:</span>
                                            <span>{selectedPaymentForProcess?.supplierName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Monto:</span>
                                            <span className="font-bold">
                                                {selectedPaymentForProcess && formatCurrency(selectedPaymentForProcess.amount, selectedPaymentForProcess.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Método:</span>
                                            <span>{selectedPaymentForProcess?.paymentMethod}</span>
                                        </div>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button color="primary" onPress={handleProcessPayment}>
                                        Procesar Pago
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

export default PaymentsList;
