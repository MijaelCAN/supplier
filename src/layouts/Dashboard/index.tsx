import {ReactNode, useState} from "react";
import {Header} from "@/layouts/Dashboard/header.tsx";
import SideBar from "@/layouts/Dashboard/sideBar.tsx";
import {UserRole} from "@/routes/menuTypes.ts";

const Dashboard = ({ children }: { children: ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const item = localStorage.getItem("supplier");
    const userData = item ? JSON.parse(item) : null;
    //const userRole = userData && userData.role;
    const val = "nuevavariable";
    const userRole = UserRole.PROVEEDOR;

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
            <SideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userRole={userRole} />

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