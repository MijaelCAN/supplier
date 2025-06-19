import {Route, Routes} from "react-router-dom";
import Login from "@/layouts/Auth";
import LoginPage from "@/pages/Auth/login.tsx";
import UpdateProfile from "@/pages/Proveedores/updateProfile.tsx";
import Home from "@/layouts/Home.tsx";
import PurchaseOrdersList from "@/pages/OrdenCompra/index.tsx";
import SupplierManagement from "@/pages/Proveedores/index.tsx";
import DocsPage from "@/pages/blog.tsx";
import ProveedorProfile from "@/pages/Proveedores/profile.tsx";
import SupplierEvaluations from "@/pages/Proveedores/evaluations.tsx";
import {UserRole} from "@/routes/menuTypes.ts";
import FormularioEvaluacion from "@/pages/Proveedores/evalForm.tsx";
import SupplierProfileCard from "@/pages/Proveedores/Profile/CardProfile.tsx";
import InvoicesList from "@/pages/Facturacion/index.tsx";
import PaymentsList from "@/pages/Finanzas/pagos.tsx";
import DashboardEjecutivo from "@/pages/Reportes/dashboard.tsx";
import UserManagement from "@/pages/Configuracion/usuarios.tsx";
import DashboardHome from "@/pages/Dashboard/index.tsx";
import ReceptionPage from "@/pages/Recepcion/index.tsx";
import SupplierProfileFixed from "@/pages/Proveedor/perfilFixed.tsx";
import React from "react";

/*const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/dashboard" element={<Login />}/>
            <Route path="/" element={<Home/>} />
            {/*<Route path="/orden-compra" element={<Dashboard />} /> *
            <Route path="/proveedores" element={<SupplierManagement />} />
            <Route path="/proveedores/nuevo" element={<UpdateProfile />} />
            <Route path="/proveedores/evaluaciones" element={<ProveedorProfile />} />
            <Route path="/orden-compra" element={<PurchaseOrderReception/>} />
            <Route path="/blog" element={<DocsPage />}  />
        </Routes>
    )
}
export default AppRoutes;*/

const AppRoutes = () => {
        const userRole = UserRole.ADMIN;

    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<LoginPage/>} />
            <Route path="/login" element={<LoginPage />}/>

            {/* Dashboard común */}
                <Route path="/dashboard" element={<DashboardHome />}/>

            {/* Rutas de Proveedores (Admin, Compras) */}
            <Route path="/proveedores" element={<SupplierManagement />} />
            {/*<Route path="/proveedores/evaluaciones" element={<SupplierEvaluations role={userRole}/>} />*/}
                <Route path="/proveedor/evaluacion" element={<FormularioEvaluacion role={userRole}/>} />
                {/*<Route path="/proveedores/homologaciones" element={<SupplierHomologations />} />*/}

            {/* Rutas del Perfil del Proveedor */}
                <Route path="/proveedor/perfil" element={<SupplierProfileFixed />} />
                <Route path="/proveedor/documentos" element={<ProveedorProfile />} />
                {/*<Route path="/proveedor/certificaciones" element={<SupplierCertifications />} />*/}

            {/* Rutas de Procesos de Compra */}
            <Route path="/orden-compra" element={<PurchaseOrdersList/>} />
                <Route path="/recepcion" element={<ReceptionPage />} />
                <Route path="/factura" element={<InvoicesList />} />
                <Route path="/pagos" element={<PaymentsList />} />
                {/*<Route path="/entrega" element={<DeliverySchedule />} />*/}
                {/*<Route path="/cronograma" element={<PaymentSchedule />} />*/}
                {/*<Route path="/agenda" element={<Agenda />} />*/}
                {/*<Route path="/licitacion" element={<Bidding />} />*/}

            {/* Rutas de Finanzas */}
                <Route path="/finanzas/pagos" element={<PaymentsList />} />
                {/*<Route path="/finanzas/cuentas-por-pagar" element={<AccountsPayable />} />*/}
                {/*<Route path="/finanzas/conciliacion" element={<Reconciliation />} />*/}

            {/* Rutas de Reportes */}
                {/*<Route path="/reportes/proveedores" element={<SupplierReports />} />*/}
                {/*<Route path="/reportes/compras" element={<PurchaseMetrics />} />*/}
                {/*<Route path="/reportes/financieros" element={<FinancialReports />} />*/}
                <Route path="/reportes/ejecutivo" element={<DashboardEjecutivo />} />

            {/* Rutas de Configuración */}
                {/*<Route path="/configuracion/perfil" element={<UserProfile />} />*/}
                {/*<Route path="/configuracion/sistema" element={<SystemConfig />} />*/}
                <Route path="/configuracion/usuarios" element={<UserManagement />} />
                {/*<Route path="/configuracion/permisos" element={<PermissionManagement />} />*/}

            {/* Ruta temporal para blog */}
            <Route path="/blog" element={<DocsPage />} />
        </Routes>
    );
};

export default AppRoutes;
