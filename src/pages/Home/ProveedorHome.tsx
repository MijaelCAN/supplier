import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Avatar,
    Progress,
    Divider
} from "@heroui/react";
import {
    UserCircleIcon,
    DocumentTextIcon,
    ShoppingCartIcon,
    BanknotesIcon,
    StarIcon,
    CalendarIcon,
    ClockIcon,
    EyeIcon,
    ArrowRightIcon,
    PencilIcon,
    DocumentIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth } from '@/store/authStore';
import { useSuppliers } from '@/store';
import { useNavigate } from 'react-router-dom';

const ProveedorHome = () => {
    const { currentUser } = useAuth();
    const { suppliers } = useSuppliers();
    const navigate = useNavigate();

    // Encontrar los datos del proveedor basado en el supplierId del usuario
    const supplierData = suppliers.find(s => s.docEntry === currentUser?.supplierId);

    // Datos de ejemplo para el proveedor (en una implementación real vendrían de APIs)
    const proveedorStats = {
        ordenesPendientes: 3,
        ordenesCompletadas: 18,
        facturasPendientes: 2,
        facturasAprobadas: 15,
        pagosPendientes: 1,
        pagosRecibidos: 12,
        calificacionPromedio: supplierData?.rating || 4.2,
        proximasEntregas: 2,
        cotizacionesPendientes: 1
    };

    // Actividades recientes de ejemplo
    const actividadesRecientes = [
        {
            id: 1,
            tipo: 'orden',
            descripcion: 'Nueva orden de compra OC-2024-001',
            fecha: '2024-06-18',
            estado: 'pendiente'
        },
        {
            id: 2,
            tipo: 'pago',
            descripcion: 'Pago recibido por factura F-2024-015',
            fecha: '2024-06-17',
            estado: 'completado'
        },
        {
            id: 3,
            tipo: 'evaluacion',
            descripcion: 'Nueva evaluación de desempeño',
            fecha: '2024-06-16',
            estado: 'pendiente'
        }
    ];

    // Próximas fechas importantes
    const proximasFechas = [
        {
            id: 1,
            evento: 'Entrega OC-2024-001',
            fecha: '2024-06-25',
            tipo: 'entrega'
        },
        {
            id: 2,
            evento: 'Vencimiento Cotización COT-001',
            fecha: '2024-06-28',
            tipo: 'cotizacion'
        }
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completado': return 'success';
            case 'pendiente': return 'warning';
            case 'vencido': return 'danger';
            default: return 'default';
        }
    };

    if (!supplierData) {
        return (
            <Dashboard>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No se encontraron datos del proveedor.</p>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="space-y-6">
                {/* Header de bienvenida con datos del proveedor */}
                <Card>
                    <CardBody>
                        <div className="flex items-start gap-6">
                            <Avatar
                                src={supplierData.avatar}
                                name={supplierData.cardName}
                                className="w-20 h-20"
                            />
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            ¡Bienvenido, {currentUser?.firstName}!
                                        </h1>
                                        <h2 className="text-lg text-gray-700">{supplierData.cardName}</h2>
                                        <p className="text-gray-600 mb-2">{supplierData.businessType}</p>
                                        
                                        {/* Estado y calificación */}
                                        <div className="flex items-center gap-3">
                                            <Chip 
                                                color={supplierData.status === 'A' ? 'success' : 'warning'} 
                                                variant="flat"
                                                size="sm"
                                            >
                                                {supplierData.status === 'A' ? 'Activo' : 'Pendiente'}
                                            </Chip>
                                            <div className="flex items-center gap-1">
                                                <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                                <span className="text-sm font-medium">{supplierData.rating}</span>
                                                <span className="text-xs text-gray-500">(Calificación)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        startContent={<PencilIcon className="h-4 w-4" />}
                                        onPress={() => navigate('/proveedor/perfil')}
                                    >
                                        Actualizar Perfil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Resumen de actividades */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/orden-compra')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Órdenes Activas</p>
                                <p className="text-2xl font-bold">{proveedorStats.ordenesPendientes}</p>
                                <p className="text-xs text-green-600">{proveedorStats.ordenesCompletadas} completadas</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/factura')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Facturas Pendientes</p>
                                <p className="text-2xl font-bold">{proveedorStats.facturasPendientes}</p>
                                <p className="text-xs text-blue-600">{proveedorStats.facturasAprobadas} aprobadas</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/pagos')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <BanknotesIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Pagos Pendientes</p>
                                <p className="text-2xl font-bold">{proveedorStats.pagosPendientes}</p>
                                <p className="text-xs text-green-600">{proveedorStats.pagosRecibidos} recibidos</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/cotizaciones')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <DocumentIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Cotizaciones</p>
                                <p className="text-2xl font-bold">{proveedorStats.cotizacionesPendientes}</p>
                                <p className="text-xs text-orange-600">Pendientes respuesta</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Alertas importantes */}
                {(proveedorStats.proximasEntregas > 0 || proveedorStats.pagosPendientes > 0) && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                                <h3 className="text-lg font-semibold text-orange-700">Atención Requerida</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {proveedorStats.proximasEntregas > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-blue-800">{proveedorStats.proximasEntregas} Entregas Próximas</p>
                                            <p className="text-sm text-blue-600">En los próximos 7 días</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="primary" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/agenda')}
                                        >
                                            Ver Agenda
                                        </Button>
                                    </div>
                                )}
                                {proveedorStats.pagosPendientes > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-yellow-800">{proveedorStats.pagosPendientes} Pagos Pendientes</p>
                                            <p className="text-sm text-yellow-600">Esperando procesamiento</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="warning" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/pagos')}
                                        >
                                            Ver Estado
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Actividad reciente */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Actividad Reciente</h3>
                            <Button 
                                size="sm" 
                                variant="light" 
                                endContent={<EyeIcon className="h-4 w-4" />}
                            >
                                Ver historial
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {actividadesRecientes.map((actividad) => (
                                    <div key={actividad.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${
                                                actividad.tipo === 'orden' ? 'bg-blue-100 text-blue-600' :
                                                actividad.tipo === 'pago' ? 'bg-green-100 text-green-600' :
                                                'bg-purple-100 text-purple-600'
                                            }`}>
                                                {actividad.tipo === 'orden' ? <ShoppingCartIcon className="h-4 w-4" /> :
                                                 actividad.tipo === 'pago' ? <BanknotesIcon className="h-4 w-4" /> :
                                                 <StarIcon className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{actividad.descripcion}</p>
                                                <p className="text-xs text-gray-500">{actividad.fecha}</p>
                                            </div>
                                        </div>
                                        <Chip 
                                            size="sm"
                                            color={getStatusColor(actividad.estado) as any}
                                            variant="flat"
                                        >
                                            {actividad.estado === 'completado' ? 'Completado' : 'Pendiente'}
                                        </Chip>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Próximas fechas importantes */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Próximas Fechas</h3>
                            <Button 
                                size="sm" 
                                variant="light" 
                                endContent={<CalendarIcon className="h-4 w-4" />}
                                onPress={() => navigate('/agenda')}
                            >
                                Ver calendario
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {proximasFechas.map((fecha) => (
                                    <div key={fecha.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${
                                                fecha.tipo === 'entrega' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                                {fecha.tipo === 'entrega' ? 
                                                    <ClockIcon className="h-4 w-4" /> : 
                                                    <DocumentIcon className="h-4 w-4" />
                                                }
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{fecha.evento}</p>
                                                <p className="text-xs text-gray-500">{fecha.fecha}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">
                                                {Math.ceil((new Date(fecha.fecha).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Métricas de desempeño */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Mi Desempeño</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Calificación General</span>
                                    <span className="text-sm font-medium">{supplierData.rating}/5.0</span>
                                </div>
                                <Progress 
                                    size="sm" 
                                    color="warning" 
                                    value={(supplierData.rating / 5) * 100} 
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Entregas a Tiempo</span>
                                    <span className="text-sm font-medium">92%</span>
                                </div>
                                <Progress 
                                    size="sm" 
                                    color="success" 
                                    value={92} 
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Calidad de Productos</span>
                                    <span className="text-sm font-medium">96%</span>
                                </div>
                                <Progress 
                                    size="sm" 
                                    color="primary" 
                                    value={96} 
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Dashboard>
    );
};

export default ProveedorHome;
