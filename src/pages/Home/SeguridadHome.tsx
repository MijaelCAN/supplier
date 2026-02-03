import {
    Button,
    Chip,
    Avatar
} from "@heroui/react";
import {
    ShieldCheckIcon,
    BookOpenIcon,
    FolderIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    EyeIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ClockIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import {useAuth} from '@/store/authStore';
import {useNavigate} from 'react-router-dom';

const SeguridadHome = () => {
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
                    {/* Hero Section */}
                    <div className="relative mt-6">
                        <div
                            className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-2xl opacity-50"></div>
                        <div>
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
                                        <p className="text-lg text-gray-600 dark:text-gray-400">Departamento de Seguridad</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-sm backdrop-blur-sm`}>
                                            <ShieldCheckIcon className="h-4 w-4"/>
                                            {currentUser?.role.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accesos Directos */}
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

                                {/* Recepción */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-green-500/50 dark:hover:border-green-500/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/recepcion')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                                        <FolderIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Recepción</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Proveedores */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-500/50 dark:hover:border-purple-500/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/proveedores')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                                        <BuildingOfficeIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Proveedores</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información de Funciones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xl border border-white/30 dark:border-gray-700/30 p-8">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                                        <ShieldCheckIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Funciones Principales</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                                        <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">Evaluar Puntualidad</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Verificar que las entregas lleguen en el horario programado</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-900/20">
                                        <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">Validar Documentación</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Verificar que todos los documentos requeridos estén completos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/20">
                                        <CheckCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">Validar Entrada</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Controlar el ingreso de mercadería y vehículos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xl border border-white/30 dark:border-gray-700/30 p-8">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                                        <EyeIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Accesos Disponibles</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50">
                                        <div className="flex items-center gap-3">
                                            <BookOpenIcon className="h-5 w-5 text-blue-600" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ver Citas y Visitas</span>
                                        </div>
                                        <Chip size="sm" color="success" variant="flat">Activo</Chip>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50">
                                        <div className="flex items-center gap-3">
                                            <FolderIcon className="h-5 w-5 text-green-600" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Validar Entrada</span>
                                        </div>
                                        <Chip size="sm" color="success" variant="flat">Activo</Chip>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50">
                                        <div className="flex items-center gap-3">
                                            <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ver Proveedores</span>
                                        </div>
                                        <Chip size="sm" color="success" variant="flat">Activo</Chip>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50">
                                        <div className="flex items-center gap-3">
                                            <DocumentTextIcon className="h-5 w-5 text-orange-600" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Validar Documentos</span>
                                        </div>
                                        <Chip size="sm" color="success" variant="flat">Activo</Chip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};

export default SeguridadHome;
