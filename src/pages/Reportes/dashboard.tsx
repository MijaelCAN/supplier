import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
} from "@heroui/react";
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";

const ExecutiveDashboard = () => {
    // Sample data for the executive dashboard
    const dashboardData = {
        totalSuppliers: 47,
        activeSuppliers: 42,
        totalOrders: 156,
        totalSpending: 2450000,
        monthlyGrowth: 12.5,
        avgDeliveryTime: 5.2,
        supplierSatisfaction: 4.3,
        pendingPayments: 8
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    return (
        <Dashboard>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
                    <p className="text-gray-600">Resumen general del Portal de Proveedores</p>
                </div>

                {/* Main KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Proveedores</p>
                                <p className="text-2xl font-bold">{dashboardData.totalSuppliers}</p>
                                <p className="text-xs text-green-600">{dashboardData.activeSuppliers} activos</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <ShoppingCartIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Órdenes Totales</p>
                                <p className="text-2xl font-bold">{dashboardData.totalOrders}</p>
                                <p className="text-xs text-green-600">+{dashboardData.monthlyGrowth}% este mes</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Gasto Total</p>
                                <p className="text-2xl font-bold">{formatCurrency(dashboardData.totalSpending)}</p>
                                <p className="text-xs text-red-600">{dashboardData.pendingPayments} pagos pendientes</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex flex-row items-center space-x-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <ChartBarIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Satisfacción</p>
                                <p className="text-2xl font-bold">{dashboardData.supplierSatisfaction}/5.0</p>
                                <p className="text-xs text-blue-600">Promedio proveedores</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Additional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Métricas de Rendimiento</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Tiempo promedio de entrega</span>
                                    <span className="font-semibold">{dashboardData.avgDeliveryTime} días</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Proveedores activos</span>
                                    <span className="font-semibold">{dashboardData.activeSuppliers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Crecimiento mensual</span>
                                    <span className="font-semibold text-green-600">+{dashboardData.monthlyGrowth}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Pagos pendientes</span>
                                    <span className="font-semibold text-red-600">{dashboardData.pendingPayments}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Resumen Financiero</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Gasto Total del Mes</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(dashboardData.totalSpending)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Órdenes Completadas</p>
                                        <p className="text-lg font-bold text-green-700">
                                            {Math.round(dashboardData.totalOrders * 0.85)}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                        <p className="text-xs text-gray-600">En Proceso</p>
                                        <p className="text-lg font-bold text-orange-700">
                                            {Math.round(dashboardData.totalOrders * 0.15)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Charts Placeholder */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Tendencias y Análisis</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Gráficos de tendencias y análisis</p>
                                <p className="text-sm text-gray-400">Función disponible próximamente</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Dashboard>
    );
};

export default ExecutiveDashboard;
