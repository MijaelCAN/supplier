import React, { useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Progress,
    Button,
    Divider
} from "@heroui/react";
import {
    ChartBarIcon,
    BuildingOfficeIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon as TrendingUpIcon,
    ArrowTrendingDownIcon as TrendingDownIcon,
    UsersIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useExtendedStore, useSuppliers, usePurchaseOrders, useInvoices, usePayments } from '@/store/extendedStore';

const DashboardEjecutivo = () => {
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

    const calculateGrowthPercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Cálculos adicionales
    const ordersByStatus = purchaseOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const invoicesByStatus = invoices.reduce((acc, invoice) => {
        acc[invoice.status] = (acc[invoice.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const paymentsByStatus = payments.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topSuppliersByAmount = suppliers
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

    const topSuppliersByOrders = suppliers
        .sort((a, b) => b.totalOrders - a.totalOrders)
        .slice(0, 5);

    const averageOrderValue = purchaseOrders.length > 0 
        ? purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0) / purchaseOrders.length
        : 0;

    const overduePayments = payments.filter(payment => {
        const today = new Date();
        const scheduled = new Date(payment.scheduledDate);
        return payment.status === 'Programado' && scheduled < today;
    });

    const pendingApprovals = [
        ...purchaseOrders.filter(o => o.status === 'Pendiente'),
        ...invoices.filter(i => i.status === 'En Revisión')
    ];

    return (
        <Dashboard>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
                        <p className="text-gray-600">Resumen ejecutivo y métricas clave del portal de proveedores</p>
                    </div>
                    <Button 
                        color="primary" 
                        endContent={<ArrowDownTrayIcon className="h-4 w-4" />}
                        variant="flat"
                    >
                        Exportar Reporte
                    </Button>
                </div>

                {/* KPIs Principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Proveedores Activos</p>
                                <p className="text-2xl font-bold">{metrics.activeSuppliers}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUpIcon className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-green-500">+12% vs mes anterior</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <ShoppingCartIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Órdenes Totales</p>
                                <p className="text-2xl font-bold">{purchaseOrders.length}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUpIcon className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-green-500">+8% vs mes anterior</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <BanknotesIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Gasto Total</p>
                                <p className="text-2xl font-bold">{formatCurrency(metrics.totalOrderAmount)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingDownIcon className="h-4 w-4 text-red-500" />
                                    <span className="text-xs text-red-500">-3% vs mes anterior</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <ChartBarIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Calificación Promedio</p>
                                <p className="text-2xl font-bold">{metrics.averageSupplierRating.toFixed(1)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUpIcon className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-green-500">+0.2 vs mes anterior</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Estado de Procesos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <ShoppingCartIcon className="h-5 w-5" />
                                Estado de Órdenes
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            {Object.entries(ordersByStatus).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                    <span className="text-sm">{status}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{count}</span>
                                        <Chip 
                                            size="sm" 
                                            variant="flat"
                                            color={
                                                status === 'Aprobada' ? 'success' :
                                                status === 'Pendiente' ? 'warning' :
                                                status === 'Completada' ? 'primary' : 'default'
                                            }
                                        >
                                            {((count / purchaseOrders.length) * 100).toFixed(0)}%
                                        </Chip>
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <DocumentTextIcon className="h-5 w-5" />
                                Estado de Facturas
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            {Object.entries(invoicesByStatus).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                    <span className="text-sm">{status}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{count}</span>
                                        <Chip 
                                            size="sm" 
                                            variant="flat"
                                            color={
                                                status === 'Aprobada' ? 'success' :
                                                status === 'En Revisión' ? 'warning' :
                                                status === 'Pagada' ? 'primary' :
                                                status === 'Rechazada' ? 'danger' : 'default'
                                            }
                                        >
                                            {((count / invoices.length) * 100).toFixed(0)}%
                                        </Chip>
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <BanknotesIcon className="h-5 w-5" />
                                Estado de Pagos
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            {Object.entries(paymentsByStatus).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                    <span className="text-sm">{status}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{count}</span>
                                        <Chip 
                                            size="sm" 
                                            variant="flat"
                                            color={
                                                status === 'Completado' ? 'success' :
                                                status === 'Procesado' ? 'primary' :
                                                status === 'Programado' ? 'warning' :
                                                status === 'Fallido' ? 'danger' : 'default'
                                            }
                                        >
                                            {((count / payments.length) * 100).toFixed(0)}%
                                        </Chip>
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>

                {/* Top Proveedores y Alertas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Top 5 Proveedores por Monto</h3>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {topSuppliersByAmount.map((supplier, index) => (
                                <div key={supplier.docEntry} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{supplier.cardName}</p>
                                            <p className="text-xs text-gray-500">{supplier.totalOrders} órdenes</p>
                                        </div>
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

                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                                Alertas y Pendientes
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {/* Pagos Vencidos */}
                            {overduePayments.length > 0 && (
                                <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                                    <div className="flex items-center gap-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                        <p className="text-sm font-medium text-red-800">
                                            {overduePayments.length} pago(s) vencido(s)
                                        </p>
                                    </div>
                                    <p className="text-xs text-red-600 mt-1">
                                        Monto total: {formatCurrency(overduePayments.reduce((sum, p) => sum + p.amount, 0))}
                                    </p>
                                </div>
                            )}

                            {/* Aprobaciones Pendientes */}
                            {pendingApprovals.length > 0 && (
                                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-5 w-5 text-orange-500" />
                                        <p className="text-sm font-medium text-orange-800">
                                            {pendingApprovals.length} aprobación(es) pendiente(s)
                                        </p>
                                    </div>
                                    <p className="text-xs text-orange-600 mt-1">
                                        Órdenes y facturas esperando aprobación
                                    </p>
                                </div>
                            )}

                            {/* Estadísticas Adicionales */}
                            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <div className="flex items-center gap-2">
                                    <ChartBarIcon className="h-5 w-5 text-blue-500" />
                                    <p className="text-sm font-medium text-blue-800">Valor Promedio de Orden</p>
                                </div>
                                <p className="text-lg font-bold text-blue-900">{formatCurrency(averageOrderValue)}</p>
                            </div>

                            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    <p className="text-sm font-medium text-green-800">Tasa de Aprobación</p>
                                </div>
                                <p className="text-lg font-bold text-green-900">
                                    {purchaseOrders.length > 0 
                                        ? ((purchaseOrders.filter(o => o.status === 'Aprobada' || o.status === 'Completada').length / purchaseOrders.length) * 100).toFixed(1)
                                        : 0
                                    }%
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Métricas de Rendimiento */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Métricas de Rendimiento</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Eficiencia de Aprobación</span>
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
            </div>
        </Dashboard>
    );
};

export default DashboardEjecutivo;
