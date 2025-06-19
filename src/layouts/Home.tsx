import { useState } from 'react';
import {
    Bars3Icon,
    BellIcon,
    ChartBarIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    UserGroupIcon,
    CogIcon,
    ClipboardDocumentListIcon,
    TruckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    EyeIcon,
    PencilIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    HomeIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const Home = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
        { id: 'suppliers', name: 'Proveedores', icon: BuildingOfficeIcon },
        { id: 'orders', name: 'Órdenes de Compra', icon: ShoppingCartIcon },
        { id: 'contracts', name: 'Contratos', icon: DocumentTextIcon },
        { id: 'invoices', name: 'Facturas', icon: CurrencyDollarIcon },
        { id: 'catalog', name: 'Catálogo', icon: ClipboardDocumentListIcon },
        { id: 'logistics', name: 'Logística', icon: TruckIcon },
        { id: 'users', name: 'Usuarios', icon: UserGroupIcon },
        { id: 'reports', name: 'Reportes', icon: ChartBarIcon },
        { id: 'settings', name: 'Configuración', icon: CogIcon },
    ];

    const stats = [
        { name: 'Proveedores Activos', value: '2,847', change: '+12%', changeType: 'increase' },
        { name: 'Órdenes Pendientes', value: '164', change: '-5%', changeType: 'decrease' },
        { name: 'Facturas por Pagar', value: '$1.2M', change: '+8%', changeType: 'increase' },
        { name: 'Contratos Vigentes', value: '892', change: '+3%', changeType: 'increase' },
    ];

    const recentOrders = [
        { id: 'OC-2024-001', supplier: 'Tech Solutions SAC', amount: '$45,890', status: 'Aprobada', date: '2024-06-10' },
        { id: 'OC-2024-002', supplier: 'Materiales Industriales', amount: '$23,450', status: 'Pendiente', date: '2024-06-10' },
        { id: 'OC-2024-003', supplier: 'Servicios Logísticos', amount: '$67,200', status: 'En Proceso', date: '2024-06-09' },
        { id: 'OC-2024-004', supplier: 'Equipos Médicos', amount: '$89,340', status: 'Aprobada', date: '2024-06-09' },
    ];

    const notifications = [
        { type: 'warning', message: 'Contrato con Proveedor ABC vence en 7 días', time: '2h' },
        { type: 'info', message: 'Nueva factura recibida de Tech Solutions', time: '4h' },
        { type: 'success', message: 'Orden OC-2024-001 completada exitosamente', time: '6h' },
        { type: 'error', message: 'Retraso en entrega de Materiales Industriales', time: '1d' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aprobada': return 'bg-green-100 text-green-800';
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'En Proceso': return 'bg-blue-100 text-blue-800';
            case 'Rechazada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'error': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
            default: return <ClockIcon className="h-5 w-5 text-blue-500" />;
        }
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                    <li>
                        <HomeIcon className="h-5 w-5 text-gray-400" />
                    </li>
                    <li>
                        <div className="flex items-center">
                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            <span className="ml-4 text-sm font-medium text-gray-700">Dashboard</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`text-sm font-medium ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h3>
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Ver todas
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.supplier}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.amount}</td>
                                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button className="text-blue-600 hover:text-blue-800">
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                            <button className="text-green-600 hover:text-green-800">
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {notifications.map((notification, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                {getNotificationIcon(notification.type)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">{notification.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <PlusIcon className="h-8 w-8 text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Nuevo Proveedor</span>
                    </button>
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <ShoppingCartIcon className="h-8 w-8 text-green-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Nueva Orden</span>
                    </button>
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <DocumentTextIcon className="h-8 w-8 text-purple-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Nuevo Contrato</span>
                    </button>
                    <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <ChartBarIcon className="h-8 w-8 text-orange-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Ver Reportes</span>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderGenericSection = (title: string) => (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                    <li>
                        <HomeIcon className="h-5 w-5 text-gray-400" />
                    </li>
                    <li>
                        <div className="flex items-center">
                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            <span className="ml-4 text-sm font-medium text-gray-700">{title}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <div className="flex space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <FunnelIcon className="h-4 w-4 mr-2" />
                        Filtros
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Exportar
                    </button>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Agregar Nuevo
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={`Buscar en ${title.toLowerCase()}...`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                        <BuildingOfficeIcon className="h-full w-full" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sección de {title}</h3>
                    <p className="text-gray-600 mb-6">
                        Esta sección contendría la funcionalidad específica para gestionar {title.toLowerCase()}.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Comenzar
                    </button>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return renderDashboard();
            case 'suppliers':
                return renderGenericSection('Proveedores');
            case 'orders':
                return renderGenericSection('Órdenes de Compra');
            case 'contracts':
                return renderGenericSection('Contratos');
            case 'invoices':
                return renderGenericSection('Facturas');
            case 'catalog':
                return renderGenericSection('Catálogo');
            case 'logistics':
                return renderGenericSection('Logística');
            case 'users':
                return renderGenericSection('Usuarios');
            case 'reports':
                return renderGenericSection('Reportes');
            case 'settings':
                return renderGenericSection('Configuración');
            default:
                return renderDashboard();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Portal Proveedores</h2>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-1 rounded-md text-gray-600 hover:text-gray-900"
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            activeSection === item.id
                                                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5 mr-3" />
                                        {item.name}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* Main Content */}
            <div className={`${sidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300`}>
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-md text-gray-600 hover:text-gray-900 lg:hidden"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                            <h1 className="text-xl font-semibold text-gray-900 ml-4 lg:ml-0">
                                Panel de Administrador
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                                <BellIcon className="h-6 w-6" />
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                  3
                                </span>
                            </button>

                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">Admin Usuario</p>
                                    <p className="text-xs text-gray-500">Administrador</p>
                                </div>
                                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">AU</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Home;