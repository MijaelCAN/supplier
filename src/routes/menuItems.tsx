import {
    BookOpenIcon,
    BuildingOfficeIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    FolderIcon,
    HomeIcon,
    PresentationChartBarIcon,
    ScaleIcon,
    ShieldCheckIcon,
    ShoppingCartIcon,
    StarIcon,
    UserCircleIcon,
    UsersIcon,
    InformationCircleIcon,
    VideoCameraIcon
} from "@heroicons/react/24/outline";
import {MenuItem, UserRole} from "@/routes/menuTypes.ts";
import {CalculatorIcon} from "@heroicons/react/16/solid";

/*export const menuItems: MenuItem[] = [
    {
        title: "Dashboard",
        icon: <HomeIcon className="h-5 w-5" />,
        href: "/dashboard",
        single: true
    },
    {
        title: "Proveedores",
        icon: <BuildingOfficeIcon className="h-5 w-5" />,
        items: [
            { title: "Lista de Proveedores", icon: <UsersIcon className="h-4 w-4" />, href: "/proveedores" },
            { title: "Registrar Proveedor", icon: <BuildingOfficeIcon className="h-4 w-4" />, href: "/proveedores/nuevo" },
            { title: "Evaluaciones", icon: <StarIcon className="h-4 w-4" />, href: "/proveedores/evaluaciones" },
            { title: "Homologaciones", icon: <DocumentTextIcon className="h-4 w-4" />, href: "/proveedores/homologaciones" }
        ]
    },
    {
        title: "Procesos de Compra",
        icon: <ShoppingCartIcon className="h-5 w-5" />,
        items: [
            { title: "Orden de compra", icon: <ShoppingCartIcon className="h-4 w-4" />, href: "/orden-compra" },
            { title: "Recepción", icon: <FolderIcon className="h-4 w-4" />, href: "/recepcion" },
            { title: "Facturación", icon: <DocumentTextIcon className="h-4 w-4" />, href: "/factura" },
            { title: "Pagos", icon: <CreditCardIcon className="h-4 w-4" />, href: "/pagos" },
            { title: "Fecha de entrega", icon: <CalendarDaysIcon className="h-4 w-4" />, href: "/entrega" },
            { title: "Cronograma de pago", icon: <ClockIcon className="h-4 w-4" />, href: "/cronograma" },
            { title: "Agenda", icon: <BookOpenIcon className="h-4 w-4" />, href: "/agenda" },
            { title: "Licitación", icon: <ScaleIcon className="h-4 w-4" />, href: "/licitacion" }
        ]
    },
    {
        title: "Reportes",
        icon: <ChartBarIcon className="h-5 w-5" />,
        items: [
            { title: "Análisis de proveedores", icon: <UsersIcon className="h-4 w-4" />, href: "/reportes/proveedores" },
            { title: "Métricas de compras", icon: <ChartBarIcon className="h-4 w-4" />, href: "/reportes/compras" }
        ]
    },
    {
        title: "Configuración",
        icon: <Cog6ToothIcon className="h-5 w-5" />,
        items: [
            { title: "Perfil", icon: <UserCircleIcon className="h-4 w-4" />, href: "/configuracion/perfil" },
            { title: "Sistema", icon: <Cog6ToothIcon className="h-4 w-4" />, href: "/configuracion/sistema" }
        ]
    }
];*/
export const menuItems: MenuItem[] = [
    {
        title: "Dashboard",
        icon: <HomeIcon className="h-5 w-5" />,
        href: "/dashboard",
        single: true,
        roles: [UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.FINANZAS, UserRole.ALMACEN]
    },
    {
        title: "Proveedores",
        icon: <BuildingOfficeIcon className="h-5 w-5" />,
        roles: [UserRole.ADMIN, UserRole.COMPRAS],
        items: [
            {
                title: "Lista de Proveedores",
                icon: <UsersIcon className="h-4 w-4" />,
                href: "/proveedores",
                roles: [UserRole.ADMIN, UserRole.COMPRAS]
            },
            {
                title: "Evaluaciones",
                icon: <StarIcon className="h-4 w-4" />,
                href: "/proveedores/evaluaciones",
                roles: [UserRole.ADMIN]
            },
            {
                title: "Homologaciones",
                icon: <DocumentTextIcon className="h-4 w-4" />,
                href: "/proveedores/homologaciones",
                roles: [UserRole.ADMIN]
            }
        ]
    },
    {
        title: "Mi Perfil",
        icon: <UserCircleIcon className="h-5 w-5" />,
        roles: [UserRole.PROVEEDOR],
        items: [
            {
                title: "Editar Perfil",
                icon: <BuildingOfficeIcon className="h-4 w-4" />,
                href: "/proveedor/perfil",
                roles: [UserRole.PROVEEDOR]
            },
            {
                title: "Documentos",
                icon: <DocumentTextIcon className="h-4 w-4" />,
                href: "/proveedor/documentos",
                roles: [/*UserRole.PROVEEDOR*/]
            },
            {
                title: "Certificaciones",
                icon: <StarIcon className="h-4 w-4" />,
                href: "/proveedor/certificaciones",
                roles: [/*UserRole.PROVEEDOR*/]
            }
        ]
    },
    {
        title: "Procesos de Compra",
        icon: <ShoppingCartIcon className="h-5 w-5" />,
        roles: [UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.FINANZAS, UserRole.ALMACEN],
        items: [
            {
                title: "Solicitud de compra",
                icon: <ClipboardDocumentListIcon  className="h-4 w-4" />,
                href: "/solicitud-compra",
                roles: [UserRole.ADMIN,]
            },
            {
                title: "Orden de compra",
                icon: <ShoppingCartIcon className="h-4 w-4" />,
                href: "/orden-compra",
                roles: [UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS]
            },
            {
                title: "Agenda - Citas",
                icon: <BookOpenIcon className="h-4 w-4" />,
                href: "/agenda",
                roles: [UserRole.ADMIN ]
            },
            {
                title: "Fecha de entrega",
                icon: <CalendarDaysIcon className="h-4 w-4" />,
                href: "/entrega",
                roles: [UserRole.ADMIN,]
            },
            {
                title: "Recepción",
                icon: <FolderIcon className="h-4 w-4" />,
                href: "/recepcion",
                roles: [UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR]
            },
            {
                title: "Facturas",
                icon: <DocumentTextIcon className="h-4 w-4" />,
                href: "/factura",
                roles: [UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.FINANZAS, UserRole.COMPRAS]
            },
            {
                title: "Cronograma de pago",
                icon: <ClockIcon className="h-4 w-4" />,
                href: "/cronograma",
                roles: [UserRole.ADMIN,]
            },
            {
                title: "Pagos",
                icon: <CreditCardIcon className="h-4 w-4" />,
                href: "/pagos",
                roles: [UserRole.ADMIN,]
            },
            {
                title: "Licitación",
                icon: <ScaleIcon className="h-4 w-4" />,
                href: "/licitacion",
                roles: [UserRole.ADMIN]
            }
        ]
    },
    {
        title: "Finanzas",
        icon: <CurrencyDollarIcon className="h-5 w-5" />,
        roles: [UserRole.ADMIN, UserRole.FINANZAS],
        items: [
            {
                title: "Estado de Pagos",
                icon: <CreditCardIcon className="h-4 w-4" />,
                href: "/finanzas/pagos",
                roles: [UserRole.ADMIN, UserRole.FINANZAS]
            },
            {
                title: "Cuentas por Pagar",
                icon: <DocumentTextIcon className="h-4 w-4" />,
                href: "/finanzas/cuentas-por-pagar",
                roles: [UserRole.ADMIN, UserRole.FINANZAS]
            },
            {
                title: "Conciliación",
                icon: <CalculatorIcon className="h-4 w-4" />,
                href: "/finanzas/conciliacion",
                roles: [UserRole.ADMIN, UserRole.FINANZAS]
            }
        ]
    },
    {
        title: "Reportes",
        icon: <ChartBarIcon className="h-5 w-5" />,
        roles: [UserRole.ADMIN ],
        items: [
            {
                title: "Análisis de proveedores",
                icon: <UsersIcon className="h-4 w-4" />,
                href: "/reportes/proveedores",
                roles: [UserRole.ADMIN, UserRole.COMPRAS]
            },
            {
                title: "Métricas de compras",
                icon: <ChartBarIcon className="h-4 w-4" />,
                href: "/reportes/compras",
                roles: [UserRole.ADMIN, UserRole.COMPRAS]
            },
            {
                title: "Reportes Financieros",
                icon: <CurrencyDollarIcon className="h-4 w-4" />,
                href: "/reportes/financieros",
                roles: [UserRole.ADMIN, UserRole.FINANZAS]
            },
            {
                title: "Dashboard Ejecutivo",
                icon: <PresentationChartBarIcon className="h-4 w-4" />,
                href: "/reportes/ejecutivo",
                roles: [UserRole.ADMIN]
            }
        ]
    },
    {
        title: "Configuración",
        icon: <Cog6ToothIcon className="h-5 w-5" />,
        roles: [UserRole.ADMIN ],
        items: [
            {
                title: "Perfil",
                icon: <UserCircleIcon className="h-4 w-4" />,
                href: "/configuracion/perfil",
                roles: [UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.FINANZAS]
            },
            {
                title: "Sistema",
                icon: <Cog6ToothIcon className="h-4 w-4" />,
                href: "/configuracion/sistema",
                roles: [UserRole.ADMIN]
            },
            {
                title: "Usuarios",
                icon: <UsersIcon className="h-4 w-4" />,
                href: "/configuracion/usuarios",
                roles: [UserRole.ADMIN]
            },
            {
                title: "Permisos",
                icon: <ShieldCheckIcon className="h-4 w-4" />,
                href: "/configuracion/permisos",
                roles: [UserRole.ADMIN]
            }
        ]
    },
    {
        title: "Guia de Ayuda",
        icon: <InformationCircleIcon className="h-5 w-5" />,
        roles: [UserRole.ADMIN, UserRole.COMPRAS ],
        items: [
            {
                title: "Manual de uso",
                icon: <DocumentTextIcon className="h-4 w-4" />,
                href: "/ayuda/manual",
                roles: [UserRole.ADMIN, UserRole.COMPRAS]
            },
            {
                title: "Video",
                icon: <VideoCameraIcon className="h-4 w-4" />,
                href: "/ayuda/video",
                roles: [UserRole.ADMIN, UserRole.COMPRAS]
            }
        ]
    }
];


export const getMenuByRole = (userRole: UserRole): MenuItem[] => {
    return menuItems.filter(item => item.roles.includes(userRole)).map(item => ({
        ...item,
        items: item.items?.filter(subItem => subItem.roles.includes(userRole))
    }));
};