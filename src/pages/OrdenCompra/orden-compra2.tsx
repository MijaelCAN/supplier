import { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Tabs,
    Tab,
    Avatar,
    Progress,
    useDisclosure,
}from '@heroui/react';

import {
    ShoppingCartIcon,
    DocumentTextIcon,
    TruckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    EyeIcon,
    PrinterIcon,
    DocumentIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const PurchaseOrderPortal = () => {
    const [userRole, setUserRole] = useState('admin'); // 'admin' o 'supplier'
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([
        {
            id: 'PO-2024-001',
            supplier: 'TechCorp Solutions',
            supplierEmail: 'ventas@techcorp.com',
            date: '2024-06-10',
            deliveryDate: '2024-06-20',
            status: 'pending_approval',
            total: 15750.00,
            currency: 'USD',
            items: [
                { id: 1, description: 'Laptops Dell Latitude 7430', quantity: 5, unitPrice: 1250.00, total: 6250.00 },
                { id: 2, description: 'Monitores 24" Samsung', quantity: 10, unitPrice: 320.00, total: 3200.00 },
                { id: 3, description: 'Teclados inalámbricos Logitech', quantity: 15, unitPrice: 85.00, total: 1275.00 }
            ],
            approvals: [
                { role: 'Gerente de Compras', status: 'pending', user: 'María González' },
                { role: 'Director Financiero', status: 'pending', user: 'Carlos Ruiz' }
            ],
            reception: { status: 'not_received', percentage: 0 },
            invoice: { status: 'not_invoiced', amount: 0 }
        },
        {
            id: 'PO-2024-002',
            supplier: 'Office Supplies Inc',
            supplierEmail: 'orders@officesupplies.com',
            date: '2024-06-08',
            deliveryDate: '2024-06-15',
            status: 'approved',
            total: 2450.00,
            currency: 'USD',
            items: [
                { id: 1, description: 'Papel A4 - 500 hojas', quantity: 20, unitPrice: 12.50, total: 250.00 },
                { id: 2, description: 'Bolígrafos BIC azul', quantity: 100, unitPrice: 1.20, total: 120.00 }
            ],
            approvals: [
                { role: 'Gerente de Compras', status: 'approved', user: 'María González', date: '2024-06-09' },
                { role: 'Director Financiero', status: 'approved', user: 'Carlos Ruiz', date: '2024-06-09' }
            ],
            reception: { status: 'partial', percentage: 60 },
            invoice: { status: 'not_invoiced', amount: 0 }
        },
        {
            id: 'PO-2024-003',
            supplier: 'Industrial Equipment Co',
            supplierEmail: 'sales@indequip.com',
            date: '2024-06-05',
            deliveryDate: '2024-06-12',
            status: 'completed',
            total: 45000.00,
            currency: 'USD',
            items: [
                { id: 1, description: 'Compresor Industrial 50HP', quantity: 1, unitPrice: 35000.00, total: 35000.00 },
                { id: 2, description: 'Kit de mantenimiento', quantity: 1, unitPrice: 1500.00, total: 1500.00 }
            ],
            approvals: [
                { role: 'Gerente de Compras', status: 'approved', user: 'María González', date: '2024-06-06' },
                { role: 'Director Financiero', status: 'approved', user: 'Carlos Ruiz', date: '2024-06-06' }
            ],
            reception: { status: 'received', percentage: 100, date: '2024-06-12' },
            invoice: { status: 'invoiced', amount: 45000.00, date: '2024-06-13' }
        }
    ]);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const getStatusColor = (status: string) => {
        const colors = {
            'pending_approval': 'warning',
            'approved': 'primary',
            'rejected': 'danger',
            'completed': 'success',
            'cancelled': 'default'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            'pending_approval': 'Pendiente Aprobación',
            'approved': 'Aprobada',
            'rejected': 'Rechazada',
            'completed': 'Completada',
            'cancelled': 'Cancelada'
        };
        return texts[status] || status;
    };

    const getReceptionStatusColor = (status) => {
        const colors = {
            'not_received': 'default',
            'partial': 'warning',
            'received': 'success'
        };
        return colors[status] || 'default';
    };

    const getInvoiceStatusColor = (status) => {
        const colors = {
            'not_invoiced': 'default',
            'invoiced': 'success',
            'paid': 'primary'
        };
        return colors[status] || 'default';
    };

    const handleApproveOrder = (orderId) => {
        setOrders(orders.map(order =>
            order.id === orderId
                ? { ...order, status: 'approved' }
                : order
        ));
    };

    const handleRejectOrder = (orderId) => {
        setOrders(orders.map(order =>
            order.id === orderId
                ? { ...order, status: 'rejected' }
                : order
        ));
    };

    const OrderDetailModal = ({ order, isOpen, onClose }) => {
        if (!order) return null;

        return (
            <Modal size="5xl" isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <DocumentTextIcon className="h-6 w-6 text-primary" />
                                <span>Orden de Compra {order.id}</span>
                            </div>
                            <Chip color={getStatusColor(order.status)} variant="flat">
                                {getStatusText(order.status)}
                            </Chip>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-6">
                            {/* Información General */}
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Información General</h3>
                                </CardHeader>
                                <CardBody>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Proveedor:</span>
                                                <span className="font-medium">{order.supplier}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Fecha:</span>
                                                <span>{order.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TruckIcon className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Entrega:</span>
                                                <span>{order.deliveryDate}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Total:</span>
                                                <span className="font-bold text-lg">{order.currency} {order.total.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Estado Recepción:</span>
                                                <Chip size="sm" color={getReceptionStatusColor(order.reception.status)}>
                                                    {order.reception.status === 'not_received' && 'No Recibido'}
                                                    {order.reception.status === 'partial' && 'Parcial'}
                                                    {order.reception.status === 'received' && 'Recibido'}
                                                </Chip>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Estado Facturación:</span>
                                                <Chip size="sm" color={getInvoiceStatusColor(order.invoice.status)}>
                                                    {order.invoice.status === 'not_invoiced' && 'No Facturado'}
                                                    {order.invoice.status === 'invoiced' && 'Facturado'}
                                                    {order.invoice.status === 'paid' && 'Pagado'}
                                                </Chip>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Items */}
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Artículos</h3>
                                </CardHeader>
                                <CardBody>
                                    <Table aria-label="Artículos de la orden">
                                        <TableHeader>
                                            <TableColumn>DESCRIPCIÓN</TableColumn>
                                            <TableColumn>CANTIDAD</TableColumn>
                                            <TableColumn>PRECIO UNIT.</TableColumn>
                                            <TableColumn>TOTAL</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {order.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.description}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>{order.currency} {item.unitPrice.toLocaleString()}</TableCell>
                                                    <TableCell className="font-semibold">{order.currency} {item.total.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardBody>
                            </Card>

                            {/* Progreso de Recepción */}
                            {order.reception.percentage > 0 && (
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold">Progreso de Recepción</h3>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Recibido</span>
                                                <span>{order.reception.percentage}%</span>
                                            </div>
                                            <Progress value={order.reception.percentage} color="primary" />
                                            {order.reception.date && (
                                                <p className="text-sm text-gray-600">Recibido el: {order.reception.date}</p>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Aprobaciones */}
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Estado de Aprobaciones</h3>
                                </CardHeader>
                                <CardBody>
                                    <div className="space-y-3">
                                        {order.approvals.map((approval, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Avatar size="sm" name={approval.user} />
                                                    <div>
                                                        <p className="font-medium">{approval.user}</p>
                                                        <p className="text-sm text-gray-600">{approval.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {approval.status === 'approved' && (
                                                        <>
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                            <span className="text-green-600 text-sm">Aprobado</span>
                                                            {approval.date && <span className="text-xs text-gray-500">{approval.date}</span>}
                                                        </>
                                                    )}
                                                    {approval.status === 'rejected' && (
                                                        <>
                                                            <XCircleIcon className="h-5 w-5 text-red-500" />
                                                            <span className="text-red-600 text-sm">Rechazado</span>
                                                        </>
                                                    )}
                                                    {approval.status === 'pending' && (
                                                        <>
                                                            <ClockIcon className="h-5 w-5 text-yellow-500" />
                                                            <span className="text-yellow-600 text-sm">Pendiente</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>
                            Cerrar
                        </Button>
                        <Button color="primary" startContent={<PrinterIcon className="h-4 w-4" />}>
                            Imprimir
                        </Button>
                        <Button color="primary" variant="flat" startContent={<DocumentIcon className="h-4 w-4" />}>
                            Descargar PDF
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        );
    };

    const AdminDashboard = () => (
        <div className="space-y-6">
            {/* Métricas Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
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
                            <ClockIcon className="h-6 w-6 text-yellow-600" />
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
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
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
                            <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-2xl font-bold">$89.2K</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Tabla de Órdenes */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Órdenes de Compra</h2>
                        <Button color="primary" startContent={<DocumentTextIcon className="h-4 w-4" />}>
                            Nueva Orden
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    <Table aria-label="Órdenes de compra">
                        <TableHeader>
                            <TableColumn>ORDEN</TableColumn>
                            <TableColumn>PROVEEDOR</TableColumn>
                            <TableColumn>FECHA</TableColumn>
                            <TableColumn>ENTREGA</TableColumn>
                            <TableColumn>TOTAL</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                            <TableColumn>RECEPCIÓN</TableColumn>
                            <TableColumn>ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.supplier}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>{order.deliveryDate}</TableCell>
                                    <TableCell>{order.currency} {order.total.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip color={getStatusColor(order.status)} size="sm" variant="flat">
                                            {getStatusText(order.status)}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={order.reception.percentage} size="sm" className="w-16" />
                                            <span className="text-xs">{order.reception.percentage}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                isIconOnly
                                                variant="light"
                                                onPress={() => {
                                                    setSelectedOrder(order);
                                                    onOpen();
                                                }}
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </Button>
                                            {order.status === 'pending_approval' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        isIconOnly
                                                        color="success"
                                                        variant="light"
                                                        onPress={() => handleApproveOrder(order.id)}
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        isIconOnly
                                                        color="danger"
                                                        variant="light"
                                                        onPress={() => handleRejectOrder(order.id)}
                                                    >
                                                        <XCircleIcon className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );

    const SupplierDashboard = () => (
        <div className="space-y-6">
            {/* Métricas Proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Órdenes Recibidas</p>
                            <p className="text-2xl font-bold">5</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <TruckIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Por Entregar</p>
                            <p className="text-2xl font-bold">2</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Entregadas</p>
                            <p className="text-2xl font-bold">3</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Facturación</p>
                            <p className="text-2xl font-bold">$47.2K</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Órdenes del Proveedor */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold">Mis Órdenes de Compra</h2>
                </CardHeader>
                <CardBody>
                    <Table aria-label="Órdenes del proveedor">
                        <TableHeader>
                            <TableColumn>ORDEN</TableColumn>
                            <TableColumn>FECHA</TableColumn>
                            <TableColumn>ENTREGA</TableColumn>
                            <TableColumn>TOTAL</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                            <TableColumn>PROGRESO</TableColumn>
                            <TableColumn>ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {orders.filter(order => userRole === 'supplier').map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>{order.deliveryDate}</TableCell>
                                    <TableCell>{order.currency} {order.total.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip color={getStatusColor(order.status)} size="sm" variant="flat">
                                            {getStatusText(order.status)}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Progress value={order.reception.percentage} size="sm" className="w-20" />
                                                <span className="text-xs">Entrega {order.reception.percentage}%</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                isIconOnly
                                                variant="light"
                                                onPress={() => {
                                                    setSelectedOrder(order);
                                                    onOpen();
                                                }}
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="light" color="primary">
                                                Confirmar Entrega
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Portal de Órdenes de Compra</h1>
                            <p className="text-gray-600">
                                {userRole === 'admin' ? 'Panel de Administración' : 'Portal de Proveedor'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Select
                                label="Rol"
                                value={userRole}
                                onChange={(e) => setUserRole(e.target.value)}
                                className="w-48"
                            >
                                <SelectItem key="admin" value="admin">Administrador</SelectItem>
                                <SelectItem key="supplier" value="supplier">Proveedor</SelectItem>
                            </Select>
                            <Avatar name="Usuario" size="sm" />
                        </div>
                    </div>
                </div>

                {/* Contenido Principal */}
                <Tabs
                    selectedKey={activeTab}
                    onSelectionChange={setActiveTab}
                    aria-label="Opciones del portal"
                    className="mb-6"
                >
                    <Tab
                        key="orders"
                        title={
                            <div className="flex items-center gap-2">
                                <ShoppingCartIcon className="h-4 w-4" />
                                Órdenes de Compra
                            </div>
                        }
                    >
                        {userRole === 'admin' ? <AdminDashboard /> : <SupplierDashboard />}
                    </Tab>

                    <Tab
                        key="reception"
                        title={
                            <div className="flex items-center gap-2">
                                <TruckIcon className="h-4 w-4" />
                                Recepción
                            </div>
                        }
                    >
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Módulo de Recepción</h2>
                            </CardHeader>
                            <CardBody>
                                <p className="text-gray-600">
                                    Gestión de recepción de mercancías y verificación de entregas.
                                </p>
                            </CardBody>
                        </Card>
                    </Tab>

                    <Tab
                        key="invoicing"
                        title={
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="h-4 w-4" />
                                Facturación
                            </div>
                        }
                    >
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Módulo de Facturación</h2>
                            </CardHeader>
                            <CardBody>
                                <p className="text-gray-600">
                                    Gestión de facturas y seguimiento de pagos.
                                </p>
                            </CardBody>
                        </Card>
                    </Tab>

                    <Tab
                        key="analytics"
                        title={
                            <div className="flex items-center gap-2">
                                <ChartBarIcon className="h-4 w-4" />
                                Reportes
                            </div>
                        }
                    >
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Reportes y Análisis</h2>
                            </CardHeader>
                            <CardBody>
                                <p className="text-gray-600">
                                    Análisis de desempeño y reportes de compras.
                                </p>
                            </CardBody>
                        </Card>
                    </Tab>
                </Tabs>

                {/* Modal de Detalle */}
                <OrderDetailModal
                    order={selectedOrder}
                    isOpen={isOpen}
                    onClose={onClose}
                />
            </div>
        </div>
    );
};

export default PurchaseOrderPortal;