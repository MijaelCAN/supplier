import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Avatar
} from "@heroui/react";
import {
    ShoppingCartIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    StarIcon,
    EyeIcon,
    PlusIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth } from '@/store/authStore';
import { useSuppliers } from '@/store';
import { useNavigate } from 'react-router-dom';
import {usePurchaseOrders} from "@/store/extendedStore.ts";

const ComprasHome = () => {
    const { currentUser } = useAuth();
    const { suppliers } = useSuppliers();
    const navigate = useNavigate();

    const { purchaseOrders } = usePurchaseOrders()

    // Estadísticas específicas para compras
    const comprasStats = {
        ordenesPendientes: purchaseOrders.filter(p => p.status === 'En Proceso').length,
        ordenesDelMes: purchaseOrders.length,
        proveedoresActivos: suppliers.filter(s => s.status === 'A').length,
        proveedoresPendientes: suppliers.filter(s => s.status === 'P').length,
        evaluacionesPendientes: 3,
        cotizacionesAbiertas: 5
    };

    const getLastOrders = (orders: any[], count: number = 3) => {
        // Convertimos la fecha 'TaxDate' a formato Date para poder comparar
        return orders
            .filter(o => o.createdDate && typeof o.createdDate === 'string')
            .sort((a, b) => {
                const [dayA, monthA, yearA] = a.createdDate.split('-').map(Number);
                const [dayB, monthB, yearB] = b.createdDate.split('-').map(Number);
                const dateA = new Date(yearA, monthA - 1, dayA);
                const dateB = new Date(yearB, monthB - 1, dayB);
                return dateB.getTime() - dateA.getTime(); // Orden descendente
            })
            .slice(0, count);
    };
    const ultimas3Ordenes = getLastOrders(purchaseOrders, 3);

    const proveedoresPendientes = suppliers.filter(s => s.status === 'P').slice(0, 3);

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
                            Panel de Gestión de Compras y Proveedores
                        </p>
                    </div>
                    <Avatar
                        src={currentUser?.avatar}
                        name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        size="lg"
                    />
                </div>

                {/* KPIs específicos para compras */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/orden-compra')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Órdenes Pendientes</p>
                                <p className="text-2xl font-bold">{comprasStats.ordenesPendientes}</p>
                                <p className="text-xs text-green-600">{comprasStats.ordenesDelMes} este mes</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/proveedores')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Proveedores Activos</p>
                                <p className="text-2xl font-bold">{comprasStats.proveedoresActivos}</p>
                                <p className="text-xs text-orange-600">{comprasStats.proveedoresPendientes} por aprobar</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/proveedores/evaluaciones')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <StarIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Evaluaciones</p>
                                <p className="text-2xl font-bold">{comprasStats.evaluacionesPendientes}</p>
                                <p className="text-xs text-purple-600">Pendientes</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-lg transition-shadow" isPressable onPress={() => navigate('/cotizaciones')}>
                        <CardBody className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <DocumentTextIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Cotizaciones</p>
                                <p className="text-2xl font-bold">{comprasStats.cotizacionesAbiertas}</p>
                                <p className="text-xs text-orange-600">Abiertas</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Alertas específicas para compras */}
                {(comprasStats.proveedoresPendientes > 0 || comprasStats.evaluacionesPendientes > 0) && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                                <h3 className="text-lg font-semibold text-orange-700">Tareas Pendientes</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {comprasStats.proveedoresPendientes > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-yellow-800">{comprasStats.proveedoresPendientes} Proveedores por Aprobar</p>
                                            <p className="text-sm text-yellow-600">Requieren evaluación</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="warning" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/proveedores')}
                                        >
                                            Revisar
                                        </Button>
                                    </div>
                                )}
                                {comprasStats.evaluacionesPendientes > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-purple-800">{comprasStats.evaluacionesPendientes} Evaluaciones Pendientes</p>
                                            <p className="text-sm text-purple-600">Calificaciones por completar</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            color="secondary" 
                                            variant="flat"
                                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                                            onPress={() => navigate('/proveedores/evaluaciones')}
                                        >
                                            Evaluar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Acciones rápidas específicas para compras */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card 
                                className="cursor-pointer hover:shadow-md transition-all"
                                isPressable
                                onPress={() => navigate('/orden-compra')}
                            >
                                <CardBody className="text-center p-6">
                                    <div className="bg-red-800 text-white p-3 rounded-lg inline-flex mb-3">
                                        <PlusIcon className="h-6 w-6" />
                                    </div>
                                    <h4 className="font-semibold mb-2">Lista de orden de Compra</h4>
                                    <p className="text-sm text-gray-600">Ver todas las Ordenes de compra</p>
                                </CardBody>
                            </Card>

                            <Card 
                                className="cursor-pointer hover:shadow-md transition-all"
                                isPressable
                                onPress={() => navigate('/proveedores')}
                            >
                                <CardBody className="text-center p-6">
                                    <div className="bg-blue-950 text-white p-3 rounded-lg inline-flex mb-3">
                                        <BuildingOfficeIcon className="h-6 w-6" />
                                    </div>
                                    <h4 className="font-semibold mb-2">Listado de Proveedores</h4>
                                    <p className="text-sm text-gray-600">Ver y administrar proveedores</p>
                                </CardBody>
                            </Card>

                            <Card 
                                className="cursor-pointer hover:shadow-md transition-all"
                                isPressable
                                onPress={() => navigate('/proveedores/evaluaciones')}
                            >
                                <CardBody className="text-center p-6">
                                    <div className="bg-gray-500 text-white p-3 rounded-lg inline-flex mb-3">
                                        <StarIcon className="h-6 w-6" />
                                    </div>
                                    <h4 className="font-semibold mb-2 items-center">Evaluar Proveedores</h4>
                                    <p className="text-sm text-gray-600">Calificar desempeño</p>
                                </CardBody>
                            </Card>
                        </div>
                    </CardBody>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Órdenes recientes */}
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
                        <CardBody>
                            <div className="space-y-3">
                                {ultimas3Ordenes.map((orden) => (
                                    <div key={orden.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{orden.orderNumber}</p>
                                            <p className="text-xs text-gray-500">{orden.supplierName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">{formatCurrency(orden.totalAmount)}</p>
                                            <Chip 
                                                size="sm"
                                                color={orden.status === 'En Proceso' ? 'primary' : orden.status === 'Completada' ? 'success' : 'warning'}
                                                variant="flat"
                                            >
                                                {orden.status === 'En Proceso' ? 'Abierto' :'Cerrado'}
                                            </Chip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Proveedores pendientes de aprobación */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Proveedores Pendientes</h3>
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
                                {proveedoresPendientes.map((proveedor) => (
                                    <div key={proveedor.docEntry} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={proveedor.avatar}
                                                name={proveedor.cardName}
                                                size="sm"
                                            />
                                            <div>
                                                <p className="font-medium text-sm">{proveedor.cardName}</p>
                                                <p className="text-xs text-gray-500">{proveedor.businessType}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Chip 
                                                size="sm"
                                                color="warning"
                                                variant="flat"
                                            >
                                                Pendiente
                                            </Chip>
                                            <p className="text-xs text-gray-500 mt-1">{proveedor.registrationDate}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </Dashboard>
    );
};

export default ComprasHome;
