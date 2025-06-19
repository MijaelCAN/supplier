import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Auth from "@/layouts/Auth";
import Dashboard from "@/layouts/Dashboard";
import NotFoundPage from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import { UserRole } from "./menuTypes";

// Import pages
import Proveedores from "@/pages/Proveedores";
import ProveedorProfile from "@/pages/Proveedores/Profile/CardProfile";
import EvaluationSuppliers from "@/pages/Proveedores/evaluations";
import EvaluationForm from "@/pages/Proveedores/evalForm";
import ExecutiveDashboard from "@/pages/Reportes/dashboard";

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
        <Proveedores />
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedor/perfil",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR]}>
        <ProveedorProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/proveedores/evaluaciones",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS]}>
        <EvaluationSuppliers />
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
  // Placeholder routes for future implementation
  {
    path: "/orden-compra",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR]}>
        <Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Órdenes de Compra</h1>
            <p className="text-gray-600">Página en construcción - Gestión de órdenes de compra</p>
          </div>
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/factura",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS, UserRole.PROVEEDOR]}>
        <Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Facturas</h1>
            <p className="text-gray-600">Página en construcción - Gestión de facturas</p>
          </div>
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/finanzas/pagos",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.FINANZAS]}>
        <Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Gestión de Pagos</h1>
            <p className="text-gray-600">Página en construcción - Procesamiento de pagos</p>
          </div>
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracion/usuarios",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
        <Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
            <p className="text-gray-600">Página en construcción - Administración de usuarios</p>
          </div>
        </Dashboard>
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
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR]}>
        <Dashboard>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Mi Agenda</h1>
            <p className="text-gray-600">Página en construcción - Calendario y fechas importantes</p>
          </div>
        </Dashboard>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pagos",
    element: (
      <ProtectedRoute requiredRoles={[UserRole.PROVEEDOR]}>
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
