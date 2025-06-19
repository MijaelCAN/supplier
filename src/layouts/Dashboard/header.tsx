import {Bars3Icon, BellIcon} from "@heroicons/react/24/outline";
import {Link as Link2} from "react-router-dom";
import {Badge} from "@heroui/badge";
import {Button} from "@heroui/button";
import {ThemeSwitch} from "@/components/theme-switch.tsx";
import {Avatar} from "@heroui/avatar";
import {FC} from "react";
import {Input} from "@heroui/input";
import {Kbd} from "@heroui/kbd";
import {SearchIcon} from "@/components/icons.tsx";

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

const searchInput = (
    <Input
        aria-label="Search"
        classNames={{
            inputWrapper: "bg-default-100 hover:bg-default-200 transition-colors",
            input: "text-sm",
        }}
        endContent={
            <Kbd className="hidden lg:inline-block" keys={["command"]}>
                K
            </Kbd>
        }
        labelPlacement="outside"
        placeholder="Buscar en el sistema..."
        startContent={
            <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
        }
        type="search"
    />
);

const Header: FC<HeaderProps> = ({setSidebarOpen}) => {
    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">

            <div
                className="flex items-center justify-between px-6 py-4 md:hidden"> {/* QUITAR EL HIDDEN SI SE QUIERE VISUALIZAR */}
                {/* Botón menú móvil */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-400"/>
                </button>

                {/* Barra de navegación */}
                <div className="flex-1 flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white hidden md:block">
                            Panel de Control
                        </h2>
                        <div className="hidden md:block">
                            <nav className="flex space-x-4">
                                <Link2
                                    to="/dashboard"
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                    Inicio
                                </Link2>
                                <Link2
                                    to="/proveedores"
                                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Proveedores
                                </Link2>
                                <Link2
                                    to="/reportes"
                                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Reportes
                                </Link2>
                            </nav>
                        </div>
                    </div>

                    {/* Controles del header */}
                    <div className="flex items-center space-x-4">
                        {/* Buscador */}
                        <div className="hidden lg:block w-80">
                            {searchInput}
                        </div>

                        {/* Notificaciones */}
                        <Badge content="3" color="danger" size="sm">
                            <Button
                                isIconOnly
                                variant="light"
                                className="text-gray-600 dark:text-gray-400"
                            >
                                <BellIcon className="h-5 w-5"/>
                            </Button>
                        </Badge>

                        {/* Theme Switch */}
                        <ThemeSwitch/>

                        {/* Avatar del usuario */}
                        <div className="hidden sm:block">
                            <Avatar
                                size="sm"
                                src="https://i.pravatar.cc/150?u=user@example.com"
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export {Header};