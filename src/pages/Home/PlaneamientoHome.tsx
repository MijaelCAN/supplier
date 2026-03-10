import {
    Button,
    Chip,
    Avatar
} from "@heroui/react";
import {
    BookOpenIcon,
    CalculatorIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import {useAuth} from '@/store/authStore';
import {useNavigate} from 'react-router-dom';

const PlaneamientoHome = () => {
    const {currentUser} = useAuth();
    const navigate = useNavigate();

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
                            className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-2xl opacity-50"></div>
                        <div className=" ">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                <div className="relative">
                                    <div
                                        className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-lg"></div>
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
                                        <p className="text-lg text-gray-600 dark:text-gray-400">Planeamiento y Control de Producción (PCP)</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-sm backdrop-blur-sm`}>
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
                            <div className="w-full max-w-[60%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Agenda - Citas */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/agenda')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                                        <BookOpenIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Agenda - Citas</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Validación de Cobertura */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-500/50 dark:hover:border-purple-500/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/agenda')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                                        <CalculatorIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Validar Cobertura</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Confirmación PCP */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/agenda')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                                        <ClipboardDocumentCheckIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmación PCP</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información del Rol */}
                    <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xl border border-white/30 dark:border-gray-700/30 p-8">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Funciones de PCP</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                        <CheckCircleIcon className="h-5 w-5" />
                                        Validación de Programación
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Confirma que los ítems programados cumplan con los requisitos de producción y disponibilidad.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50">
                                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                                        <CalculatorIcon className="h-5 w-5" />
                                        Cálculo de Cobertura
                                    </h4>
                                    <p className="text-sm text-purple-800 dark:text-purple-200">
                                        Calcula la cobertura actual de inventario y la cobertura proyectada con los ingresos programados.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/50">
                                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                                        Confirmación de Items
                                    </h4>
                                    <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                        Marca los ítems como "CONFORME" y agrega comentarios especiales (códigos nuevos, reemplazos, etc.).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default PlaneamientoHome;
