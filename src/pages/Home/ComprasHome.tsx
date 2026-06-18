import {
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
    ArrowRightIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import {useEffect, useState, useMemo} from 'react';
import Dashboard from "@/layouts/Dashboard";
import {useAuth} from '@/store/authStore';
import {useNavigate} from 'react-router-dom';
import {usePurchaseOrders} from "@/store/extendedStore.ts";
import {fetchSuppliersListFromApi} from '@/services/providers/providersApi';

const ComprasHome = () => {
    const {currentUser} = useAuth();
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [, setIsLoadingSuppliers] = useState(false);

    const {purchaseOrders} = usePurchaseOrders()

    // Cargar proveedores desde la API al montar el componente (estado local, independiente del store)
    useEffect(() => {
        const loadSuppliers = async () => {
            setIsLoadingSuppliers(true);
            try {
                const today = new Date();
                // Usar un rango más amplio para obtener más proveedores (últimos 30 días)
                const startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                
                const formatDateForApi = (date: Date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}${month}${day}`;
                };

                const apiSuppliers = await fetchSuppliersListFromApi({
                    startDate: formatDateForApi(startDate),
                    endDate: formatDateForApi(today),
                });
                
                // Guardar en estado local, no en el store
                setSuppliers(Array.isArray(apiSuppliers) ? apiSuppliers : []);
            } catch (error) {
                console.error('Error al cargar proveedores:', error);
                setSuppliers([]);
            } finally {
                setIsLoadingSuppliers(false);
            }
        };

        loadSuppliers();
    }, []); // Sin dependencias, solo se ejecuta al montar

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

    // Obtener los últimos 3 proveedores pendientes ordenados por fecha de registro
    const proveedoresPendientes = useMemo(() => {
        return suppliers
            .filter((s): s is typeof s & { registrationDate: string } => {
                // Filtrar por status pendiente (puede ser 'P' o 'Pendiente')
                const status = s.status.toUpperCase();
                const isPending = status === 'P' || status === 'PENDIENTE';
                // Type guard: asegurar que registrationDate existe y es string
                return isPending && typeof s.registrationDate === 'string' && s.registrationDate.length > 0;
            })
            .sort((a, b) => {
                // Parsear fechas en formato DD-MM-YYYY o YYYY-MM-DD
                const parseDate = (dateStr: string): Date => {
                    // Intentar formato DD-MM-YYYY
                    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                        const [day, month, year] = dateStr.split('-').map(Number);
                        return new Date(year, month - 1, day);
                    }
                    // Intentar formato YYYY-MM-DD
                    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        return new Date(year, month - 1, day);
                    }
                    // Fallback: intentar parsear directamente
                    const parsed = new Date(dateStr);
                    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
                };

                try {
                    const dateA = parseDate(a.registrationDate);
                    const dateB = parseDate(b.registrationDate);
                    return dateB.getTime() - dateA.getTime(); // Orden descendente (más recientes primero)
                } catch (error) {
                    return 0;
                }
            })
            .slice(0, 3);
    }, [suppliers]);

    const isTestEnabled = false;
    const isQuotesEnabled = false;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount);
    };

    return (
        <Dashboard>
            <div className="relative min-h-screen pb-8">
                {/* Background con imagen de tanques - Efecto glassmorphism */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 dark:opacity-10"
                        style={{backgroundImage: 'url(/tanques.webp)'}}
                    ></div>
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900"></div>
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(214,0,28,0.05),transparent_50%)]"></div>
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Hero Section - Flotante y moderno */}
                    <div className="relative mt-6">
                        <div
                            className="absolute -inset-4 bg-gradient-to-r from-rojo/10 via-azul/10 to-gris/10 rounded-3xl blur-2xl opacity-50"></div>
                        <div className=" ">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                <div className="relative">
                                    <div
                                        className="absolute -inset-2 bg-gradient-to-br from-rojo/20 to-azul/20 rounded-full blur-lg"></div>
                                    <Avatar
                                        src={currentUser?.avatar}
                                        name={currentUser?.firstName || ''}
                                        className="w-28 h-28 md:w-32 md:h-32 relative z-10 border-4 border-white dark:border-gray-800 shadow-xl"
                                    />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-2">
                                            ¡Bienvenido!
                                        </h1>
                                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                            {currentUser?.fullName}
                                        </h2>
                                        <p className="text-lg text-gray-600 dark:text-gray-400">Departamento de Compras</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 font-semibold text-sm backdrop-blur-sm`}>
                                            <CheckCircleIcon className="h-4 w-4"/>
                                            {currentUser?.role.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Accesos Directos - Compactos y Centrados */}
                    <div className="mt-8 mb-32">
                        <div className="flex justify-center">
                            <div className="w-full max-w-[60%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Órdenes de Compra */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-azul/50 dark:hover:border-azul/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/orden-compra')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-azul to-azul/80">
                                        <ShoppingCartIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Órdenes de Compra</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-azul group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Proveedores */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-green-500/50 dark:hover:border-green-500/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/proveedores')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                                        <BuildingOfficeIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Proveedores</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Evaluaciones */}
                                <div
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-500/50 dark:hover:border-purple-500/50 cursor-pointer hover:shadow-lg transition-all duration-300
                                    ${isTestEnabled
                                    ? 'cursor-pointer hover:shadow-lg hover:border-gris/50 dark:hover:border-gris/50'
                                    : 'cursor-not-allowed pointer-events-none opacity-50'
                                    }`}
                                    onClick={() => navigate('/proveedores/evaluaciones')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                                        <StarIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Evaluaciones</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Cotizaciones */}
                                <div
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-500/50 dark:hover:border-orange-500/50 cursor-pointer hover:shadow-lg transition-all duration-300
                                    ${isQuotesEnabled
                                    ? 'cursor-pointer hover:shadow-lg hover:border-gris/50 dark:hover:border-gris/50'
                                    : 'cursor-not-allowed pointer-events-none opacity-50'
                                    }`}
                                    onClick={() => navigate('/cotizaciones')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                                        <DocumentTextIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Cotizaciones</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas y Resumen - Layout asimétrico */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Estadísticas Principales */}
                        <div className="lg:col-span-8 relative">
                            <div className="p-6 space-y-5">
                                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                                    Resumen de Actividad
                                </h3>
                                {/* Separador sutil */}
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>

                                {/*<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border border-white/30 dark:border-gray-700/30 p-4">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-azul/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-azul to-azul/80">
                                                    <ShoppingCartIcon className="h-5 w-5 text-white"/>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pendientes</p>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{comprasStats.ordenesPendientes}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{comprasStats.ordenesDelMes} este mes</p>
                                        </div>
                                    </div>


                                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border border-white/30 dark:border-gray-700/30 p-4">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                                                    <BuildingOfficeIcon className="h-5 w-5 text-white"/>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Activos</p>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{comprasStats.proveedoresActivos}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{comprasStats.proveedoresPendientes} por aprobar</p>
                                        </div>
                                    </div>


                                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border border-white/30 dark:border-gray-700/30 p-4">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                                                    <StarIcon className="h-5 w-5 text-white"/>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Evaluaciones</p>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{comprasStats.evaluacionesPendientes}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pendientes</p>
                                        </div>
                                    </div>


                                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border border-white/30 dark:border-gray-700/30 p-4">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                                                    <DocumentTextIcon className="h-5 w-5 text-white"/>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Cotizaciones</p>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{comprasStats.cotizacionesAbiertas}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Abiertas</p>
                                        </div>
                                    </div>
                                </div>*/}

                                {/* Alertas específicas para compras */}
                                {/*(comprasStats.proveedoresPendientes > 0 || comprasStats.evaluacionesPendientes > 0) && (
                                    <div className="mt-6 relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border border-orange-200/50 dark:border-orange-900/30 p-5">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500"/>
                                                <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400">Tareas Pendientes</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {comprasStats.proveedoresPendientes > 0 && (
                                                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-yellow-800 dark:text-yellow-300">{comprasStats.proveedoresPendientes} Proveedores por Aprobar</p>
                                                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Requieren evaluación</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            color="warning"
                                                            variant="flat"
                                                            endContent={<ArrowRightIcon className="h-4 w-4"/>}
                                                            onPress={() => navigate('/proveedores')}
                                                        >
                                                            Revisar
                                                        </Button>
                                                    </div>
                                                )}
                                                {comprasStats.evaluacionesPendientes > 0 && (
                                                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-purple-800 dark:text-purple-300">{comprasStats.evaluacionesPendientes} Evaluaciones Pendientes</p>
                                                            <p className="text-sm text-purple-600 dark:text-purple-400">Calificaciones por completar</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            color="secondary"
                                                            variant="flat"
                                                            endContent={<ArrowRightIcon className="h-4 w-4"/>}
                                                            onPress={() => navigate('/proveedores/evaluaciones')}
                                                        >
                                                            Evaluar
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )*/}
                            </div>
                        </div>
                    </div>

                    {/* Secciones de Actividad - Diseño fluido */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Órdenes Recientes */}
                        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xl border border-white/30 dark:border-gray-700/30 p-8">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-azul/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-azul to-azul/80">
                                            <ShoppingCartIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Órdenes Recientes</h3>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        endContent={<EyeIcon className="h-4 w-4"/>}
                                        onPress={() => navigate('/orden-compra')}
                                    >
                                        Ver todas
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {ultimas3Ordenes.length > 0 ? (
                                        ultimas3Ordenes.map((orden) => (
                                            <div
                                                key={orden.id}
                                                className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all"
                                            >
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{orden.orderNumber}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{orden.supplierName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(orden.totalAmount)}</p>
                                                    <Chip
                                                        size="sm"
                                                        color={orden.status === 'En Proceso' ? 'primary' : orden.status === 'Completada' ? 'success' : 'warning'}
                                                        variant="flat"
                                                        className="mt-1"
                                                    >
                                                        {orden.status === 'En Proceso' ? 'Abierto' : 'Cerrado'}
                                                    </Chip>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-azul/10 to-azul/5 flex items-center justify-center">
                                                <ShoppingCartIcon className="h-8 w-8 text-azul/50" />
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No hay órdenes recientes</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">Las órdenes aparecerán aquí</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Proveedores Pendientes */}
                        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xl border border-white/30 dark:border-gray-700/30 p-8">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                                            <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Proveedores Pendientes</h3>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        endContent={<EyeIcon className="h-4 w-4"/>}
                                        onPress={() => navigate('/proveedores')}
                                    >
                                        Ver todos
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {proveedoresPendientes.length > 0 ? (
                                        proveedoresPendientes.map((proveedor) => (
                                            <div
                                                key={proveedor.docEntry}
                                                className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={proveedor.avatar}
                                                        name={proveedor.cardName}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{proveedor.cardName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{proveedor.businessType}</p>
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
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{proveedor.registrationDate}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
                                                <CheckCircleIcon className="h-8 w-8 text-green-500/50" />
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No hay proveedores pendientes</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">Todos los proveedores están aprobados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default ComprasHome;
