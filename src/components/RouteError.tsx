// src/components/RouteError.tsx
// Pantalla de error de las rutas: reemplaza el "Unexpected Application Error!" de React Router.
import { useRouteError } from "react-router-dom";
import { Button } from "@heroui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const RouteError = () => {
  const error = useRouteError();
  console.error("Error en la pantalla:", error);
  const detalle = error instanceof Error ? error.message : String(error ?? "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center shadow-lg dark:bg-gray-800">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ocurrió un problema al mostrar la pantalla</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recarga la página para continuar. Si usas el traductor del navegador, desactívalo para este sitio.
        </p>
        <div className="flex justify-center gap-2">
          <Button color="primary" onPress={() => window.location.reload()}>
            Recargar
          </Button>
          <Button variant="flat" onPress={() => window.location.assign("/")}>
            Ir al inicio
          </Button>
        </div>
        {detalle && <p className="break-words text-xs text-gray-400">{detalle}</p>}
      </div>
    </div>
  );
};

export default RouteError;
