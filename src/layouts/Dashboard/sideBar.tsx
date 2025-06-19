import { BuildingOfficeIcon, XMarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { getMenuByRole } from "@/routes/menuItems.tsx";
import {Accordion, AccordionItem, Button} from "@heroui/react";
import {Avatar} from "@heroui/avatar";
import {FC} from "react";
import {Link, useNavigate} from "react-router-dom";
import {UserRole} from "@/routes/menuTypes.ts";
import { useAuth } from "@/store/authStore";

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
    
    // Get menu based on current user's role
    const menuForRole = currentUser ? useMenuByRole(currentUser.role) : [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (
        <aside
            className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0 z-50 transform w-72 transition-transform duration-300 ease-in-out shadow-xl ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:relative md:translate-x-0`}
        >
            {/* HEADER del Sidebar */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <div
                        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-white"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">AXIOM Solutions</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">v2.1.0</p>
                    </div>
                </div>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <XMarkIcon className="h-5 w-5 text-gray-500"/>
                </button>
            </div>

            {/* NAVIGATION */}
            {/*<nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">*/}
            <nav className="mt-6 px-3">
                <ul className="space-y-1">
                    {menuForRole.map((item, index) => (
                        <li key={index}>
                            {item.single ? (
                                <Link
                                    to={item.href}
                                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                                >
                                    <span className="text-gray-500 group-hover:text-blue-600 transition-colors">
                                        {item.icon}
                                    </span>
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            ) : (
                                <Accordion
                                    variant="light"
                                    className="px-0"
                                    itemClasses={{
                                        base: "px-0 py-0",
                                        title: "text-gray-700 dark:text-gray-300 font-medium",
                                        trigger: "px-3 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors",
                                        content: "pt-2 pb-0"
                                    }}
                                >
                                    <AccordionItem
                                        title={
                                            <div className="flex items-center space-x-3">
                                                <span className="text-gray-500">
                                                    {item.icon}
                                                </span>
                                                <span>{item.title}</span>
                                            </div>
                                        }
                                    >
                                        <div className="space-y-1 ml-8">
                                            {item.items.map((subItem, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    to={subItem.href}
                                                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                                                >
                                                    <span
                                                        className="text-gray-400 group-hover:text-blue-500 transition-colors">
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-750 mb-3">
                    <Avatar
                        size="sm"
                        src={currentUser?.avatar}
                        name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {currentUser?.email}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate capitalize">
                            {currentUser?.role}
                        </p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    className="w-full"
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