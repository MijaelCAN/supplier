import { useState } from "react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Drawer({ isOpen, onClose }: DrawerProps) {
    return (
        <div
            className={`fixed top-0 left-0 w-full h-screen bg-white z-50 transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            <div className="flex flex-col h-full">
                <header className="flex justify-between items-center py-4 px-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold">Menú de Opciones</h2>
                    <Button onClick={onClose} variant="text" className="text-gray-600">
                        Cerrar
                    </Button>
                </header>
                <nav className="flex-grow overflow-y-auto p-6">
                    <ul>
                        <li className="py-2">
                            <Link href="/opcion1" className="text-current">
                                Opción 1
                            </Link>
                        </li>
                        <li className="py-2">
                            <Link href="/opcion2" className="text-current">
                                Opción 2
                            </Link>
                        </li>
                        <li className="py-2">
                            <Link href="/opcion3" className="text-current">
                                Opción 3
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}
