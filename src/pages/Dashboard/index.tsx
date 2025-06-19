import React, { useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Button,
    Progress,
    Avatar,
    Divider
} from "@heroui/react";
import {
    ChartBarIcon,
    BuildingOfficeIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    BanknotesIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    ArrowRightIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useExtendedStore, useSuppliers, usePurchaseOrders, useInvoices, usePayments } from '@/store/extendedStore';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
    const navigate = useNavigate();
    const { suppliers } = useSuppliers();
    const { purchaseOrders } = usePurchaseOrders();
    const { invoices } = useInvoices();
    const { payments } = usePayments();
    const updateMetrics = useExtendedStore(state => state.updateMetrics);
    const metrics = useExtendedStore(state => state.metrics);

    useEffect(() => {
        updateMetrics();
    }, [suppliers, purchaseOrders, invoices, payments, updateMetrics]);

    const formatCurrency = (amount: number, currency: string = 'PEN') => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    // Datos para gráficos y métricas
    const recentOrders = purchaseOrders
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        .slice(0, 5);

    const pendingApprovals = [
        ...purchaseOrders.filter(o => o.status === 'Pendiente').slice(0, 3),
        ...invoices.filter(i => i.status === 'En Revisión').slice(0, 2)
    ];

    const overduePayments = payments.filter(payment => {
        const today = new Date();
        const scheduled = new Date(payment.scheduledDate);
        return payment.status === 'Programado' && scheduled < today;
    });

    const topSuppliers = suppliers
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 4);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aprobada': case 'Completada': case 'Pagada': return 'success';
            case 'Pendiente': case 'En Revisión': case 'Programado': return 'warning';
            case 'En Proceso': case 'Procesado': return 'primary';
            case 'Cancelada': case 'Rechazada': case 'Fallido': return 'danger';
            default: return 'default';
        }
    };

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard General</h1>
                    <p className="text-gray-600">Resumen general del portal de proveedores</p>
                </div>

                {/* KPIs Principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/proveedores')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Proveedores Activos</p>
                                <p className="text-2xl font-bold">{metrics.activeSuppliers}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUpIcon className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-green-500">Total: {metrics.totalSuppliers}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/orden-compra')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <ShoppingCartIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Órdenes de Compra</p>
                                <p className="text-2xl font-bold">{purchaseOrders.length}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-orange-500">Pendientes: {metrics.pendingOrders}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/factura')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Facturas</p>
                                <p className="text-2xl font-bold">{invoices.length}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-blue-500">En revisión: {metrics.pendingInvoices}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/finanzas/pagos')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <BanknotesIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Total Gastado</p>
                                <p className="text-2xl font-bold">{formatCurrency(metrics.totalOrderAmount)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-purple-500">Este mes: {formatCurrency(metrics.monthlySpending)}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Alertas y Notificaciones */}
                {(overduePayments.length > 0 || pendingApprovals.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {overduePayments.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                        <h3 className="text-lg font-semibold text-red-700">Pagos Vencidos</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="pt-0">
                                    <p className="text-sm text-red-600 mb-3">
                                        {overduePayments.length} pago(s) vencido(s) por un total de{' '}
                                        {formatCurrency(overduePayments.reduce((sum, p) => sum + p.amount, 0))}
                                    </p>
                                    <Button 
                                        color="danger" 
                                        size="sm" 
                                        endContent={<ArrowRightIcon className="h-4 w-4" />}
                                        onPress={() => navigate('/finanzas/pagos')}
                                    >
                                        Ver Pagos
                                    </Button>
                                </CardBody>
                            </Card>
                        )}

                        {pendingApprovals.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-5 w-5 text-orange-500" />
                                        <h3 className="text-lg font-semibold text-orange-700">Aprobaciones Pendientes</h3>
                                    </div>
                                </CardHeader>
                                <CardBody className="pt-0">
                                    <p className="text-sm text-orange-600 mb-3">
                                        {pendingApprovals.length} documento(s) esperando aprobación
                                    </p>
                                    <div className="flex gap-2">
                                        <Button 
                                            color="warning" 
                                            size="sm" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/orden-compra')}
                                        >
                                            Ver Órdenes
                                        </Button>
                                        <Button 
                                            color="warning" 
                                            size="sm" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/factura')}
                                        >
                                            Ver Facturas
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                )}

                {/* Métricas de Rendimiento */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Métricas de Rendimiento</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Tasa de Aprobación</span>
                                    <span className="text-sm font-medium">
                                        {purchaseOrders.length > 0 
                                            ? ((purchaseOrders.filter(o => o.status === 'Aprobada' || o.status === 'Completada').length / purchaseOrders.length) * 100).toFixed(1)
                                            : 0
                                        }%
                                    </span>
                                </div>
                                <Progress 
                                    size="sm" 
                                    color="success" 
                                    value={purchaseOrders.length > 0 
                                        ? (purchaseOrders.filter(o => o.status === 'Aprobada' || o.status === 'Completada').length / purchaseOrders.length) * 100
                                        : 0
                                    } 
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Pagos Completados</span>
                                    <span className="text-sm font-medium">
                                        {payments.length > 0 
                                            ? ((payments.filter(p => p.status === 'Completado').length / payments.length) * 100).toFixed(1)
                                            : 0
                                        }%
                                    </span>
                                </div>
                                <Progress 
                                    size="sm" 
                                    color="primary" 
                                    value={payments.length > 0 
                                        ? (payments.filter(p => p.status === 'Completado').length / payments.length) * 100
                                        : 0
                                    } 
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Satisfacción Proveedores</span>
                                    <span className="text-sm font-medium">{((metrics.averageSupplierRating / 5) * 100).toFixed(1)}%</span>
                                </div>
                                <Progress 
                                    size="sm" 
                                    color="warning" 
                                    value={(metrics.averageSupplierRating / 5) * 100} 
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Contenido Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Órdenes Recientes */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Órdenes Recientes</h3>
                            <Button 
                                size="sm" 
                                variant="light" 
                                endContent={<EyeIcon className="h-4 w-4" />}
                                onPress={() => navigate('/orden-compra')}
                            >
                                Ver todas
                            </Button>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-sm">{order.orderNumber}</p>
                                            <Chip 
                                                size="sm" 
                                                color={getStatusColor(order.status) as any} 
                                                variant="flat"
                                            >
                                                {order.status}
                                            </Chip>
                                        </div>
                                        <p className="text-xs text-gray-600">{order.supplierName}</p>
                                        <p className="text-xs text-gray-500">{order.createdDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{formatCurrency(order.totalAmount, order.currency)}</p>
                                        <div className="flex items-center gap-1">
                                            <Chip 
                                                size="sm" 
                                                color={order.priority === 'Urgente' ? 'danger' : order.priority === 'Alta' ? 'warning' : 'default'} 
                                                variant="flat"
                                            >
                                                {order.priority}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>

                    {/* Top Proveedores */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Top Proveedores</h3>
                            <Button 
                                size="sm" 
                                variant="light" 
                                endContent={<EyeIcon className="h-4 w-4" />}
                                onPress={() => navigate('/proveedores')}
                            >
                                Ver todos
                            </Button>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {topSuppliers.map((supplier, index) => (
                                <div key={supplier.docEntry} className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                    </div>
                                    <Avatar
                                        src={supplier.avatar}
                                        name={supplier.cardName}
                                        size="sm"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{supplier.cardName}</p>
                                        <p className="text-xs text-gray-500">{supplier.totalOrders} órdenes</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{formatCurrency(supplier.totalAmount)}</p>
                                        <div className="flex items-center gap-1">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <span 
                                                        key={i} 
                                                        className={`text-xs ${i < Math.floor(supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500">{supplier.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </Dashboard>
    );
};

export default DashboardHome;
