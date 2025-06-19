import React, { useState } from 'react';
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
    Tab,
    Input,
    Textarea,
    useDisclosure
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
    UserIcon,
    CalendarIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth, usePurchaseOrders, useInvoices, usePayments, useSuppliers } from '@/store/extendedStore';

const SupplierProfile = () => {
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
    const supplierPayments = payments.filter(payment => 
        supplierInvoices.some(inv => inv.id === payment.invoiceId)
    );

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
                                            >\n                                                {getStatusLabel(supplierData.status)}\n                                            </Chip>\n                                            <div className=\"flex items-center gap-1\">\n                                                {[...Array(5)].map((_, i) => (\n                                                    <StarIcon \n                                                        key={i} \n                                                        className={`h-4 w-4 ${\n                                                            i < Math.floor(supplierData.rating) \n                                                                ? 'text-yellow-400 fill-yellow-400' \n                                                                : 'text-gray-300'\n                                                        }`}\n                                                    />\n                                                ))}\n                                                <span className=\"text-sm text-gray-600 ml-1\">\n                                                    {supplierData.rating.toFixed(1)}\n                                                </span>\n                                            </div>\n                                        </div>\n\n                                        <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-sm\">\n                                            <div className=\"flex items-center gap-2\">\n                                                <UserIcon className=\"h-4 w-4 text-gray-500\" />\n                                                <span>{supplierData.cardCode}</span>\n                                            </div>\n                                            <div className=\"flex items-center gap-2\">\n                                                <EnvelopeIcon className=\"h-4 w-4 text-gray-500\" />\n                                                <span>{supplierData.email}</span>\n                                            </div>\n                                            <div className=\"flex items-center gap-2\">\n                                                <PhoneIcon className=\"h-4 w-4 text-gray-500\" />\n                                                <span>{supplierData.phone}</span>\n                                            </div>\n                                            {supplierData.website && (\n                                                <div className=\"flex items-center gap-2\">\n                                                    <GlobeAltIcon className=\"h-4 w-4 text-gray-500\" />\n                                                    <a \n                                                        href={supplierData.website} \n                                                        target=\"_blank\" \n                                                        rel=\"noopener noreferrer\"\n                                                        className=\"text-blue-600 hover:underline\"\n                                                    >\n                                                        Sitio Web\n                                                    </a>\n                                                </div>\n                                            )}\n                                        </div>\n                                    </div>\n                                    <Button\n                                        color=\"primary\"\n                                        variant=\"flat\"\n                                        startContent={<PencilIcon className=\"h-4 w-4\" />}\n                                    >\n                                        Editar Perfil\n                                    </Button>\n                                </div>\n                            </div>\n                        </div>\n                    </CardBody>\n                </Card>\n\n                {/* KPIs */}\n                <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">\n                    <Card>\n                        <CardBody className=\"flex flex-row items-center gap-4\">\n                            <div className=\"p-3 bg-blue-100 rounded-lg\">\n                                <ShoppingCartIcon className=\"h-8 w-8 text-blue-600\" />\n                            </div>\n                            <div>\n                                <p className=\"text-sm text-gray-500\">Total Órdenes</p>\n                                <p className=\"text-2xl font-bold\">{totalOrders}</p>\n                                <p className=\"text-xs text-green-600\">{completedOrders} completadas</p>\n                            </div>\n                        </CardBody>\n                    </Card>\n\n                    <Card>\n                        <CardBody className=\"flex flex-row items-center gap-4\">\n                            <div className=\"p-3 bg-green-100 rounded-lg\">\n                                <BanknotesIcon className=\"h-8 w-8 text-green-600\" />\n                            </div>\n                            <div>\n                                <p className=\"text-sm text-gray-500\">Monto Total</p>\n                                <p className=\"text-2xl font-bold\">{formatCurrency(totalAmount)}</p>\n                                <p className=\"text-xs text-gray-600\">Promedio: {formatCurrency(averageOrderValue)}</p>\n                            </div>\n                        </CardBody>\n                    </Card>\n\n                    <Card>\n                        <CardBody className=\"flex flex-row items-center gap-4\">\n                            <div className=\"p-3 bg-purple-100 rounded-lg\">\n                                <DocumentTextIcon className=\"h-8 w-8 text-purple-600\" />\n                            </div>\n                            <div>\n                                <p className=\"text-sm text-gray-500\">Facturas</p>\n                                <p className=\"text-2xl font-bold\">{supplierInvoices.length}</p>\n                                <p className=\"text-xs text-orange-600\">{pendingInvoices} pendientes</p>\n                            </div>\n                        </CardBody>\n                    </Card>\n\n                    <Card>\n                        <CardBody className=\"flex flex-row items-center gap-4\">\n                            <div className=\"p-3 bg-orange-100 rounded-lg\">\n                                <ChartBarIcon className=\"h-8 w-8 text-orange-600\" />\n                            </div>\n                            <div>\n                                <p className=\"text-sm text-gray-500\">Tasa Completada</p>\n                                <p className=\"text-2xl font-bold\">{completionRate.toFixed(1)}%</p>\n                                <Progress \n                                    size=\"sm\" \n                                    color=\"success\" \n                                    value={completionRate} \n                                    className=\"mt-1\"\n                                />\n                            </div>\n                        </CardBody>\n                    </Card>\n                </div>\n\n                {/* Detailed Information */}\n                <Tabs aria-label=\"Información detallada\" className=\"w-full\">\n                    <Tab key=\"orders\" title=\"Mis Órdenes\">\n                        <Card>\n                            <CardHeader>\n                                <h3 className=\"text-lg font-semibold\">Órdenes de Compra Recientes</h3>\n                            </CardHeader>\n                            <CardBody>\n                                <Table aria-label=\"Órdenes del proveedor\">\n                                    <TableHeader>\n                                        <TableColumn>N° ORDEN</TableColumn>\n                                        <TableColumn>FECHA</TableColumn>\n                                        <TableColumn>MONTO</TableColumn>\n                                        <TableColumn>ESTADO</TableColumn>\n                                        <TableColumn>ENTREGA</TableColumn>\n                                    </TableHeader>\n                                    <TableBody>\n                                        {supplierOrders.slice(0, 10).map((order) => (\n                                            <TableRow key={order.id}>\n                                                <TableCell>\n                                                    <div>\n                                                        <p className=\"font-medium text-sm\">{order.orderNumber}</p>\n                                                        <p className=\"text-xs text-gray-500\">{order.department}</p>\n                                                    </div>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <p className=\"text-sm\">{order.createdDate}</p>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <p className=\"font-medium\">\n                                                        {formatCurrency(order.totalAmount, order.currency)}\n                                                    </p>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <Chip \n                                                        color={getStatusColor(order.status) as any} \n                                                        variant=\"flat\" \n                                                        size=\"sm\"\n                                                    >\n                                                        {order.status}\n                                                    </Chip>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <p className=\"text-sm\">{order.deliveryDate}</p>\n                                                </TableCell>\n                                            </TableRow>\n                                        ))}\n                                    </TableBody>\n                                </Table>\n                            </CardBody>\n                        </Card>\n                    </Tab>\n\n                    <Tab key=\"invoices\" title=\"Mis Facturas\">\n                        <Card>\n                            <CardHeader>\n                                <h3 className=\"text-lg font-semibold\">Facturas Emitidas</h3>\n                            </CardHeader>\n                            <CardBody>\n                                <Table aria-label=\"Facturas del proveedor\">\n                                    <TableHeader>\n                                        <TableColumn>N° FACTURA</TableColumn>\n                                        <TableColumn>FECHA EMISIÓN</TableColumn>\n                                        <TableColumn>MONTO</TableColumn>\n                                        <TableColumn>ESTADO</TableColumn>\n                                        <TableColumn>VENCIMIENTO</TableColumn>\n                                    </TableHeader>\n                                    <TableBody>\n                                        {supplierInvoices.slice(0, 10).map((invoice) => (\n                                            <TableRow key={invoice.id}>\n                                                <TableCell>\n                                                    <p className=\"font-medium text-sm\">{invoice.invoiceNumber}</p>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <p className=\"text-sm\">{invoice.issueDate}</p>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <p className=\"font-medium\">\n                                                        {formatCurrency(invoice.totalAmount, invoice.currency)}\n                                                    </p>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <Chip \n                                                        color={getStatusColor(invoice.status) as any} \n                                                        variant=\"flat\" \n                                                        size=\"sm\"\n                                                    >\n                                                        {invoice.status}\n                                                    </Chip>\n                                                </TableCell>\n                                                <TableCell>\n                                                    <p className=\"text-sm\">{invoice.dueDate}</p>\n                                                </TableCell>\n                                            </TableRow>\n                                        ))}\n                                    </TableBody>\n                                </Table>\n                            </CardBody>\n                        </Card>\n                    </Tab>\n\n                    <Tab key=\"info\" title=\"Información\">\n                        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n                            <Card>\n                                <CardHeader>\n                                    <h3 className=\"text-lg font-semibold\">Información de Contacto</h3>\n                                </CardHeader>\n                                <CardBody className=\"space-y-4\">\n                                    <div className=\"space-y-3\">\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Persona de Contacto</p>\n                                            <p className=\"text-sm\">{supplierData.contactPerson}</p>\n                                        </div>\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Email de Contacto</p>\n                                            <p className=\"text-sm\">{supplierData.contactEmail}</p>\n                                        </div>\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Teléfono de Contacto</p>\n                                            <p className=\"text-sm\">{supplierData.contactPhone}</p>\n                                        </div>\n                                        <Divider />\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Dirección</p>\n                                            <p className=\"text-sm\">{supplierData.address}</p>\n                                            <p className=\"text-sm\">{supplierData.city}, {supplierData.country}</p>\n                                        </div>\n                                    </div>\n                                </CardBody>\n                            </Card>\n\n                            <Card>\n                                <CardHeader>\n                                    <h3 className=\"text-lg font-semibold\">Información Comercial</h3>\n                                </CardHeader>\n                                <CardBody className=\"space-y-4\">\n                                    <div className=\"space-y-3\">\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Términos de Pago</p>\n                                            <p className=\"text-sm\">{supplierData.paymentTerms || 'No especificado'}</p>\n                                        </div>\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Tipo de Negocio</p>\n                                            <p className=\"text-sm\">{supplierData.businessType}</p>\n                                        </div>\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Fecha de Registro</p>\n                                            <p className=\"text-sm\">{supplierData.fechaRegistro}</p>\n                                        </div>\n                                        <Divider />\n                                        <div>\n                                            <p className=\"text-sm font-medium text-gray-500\">Certificaciones</p>\n                                            <div className=\"flex flex-wrap gap-1 mt-1\">\n                                                {supplierData.certifications?.map((cert, index) => (\n                                                    <Chip key={index} size=\"sm\" variant=\"flat\">\n                                                        {cert}\n                                                    </Chip>\n                                                )) || <p className=\"text-sm text-gray-400\">Sin certificaciones</p>}\n                                            </div>\n                                        </div>\n                                    </div>\n                                </CardBody>\n                            </Card>\n                        </div>\n                    </Tab>\n                </Tabs>\n            </div>\n        </Dashboard>\n    );\n};\n\nexport default SupplierProfile;\n