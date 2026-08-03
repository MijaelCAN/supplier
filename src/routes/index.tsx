import { lazy, Suspense, ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Auth from "@/layouts/Auth";
import Dashboard from "@/layouts/Dashboard";
import NotFoundPage from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "./menuTypes";
import { Spinner } from "@heroui/react";

// ── Lazy pages ────────────────────────────────────────────────────────────────
const Home = lazy(() => import("@/pages/Home"));
const ProveedorProfile = lazy(() => import("@/pages/Proveedores/Profile/CardProfile"));
const EvaluationSuppliers = lazy(() => import("@/pages/Proveedores/evaluations"));
const EvaluationForm = lazy(() => import("@/pages/Proveedores/evalForm"));
const ExecutiveDashboard = lazy(() => import("@/pages/Reportes/dashboard"));
const SupplierManagement = lazy(() => import("@/pages/Proveedores/index"));
const PurchaseOrdersList = lazy(() => import("@/pages/OrdenCompra"));
const InvoicesList = lazy(() => import("@/pages/Facturas"));
const UserManagement = lazy(() => import("@/pages/Configuracion/usuarios"));
const PaymentsList = lazy(() => import("@/pages/Finanzas/pagos"));
const SolicitudCompra = lazy(() => import("@/pages/SolicitudCompra").then(m => ({ default: m.SolicitudCompra })));
const AgendaPage = lazy(() => import("@/pages/Agenda"));
const AppointmentDetail = lazy(() => import("@/pages/Agenda/AppointmentDetail"));
const EvaluationPage = lazy(() => import("@/pages/Agenda/EvaluationPage"));
const ReceptionPage = lazy(() => import("@/pages/Recepcion"));
const PaymentCalendar = lazy(() => import("@/pages/Pagos/Paymentcalendar "));
const ScheduleInvoices = lazy(() => import("@/pages/Pagos/ScheduleInvoices"));
const ConfirmacionRheFe = lazy(() => import("@/pages/Finanzas/confirmacionRheFe")
);

// ── Fallback de carga ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Spinner size="lg" color="primary" />
  </div>
);

// ── Helper: envuelve cualquier elemento en Suspense ───────────────────────────
const Lazy = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// ── Router ────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Auth />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Lazy><Home /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/proveedores",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.SEGURIDAD, UserRole.CALIDAD, UserRole.ALMACEN]}>
        <Lazy><SupplierManagement /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedor/perfil",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR, UserRole.ADMIN, UserRole.COMPRAS, UserRole.FINANZAS, UserRole.ALMACEN]}>
        <Lazy><ProveedorProfile /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedores/profile/:supplierCode",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.FINANZAS, UserRole.ALMACEN]}>
        <Lazy><ProveedorProfile /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedores/evaluaciones",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS]}>
        <Lazy><EvaluationSuppliers rol={"PROVEEDOR"} /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedor/evaluacion",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS]}>
        <Lazy><EvaluationForm /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reportes/ejecutivo",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS, UserRole.COMPRAS,]}>
        <Lazy><ExecutiveDashboard /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/solicitud-compra",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR]}>
        <Lazy><SolicitudCompra /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orden-compra",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR]}>
        <Lazy><PurchaseOrdersList /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/factura",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ALMACEN]}>
        <Lazy><InvoicesList /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/finanzas/pagos",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS]}>
        <Lazy><PaymentsList /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracion/usuarios",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
        <Lazy><UserManagement /></Lazy>
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
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ALMACEN, UserRole.SEGURIDAD, UserRole.CALIDAD, UserRole.PLANEAMIENTO]}>
        <Lazy><AgendaPage /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/agenda/detail/:appointmentId",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ALMACEN, UserRole.CALIDAD, UserRole.SEGURIDAD, UserRole.PLANEAMIENTO]}>
        <Lazy><AppointmentDetail /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/agenda/evaluation/:appointmentId",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.ALMACEN, UserRole.CALIDAD, UserRole.SEGURIDAD, UserRole.PLANEAMIENTO]}>
        <Lazy><EvaluationPage /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/recepcion",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ALMACEN, UserRole.SEGURIDAD, UserRole.CALIDAD]}>
        <Lazy><ReceptionPage /></Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "/cronograma",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR, UserRole.COMPRAS, UserRole.ADMIN]}>
        <Dashboard>
          <Lazy><PaymentCalendar /></Lazy>
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/cronograma/programar-facturas",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.FINANZAS]}>
        <Dashboard>
          <Lazy><ScheduleInvoices /></Lazy>
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
    path: "/finanzas/confirmacion-rhe-fe",
    element: (
      <ProtectedRoute
        requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS,  UserRole.COMPRAS,]}
      >
        <Lazy>
          <ConfirmacionRheFe />
        </Lazy>
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
