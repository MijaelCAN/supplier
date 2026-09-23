import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";
import { waitForApiBaseResolution } from "@/config/api";
import { ensureAdminSeeded } from "@/services/auth/seedAdmin";

// Tras un nuevo deploy, los chunks de una sesión vieja (hash de build anterior)
// dejan de existir en el servidor. Vite dispara este evento cuando un import()
// dinámico falla por eso; recargamos una sola vez para traer la build actual.
const PRELOAD_ERROR_RELOAD_KEY = 'vite-preload-error-reload';
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem(PRELOAD_ERROR_RELOAD_KEY)) return;
  sessionStorage.setItem(PRELOAD_ERROR_RELOAD_KEY, '1');
  window.location.reload();
});
// Si este script (el shell) se ejecuta, la build actual cargó bien: liberamos
// el flag para que un futuro deploy pueda volver a disparar el auto-reload.
sessionStorage.removeItem(PRELOAD_ERROR_RELOAD_KEY);

// Establecer tema light por defecto antes de renderizar
if (!localStorage.getItem('heroui-theme') && !localStorage.getItem('nextui-theme')) {
  localStorage.setItem('heroui-theme', 'light');
  document.documentElement.classList.remove('dark');
}

ensureAdminSeeded().catch((error) => {
  console.error('[Firebase Seed] Error al preparar el usuario administrador.', error);
});

// Probe en background: el httpClient ya espera por esta promesa antes de cada petición,
// así que no hay necesidad de bloquear el render de React.
void waitForApiBaseResolution();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>,
);
