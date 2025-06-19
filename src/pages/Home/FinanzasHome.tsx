import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Avatar
} from "@heroui/react";
import {
    BanknotesIcon,
    DocumentTextIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    EyeIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    CalculatorIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const FinanzasHome = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Estadísticas específicas para finanzas
    const finanzasStats = {
        facturasPendientes: 12,
        facturasDelMes: 156,
        pagosPendientes: 8,
        pagosVencidos: 3,
        montoFacturado: 1850000,
        montoPagado: 1620000,
        cuentasPorPagar: 230000,
        conciliacionesPendientes: 5
    };

    const facturasPendientes = [
        { id: 'F-2024-001', proveedor: 'TechCorp Solutions', monto: 15000, vencimiento: '2024-06-25' },
        { id: 'F-2024-002', proveedor: 'Industrial Supplies', monto: 8500, vencimiento: '2024-06-28' },
        { id: 'F-2024-003', proveedor: 'Medical Equipment', monto: 22000, vencimiento: '2024-07-01' }
    ];

    const pagosVencidos = [
        { id: 'P-2024-001', proveedor: 'Construction Materials', monto: 12000, vencimiento: '2024-06-15' },
        { id: 'P-2024-002', proveedor: 'Office Supplies', monto: 3500, vencimiento: '2024-06-18' }
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    const getDaysUntilDue = (dateString: string) => {
        const today = new Date();
        const dueDate = new Date(dateString);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                            Panel de Gestión Financiera y Pagos
                        </p>
                    </div>
                    <Avatar
                        src={currentUser?.avatar}
                        name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        size="lg"
                    />
                </div>

                {/* KPIs específicos para finanzas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/factura')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Facturas Pendientes</p>
                                <p className="text-2xl font-bold">{finanzasStats.facturasPendientes}</p>
                                <p className="text-xs text-green-600">{finanzasStats.facturasDelMes} este mes</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/finanzas/pagos')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <BanknotesIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Pagos Pendientes</p>
                                <p className="text-2xl font-bold">{finanzasStats.pagosPendientes}</p>
                                <p className="text-xs text-red-600">{finanzasStats.pagosVencidos} vencidos</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/finanzas/cuentas-por-pagar')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <CreditCardIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Cuentas por Pagar</p>
                                <p className="text-2xl font-bold">{formatCurrency(finanzasStats.cuentasPorPagar)}</p>
                                <p className="text-xs text-orange-600">Total pendiente</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/finanzas/conciliacion')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <CalculatorIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Conciliaciones</p>
                                <p className="text-2xl font-bold">{finanzasStats.conciliacionesPendientes}</p>
                                <p className="text-xs text-blue-600">Pendientes</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Resumen financiero */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Resumen Financiero del Mes</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Total Facturado</p>
                                <p className="text-xl font-bold text-green-700">{formatCurrency(finanzasStats.montoFacturado)}</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <BanknotesIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Total Pagado</p>
                                <p className="text-xl font-bold text-blue-700">{formatCurrency(finanzasStats.montoPagado)}</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Pendiente de Pago</p>
                                <p className="text-xl font-bold text-orange-700">
                                    {formatCurrency(finanzasStats.montoFacturado - finanzasStats.montoPagado)}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Alertas críticas */}
                {(finanzasStats.pagosVencidos > 0 || finanzasStats.conciliacionesPendientes > 0) && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                <h3 className="text-lg font-semibold text-red-700">Atención Urgente</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {finanzasStats.pagosVencidos > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-red-800">{finanzasStats.pagosVencidos} Pagos Vencidos</p>
                                            <p className="text-sm text-red-600">Requieren procesamiento inmediato</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="danger" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/finanzas/pagos')}
                                        >
                                            Procesar
                                        </Button>
                                    </div>
                                )}
                                {finanzasStats.conciliacionesPendientes > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-yellow-800">{finanzasStats.conciliacionesPendientes} Conciliaciones Pendientes</p>
                                            <p className="text-sm text-yellow-600">Cierres contables pendientes</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="warning" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/finanzas/conciliacion')}
                                        >
                                            Revisar
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card 
                                className="cursor-pointer hover:shadow-md transition-all"
                                isPressable
                                onPress={() => navigate('/finanzas/pagos')}
                            >
                                <CardBody className="text-center p-6">
                                    <div className="bg-green-500 text-white p-3 rounded-lg inline-flex mb-3">
                                        <BanknotesIcon className="h-6 w-6" />
                                    </div>
                                    <h4 className="font-semibold mb-2">Procesar Pagos</h4>
                                    <p className="text-sm text-gray-600">Gestionar pagos pendientes</p>
                                </CardBody>
                            </Card>

                            <Card 
                                className="cursor-pointer hover:shadow-md transition-all"
                                isPressable
                                onPress={() => navigate('/factura')}
                            >
                                <CardBody className="text-center p-6">
                                    <div className="bg-purple-500 text-white p-3 rounded-lg inline-flex mb-3">
                                        <DocumentTextIcon className="h-6 w-6" />
                                    </div>
                                    <h4 className="font-semibold mb-2">Revisar Facturas</h4>
                                    <p className="text-sm text-gray-600">Aprobar o rechazar facturas</p>
                                </CardBody>
                            </Card>

                            <Card 
                                className="cursor-pointer hover:shadow-md transition-all"
                                isPressable
                                onPress={() => navigate('/reportes/financieros')}
                            >
                                <CardBody className="text-center p-6">
                                    <div className="bg-blue-500 text-white p-3 rounded-lg inline-flex mb-3">
                                        <ChartBarIcon className="h-6 w-6" />
                                    </div>
                                    <h4 className="font-semibold mb-2">Reportes Financieros</h4>
                                    <p className="text-sm text-gray-600">Ver análisis y reportes</p>
                                </CardBody>
                            </Card>
                        </div>
                    </CardBody>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Facturas pendientes de aprobación */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Facturas Pendientes</h3>
                            <Button 
                                size="sm" 
                                variant="light" 
                                endContent={<EyeIcon className="h-4 w-4" />}
                                onPress={() => navigate('/factura')}
                            >
                                Ver todas
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {facturasPendientes.map((factura) => {
                                    const dias = getDaysUntilDue(factura.vencimiento);
                                    return (
                                        <div key={factura.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm">{factura.id}</p>
                                                <p className="text-xs text-gray-500">{factura.proveedor}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">{formatCurrency(factura.monto)}</p>
                                                <Chip 
                                                    size="sm"
                                                    color={dias < 0 ? 'danger' : dias <= 3 ? 'warning' : 'success'}
                                                    variant="flat"
                                                >
                                                    {dias < 0 ? `${Math.abs(dias)} días vencido` : `${dias} días`}
                                                </Chip>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Pagos vencidos */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Pagos Vencidos</h3>
                            <Button 
                                size="sm" 
                                variant="light" 
                                endContent={<EyeIcon className="h-4 w-4" />}
                                onPress={() => navigate('/finanzas/pagos')}
                            >
                                Ver todos
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {pagosVencidos.map((pago) => {
                                    const diasVencido = Math.abs(getDaysUntilDue(pago.vencimiento));
                                    return (
                                        <div key={pago.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm">{pago.id}</p>
                                                <p className="text-xs text-gray-500">{pago.proveedor}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-red-700">{formatCurrency(pago.monto)}</p>
                                                <Chip 
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                >
                                                    {diasVencido} días vencido
                                                </Chip>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </Dashboard>
    );
};

export default FinanzasHome;
