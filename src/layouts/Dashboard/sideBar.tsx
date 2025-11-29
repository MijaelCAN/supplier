import { XMarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { getMenuByRole } from "@/routes/menuItems.tsx";
import {Accordion, AccordionItem, Button, Divider} from "@heroui/react";
import {Avatar} from "@heroui/avatar";
import {FC} from "react";
import {Link, useNavigate, useLocation} from "react-router-dom";
import {UserRole} from "@/routes/menuTypes.ts";
import { useAuth } from "@/store/authStore";
import {ThemeSwitch} from "@/components/theme-switch.tsx";

interface SideBarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export const useMenuByRole = (userRole: UserRole) => {
    return getMenuByRole(userRole);
};

const SideBar: FC<SideBarProps> = ({sidebarOpen,setSidebarOpen}) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get menu based on current user's role
    const menuForRole = currentUser ? useMenuByRole(currentUser.role) : [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (href: string) => {
        return location.pathname === href || location.pathname.startsWith(href + '/');
    };

    return (
        <aside
            className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed inset-y-0 left-0 z-50 transform w-72 transition-transform duration-300 ease-in-out shadow-lg ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:relative md:translate-x-0 flex flex-col`}
        >
            {/* HEADER del Sidebar */}
            <div className="flex flex-col items-center justify-center p-5 md:p-6 border-b border-gray-200 dark:border-gray-800 relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                {/* Logo grande */}
                <div className="w-full flex justify-center mb-2">
                    <img 
                        src="/logoVersiónOriginal.png"
                        alt="VISTO LINK"
                        className="h-20 md:h-24 w-auto object-contain"
                    />
                </div>
                {/* Versión centrada con badge */}
                <div className="w-full text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rojo/10 text-rojo dark:bg-rojo/20 dark:text-rojo/80">
                        v1.0.0
                    </span>
                </div>
                {/* Botón cerrar - esquina superior derecha */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400"/>
                </button>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {menuForRole.map((item, index) => (
                        <li key={index}>
                            {item.single ? (
                                <Link
                                    to={item.href!}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                                        isActive(item.href!)
                                            ? 'bg-rojo text-white shadow-sm'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span className={`transition-colors ${
                                        isActive(item.href!)
                                            ? 'text-white'
                                            : 'text-gray-500 group-hover:text-rojo dark:group-hover:text-rojo'
                                    }`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-medium text-sm">{item.title}</span>
                                </Link>
                            ) : (
                                <Accordion
                                    variant="light"
                                    className="px-0"
                                    itemClasses={{
                                        base: "px-0 py-0",
                                        title: "text-gray-700 dark:text-gray-300 font-medium text-sm",
                                        trigger: "px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors",
                                        content: "pt-1 pb-2"
                                    }}
                                >
                                    <AccordionItem
                                        title={
                                            <div className="flex items-center space-x-3">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {item.icon}
                                                </span>
                                                <span>{item.title}</span>
                                            </div>
                                        }
                                    >
                                        <div className="space-y-1 ml-11">
                                            {item.items!.map((subItem, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    to={subItem.href!}
                                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                                                        isActive(subItem.href!)
                                                            ? 'bg-rojo/10 text-rojo dark:bg-rojo/20 dark:text-rojo/80 border-l-2 border-rojo'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                                >
                                                    <span className={`transition-colors ${
                                                        isActive(subItem.href!)
                                                            ? 'text-rojo'
                                                            : 'text-gray-400 group-hover:text-rojo dark:group-hover:text-rojo'
                                                    }`}>
                                                        {subItem.icon}
                                                    </span>
                                                    <span>{subItem.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </AccordionItem>
                                </Accordion>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            {/* FOOTER del Sidebar */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-3 shadow-sm">
                    <Avatar
                        size="sm"
                        src={currentUser?.avatar}
                        name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        className="ring-2 ring-gray-200 dark:ring-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {currentUser?.email}
                        </p>
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gris/10 text-gris dark:bg-gris/20 dark:text-gris/80 capitalize">
                            {currentUser?.role}
                        </span>
                    </div>
                </div>

                <Divider className="my-3" />

                {/* Theme Switch */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-3">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tema</span>
                    <ThemeSwitch />
                </div>

                {/* Logout Button */}
                <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    className="w-full font-medium"
                    startContent={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                    onPress={handleLogout}
                >
                    Cerrar Sesión
                </Button>
            </div>
        </aside>
    );
}
export default SideBar;