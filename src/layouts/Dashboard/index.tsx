import {ReactNode, useState} from "react";
import {Header} from "@/layouts/Dashboard/header.tsx";
import SideBar from "@/layouts/Dashboard/sideBar.tsx";

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

const readSidebarCollapsed = () => {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
        return false;
    }
};

const Dashboard = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Solo escritorio: el menú lateral se contrae a íconos a demanda y se recuerda entre pantallas
    const [sidebarCollapsed, setSidebarCollapsedState] = useState(readSidebarCollapsed);

    const setSidebarCollapsed = (collapsed: boolean) => {
        setSidebarCollapsedState(collapsed);
        try {
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
        } catch {
            // sin almacenamiento solo se pierde la preferencia
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Overlay para móvil */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - MENU LATERAL */}
            <SideBar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
            />

            {/* Contenido Principal */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Superior - CABECERA */}
                <Header setSidebarOpen={setSidebarOpen} />

                {/* Contenido */}
                <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    <div className=" mx-auto">
                        {children}
                    </div>
                </main>

                {/*<Footer />*/}
            </div>
        </div>
    );
};

export default Dashboard;
