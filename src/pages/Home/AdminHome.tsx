import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Avatar,
    Divider
} from "@heroui/react";
import {
    BuildingOfficeIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    BanknotesIcon,
    UserGroupIcon,
    ChartBarIcon,
    CogIcon,
    PlusIcon,
    EyeIcon,
    ArrowRightIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth } from '@/store/authStore';
import { useSuppliers } from '@/store';
import { useNavigate } from 'react-router-dom';

const AdminHome = () => {
    const { currentUser } = useAuth();
    const { suppliers } = useSuppliers();
    const navigate = useNavigate();

    // Estadísticas de ejemplo para el admin
    const stats = {
        totalSuppliers: suppliers.length,
        activeSuppliers: suppliers.filter(s => s.status === 'A').length,
        pendingSuppliers: suppliers.filter(s => s.status === 'P').length,
        totalOrders: 156,
        pendingOrders: 12,
        totalInvoices: 89,
        pendingPayments: 8,
        monthlySpending: 2450000
    };

    const quickActions = [
        {
            title: "Registrar Proveedor",
            description: "Agregar nuevo proveedor al sistema",
            icon: <PlusIcon className="h-6 w-6" />,
            color: "bg-blue-500",
            href: "/proveedores",
            action: "create"
        },
        {
            title: "Gestionar Usuarios",
            description: "Administrar usuarios del sistema",
            icon: <UserGroupIcon className="h-6 w-6" />,
            color: "bg-purple-500",
            href: "/configuracion/usuarios"
        },
        {
            title: "Ver Reportes",
            description: "Dashboard ejecutivo y reportes",
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: "bg-green-500",
            href: "/reportes/ejecutivo"
        },
        {
            title: "Configuración",
            description: "Configuración del sistema",
            icon: <CogIcon className="h-6 w-6" />,
            color: "bg-orange-500",
            href: "/configuracion/sistema"
        }
    ];

    const recentSuppliers = suppliers.slice(0, 5);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    return (
        <Dashboard>
            <div className="space-y-6">
                {/* Header de bienvenida */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            ¡Bienvenido, {currentUser?.firstName}!
                        </h1>
                        <p className="text-gray-600">
                            Panel de administración del Portal de Proveedores
                        </p>
                    </div>
                    <Avatar
                        src={currentUser?.avatar}
                        name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        size="lg"
                    />
                </div>

                {/* Estadísticas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/proveedores')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Proveedores</p>
                                <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Chip size="sm" color="success" variant="flat">
                                        {stats.activeSuppliers} activos
                                    </Chip>
                                    {stats.pendingSuppliers > 0 && (
                                        <Chip size="sm" color="warning" variant="flat">
                                            {stats.pendingSuppliers} pendientes
                                        </Chip>
                                    )}
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
                                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-orange-600">{stats.pendingOrders} pendientes</span>
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
                                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-blue-600">Este mes</span>
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
                                <p className="text-sm text-gray-500">Gasto Mensual</p>
                                <p className="text-2xl font-bold">{formatCurrency(stats.monthlySpending)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-red-600">{stats.pendingPayments} pagos pendientes</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Alertas y notificaciones */}
                {(stats.pendingSuppliers > 0 || stats.pendingOrders > 0 || stats.pendingPayments > 0) && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                                <h3 className="text-lg font-semibold text-orange-700">Elementos Pendientes de Atención</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {stats.pendingSuppliers > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-yellow-800">{stats.pendingSuppliers} Proveedores Pendientes</p>
                                            <p className="text-sm text-yellow-600">Requieren aprobación</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="warning" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/proveedores')}
                                        >
                                            Ver
                                        </Button>
                                    </div>
                                )}
                                {stats.pendingOrders > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-blue-800">{stats.pendingOrders} Órdenes Pendientes</p>
                                            <p className="text-sm text-blue-600">Esperando aprobación</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="primary" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/orden-compra')}
                                        >
                                            Ver
                                        </Button>
                                    </div>
                                )}
                                {stats.pendingPayments > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-red-800">{stats.pendingPayments} Pagos Vencidos</p>
                                            <p className="text-sm text-red-600">Requieren atención</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="danger" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/finanzas/pagos')}
                                        >
                                            Ver
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Acciones rápidas */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {quickActions.map((action, index) => (
                                <Card 
                                    key={index} 
                                    className="cursor-pointer hover:shadow-md transition-all"
                                    isPressable
                                    onPress={() => navigate(action.href)}
                                >
                                    <CardBody className="text-center p-6">
                                        <div className={`${action.color} text-white p-3 rounded-lg inline-flex mb-3`}>
                                            {action.icon}
                                        </div>
                                        <h4 className="font-semibold mb-2">{action.title}</h4>
                                        <p className="text-sm text-gray-600">{action.description}</p>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Proveedores recientes */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Proveedores Recientes</h3>
                        <Button 
                            size="sm" 
                            variant="light" 
                            endContent={<EyeIcon className="h-4 w-4" />}
                            onPress={() => navigate('/proveedores')}
                        >
                            Ver todos
                        </Button>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {recentSuppliers.map((supplier) => (
                                <div key={supplier.docEntry} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={supplier.avatar}
                                            name={supplier.cardName}
                                            size="sm"
                                        />
                                        <div>
                                            <p className="font-medium text-sm">{supplier.cardName}</p>
                                            <p className="text-xs text-gray-500">{supplier.businessType}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Chip 
                                            size="sm"
                                            color={supplier.status === 'A' ? 'success' : supplier.status === 'P' ? 'warning' : 'danger'}
                                            variant="flat"
                                        >
                                            {supplier.status === 'A' ? 'Activo' : supplier.status === 'P' ? 'Pendiente' : 'Inactivo'}
                                        </Chip>
                                        <p className="text-xs text-gray-500 mt-1">{supplier.registrationDate}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Dashboard>
    );
};

export default AdminHome;
