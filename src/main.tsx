import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";
import { ensureAdminSeeded } from "@/services/auth/seedAdmin";

ensureAdminSeeded().catch((error) => {
  console.error('[Firebase Seed] Error al preparar el usuario administrador.', error);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>,
);
