import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Button,
    Chip,
    Divider,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Progress,
    Tabs,
    Tab
} from "@heroui/react";
import {
    PencilIcon,
    DocumentTextIcon,
    ShoppingCartIcon,
    BanknotesIcon,
    StarIcon,
    ChartBarIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    GlobeAltIcon,
    BuildingOfficeIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth, usePurchaseOrders, useInvoices, usePayments, useSuppliers } from '@/store/extendedStore';

const SupplierProfileFixed = () => {
    const { currentUser } = useAuth();
    const { suppliers } = useSuppliers();
    const { purchaseOrders } = usePurchaseOrders();
    const { invoices } = useInvoices();
    const { payments } = usePayments();

    // Get supplier data based on current user
    const supplierData = suppliers.find(s => s.id === currentUser?.supplierId);
    
    // Get supplier-specific orders, invoices, and payments
    const supplierOrders = purchaseOrders.filter(order => order.supplierId === supplierData?.id);
    const supplierInvoices = invoices.filter(invoice => invoice.supplierId === supplierData?.id);

    const formatCurrency = (amount: number, currency: string = 'PEN') => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'A': case 'Aprobada': case 'Completada': case 'Pagada': return 'success';
            case 'P': case 'Pendiente': case 'En Revisión': case 'Programado': return 'warning';
            case 'En Proceso': case 'Procesado': return 'primary';
            case 'I': case 'S': case 'Cancelada': case 'Rechazada': return 'danger';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'A': return 'Activo';
            case 'P': return 'Pendiente';
            case 'I': return 'Inactivo';
            case 'S': return 'Suspendido';
            default: return status;
        }
    };

    // Calculating metrics
    const totalOrders = supplierOrders.length;
    const totalAmount = supplierOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const completedOrders = supplierOrders.filter(order => order.status === 'Completada').length;
    const pendingInvoices = supplierInvoices.filter(inv => inv.status === 'En Revisión').length;
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    if (!supplierData || !currentUser) {
        return (
            <Dashboard>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No se encontró información del proveedor.</p>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                    <p className="text-gray-600">Información y actividad de tu cuenta como proveedor</p>
                </div>

                {/* Profile Overview */}
                <Card>
                    <CardBody>
                        <div className="flex items-start gap-6">
                            <Avatar
                                src={supplierData.avatar}
                                name={supplierData.cardName}
                                className="w-24 h-24"
                            />
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">{supplierData.cardName}</h2>
                                        <p className="text-gray-600 mb-2">{supplierData.businessType}</p>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Chip 
                                                color={getStatusColor(supplierData.status) as any} 
                                                variant="flat" 
                                                size="sm"
                                            >
                                                {getStatusLabel(supplierData.status)}
                                            </Chip>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon 
                                                        key={i} 
                                                        className={`h-4 w-4 ${
                                                            i < Math.floor(supplierData.rating) 
                                                                ? 'text-yellow-400 fill-yellow-400' 
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                                <span className="text-sm text-gray-600 ml-1">
                                                    {supplierData.rating.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-gray-500" />
                                                <span>{supplierData.cardCode}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                                                <span>{supplierData.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <PhoneIcon className="h-4 w-4 text-gray-500" />
                                                <span>{supplierData.phone}</span>
                                            </div>
                                            {supplierData.website && (
                                                <div className="flex items-center gap-2">
                                                    <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                                                    <a 
                                                        href={supplierData.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Sitio Web
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        startContent={<PencilIcon className="h-4 w-4" />}
                                    >
                                        Editar Perfil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Órdenes</p>
                                <p className="text-2xl font-bold">{totalOrders}</p>
                                <p className="text-xs text-green-600">{completedOrders} completadas</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <BanknotesIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Monto Total</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                                <p className="text-xs text-gray-600">Promedio: {formatCurrency(averageOrderValue)}</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Facturas</p>
                                <p className="text-2xl font-bold">{supplierInvoices.length}</p>
                                <p className="text-xs text-orange-600">{pendingInvoices} pendientes</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <ChartBarIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tasa Completada</p>
                                <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
                                <Progress 
                                    size="sm" 
                                    color="success" 
                                    value={completionRate} 
                                    className="mt-1"
                                />
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Detailed Information */}
                <Tabs aria-label="Información detallada" className="w-full">
                    <Tab key="orders" title="Mis Órdenes">
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Órdenes de Compra Recientes</h3>
                            </CardHeader>
                            <CardBody>
                                <Table aria-label="Órdenes del proveedor">
                                    <TableHeader>
                                        <TableColumn>N° ORDEN</TableColumn>
                                        <TableColumn>FECHA</TableColumn>
                                        <TableColumn>MONTO</TableColumn>
                                        <TableColumn>ESTADO</TableColumn>
                                        <TableColumn>ENTREGA</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {supplierOrders.slice(0, 10).map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{order.orderNumber}</p>
                                                        <p className="text-xs text-gray-500">{order.department}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{order.createdDate}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">
                                                        {formatCurrency(order.totalAmount, order.currency)}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        color={getStatusColor(order.status) as any} 
                                                        variant="flat" 
                                                        size="sm"
                                                    >
                                                        {order.status}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{order.deliveryDate}</p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Tab>

                    <Tab key="invoices" title="Mis Facturas">
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Facturas Emitidas</h3>
                            </CardHeader>
                            <CardBody>
                                <Table aria-label="Facturas del proveedor">
                                    <TableHeader>
                                        <TableColumn>N° FACTURA</TableColumn>
                                        <TableColumn>FECHA EMISIÓN</TableColumn>
                                        <TableColumn>MONTO</TableColumn>
                                        <TableColumn>ESTADO</TableColumn>
                                        <TableColumn>VENCIMIENTO</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {supplierInvoices.slice(0, 10).map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell>
                                                    <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{invoice.issueDate}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">
                                                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        color={getStatusColor(invoice.status) as any} 
                                                        variant="flat" 
                                                        size="sm"
                                                    >
                                                        {invoice.status}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{invoice.dueDate}</p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Tab>

                    <Tab key="info" title="Información">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Información de Contacto</h3>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Persona de Contacto</p>
                                            <p className="text-sm">{supplierData.contactPerson}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Email de Contacto</p>
                                            <p className="text-sm">{supplierData.contactEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Teléfono de Contacto</p>
                                            <p className="text-sm">{supplierData.contactPhone}</p>
                                        </div>
                                        <Divider />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Dirección</p>
                                            <p className="text-sm">{supplierData.address}</p>
                                            <p className="text-sm">{supplierData.city}, {supplierData.country}</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Información Comercial</h3>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Términos de Pago</p>
                                            <p className="text-sm">{supplierData.paymentTerms || 'No especificado'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tipo de Negocio</p>
                                            <p className="text-sm">{supplierData.businessType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Fecha de Registro</p>
                                            <p className="text-sm">{supplierData.fechaRegistro}</p>
                                        </div>
                                        <Divider />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Certificaciones</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {supplierData.certifications?.map((cert, index) => (
                                                    <Chip key={index} size="sm" variant="flat">
                                                        {cert}
                                                    </Chip>
                                                )) || <p className="text-sm text-gray-400">Sin certificaciones</p>}
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </Dashboard>
    );
};

export default SupplierProfileFixed;
