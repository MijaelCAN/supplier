import {createBrowserRouter, Navigate} from "react-router-dom";
import Auth from "@/layouts/Auth";
import Dashboard from "@/layouts/Dashboard";
import NotFoundPage from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import {UserRole} from "./menuTypes";

// Import pages
import ProveedorProfile from "@/pages/Proveedores/Profile/CardProfile";
import EvaluationSuppliers from "@/pages/Proveedores/evaluations";
import EvaluationForm from "@/pages/Proveedores/evalForm";
import ExecutiveDashboard from "@/pages/Reportes/dashboard";
import SupplierManagement from "@/pages/Proveedores/index.tsx";
import PurchaseOrdersList from "@/pages/OrdenCompra";
import InvoicesList from "@/pages/Facturas";
import UserManagement from "@/pages/Configuracion/usuarios.tsx";
import PaymentsList from "@/pages/Finanzas/pagos.tsx";
import {SolicitudCompra} from "@/pages/SolicitudCompra";
import AgendaPage from "@/pages/Agenda";
import AppointmentDetailPage from "@/pages/Agenda/AppointmentDetail";
import EvaluationPage from "@/pages/Agenda/EvaluationPage";
import ReceptionPage from "@/pages/Recepcion";
import PaymentCalendar from "@/pages/Pagos/Paymentcalendar ";
import ScheduleInvoices from "@/pages/Pagos/ScheduleInvoices";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Auth />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: <Navigate to="/" replace />, // Redirect old dashboard to home
  },
  {
    path: "/proveedores",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS]}>
        <SupplierManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedor/perfil",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR, UserRole.ADMIN, UserRole.COMPRAS, UserRole.FINANZAS, UserRole.ALMACEN]}>
        <ProveedorProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedores/profile/:supplierCode",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.FINANZAS, UserRole.ALMACEN]}>
        <ProveedorProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedores/evaluaciones",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS]}>
        <EvaluationSuppliers rol={"PROVEEDOR"} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedor/evaluacion",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS]}>
        <EvaluationForm />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reportes/ejecutivo",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS]}>
        <ExecutiveDashboard />
      </ProtectedRoute>
    ),
  },
  // Solicitud de compra
  {
    path: "/solicitud-compra",
    element: (
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR]}>
          {/*<Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Órdenes de Compra</h1>
            <p className="text-gray-600">Página en construcción - Gestión de órdenes de compra</p>
          </div>
        </Dashboard>*/}
          <SolicitudCompra />
        </ProtectedRoute>
    ),
  },
  // Placeholder routes for future implementation
  {
    path: "/orden-compra",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR]}>
        {/*<Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Órdenes de Compra</h1>
            <p className="text-gray-600">Página en construcción - Gestión de órdenes de compra</p>
          </div>
        </Dashboard>*/}
        <PurchaseOrdersList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/factura",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS, UserRole.PROVEEDOR, UserRole.COMPRAS]}>
        <InvoicesList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finanzas/pagos",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS]}>
        {/*<Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Gestión de Pagos</h1>
            <p className="text-gray-600">Página en construcción - Procesamiento de pagos</p>
          </div>
        </Dashboard>*/}
        <PaymentsList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracion/usuarios",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
        {/*<Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
            <p className="text-gray-600">Página en construcción - Administración de usuarios</p>
          </div>
        </Dashboard>*/}
        < UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracion/sistema",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
        <Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Configuración del Sistema</h1>
            <p className="text-gray-600">Página en construcción - Configuración general</p>
          </div>
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracion/permisos",
    element: (
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <Dashboard>
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Configuración del Sistema</h1>
              <p className="text-gray-600">Página en construcción - Configuración general</p>
            </div>
          </Dashboard>
        </ProtectedRoute>
    ),
  },
  {
    path: "/cotizaciones",
    element: (
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR]}>
          <Dashboard>
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Cotizaciones</h1>
              <p className="text-gray-600">Página en construcción - Gestión de cotizaciones</p>
            </div>
          </Dashboard>
        </ProtectedRoute>
    ),
  },
  {
    path: "/agenda",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ALMACEN]}>
        <AgendaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agenda/detail/:appointmentId",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ALMACEN, UserRole.CALIDAD, UserRole.SEGURIDAD]}>
        <AppointmentDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/agenda/evaluation/:appointmentId",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.ALMACEN, UserRole.CALIDAD, UserRole.SEGURIDAD]}>
        <EvaluationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/recepcion",
    element: (
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ALMACEN]}>
          <ReceptionPage />
        </ProtectedRoute>
    ),
  },
  {
    path: "/cronograma",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ADMIN]}>
        <Dashboard>
          <PaymentCalendar />
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/cronograma/programar-facturas",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.FINANZAS]}>
        <Dashboard>
          <ScheduleInvoices />
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pagos",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ADMIN]}>
        <Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Mis Pagos</h1>
            <p className="text-gray-600">Página en construcción - Estado de pagos del proveedor</p>
          </div>
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
