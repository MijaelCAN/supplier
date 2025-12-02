import type { NavigateOptions } from "react-router-dom";
import { useEffect } from "react";

import { HeroUIProvider } from "@heroui/system";
import { useHref } from "react-router-dom";
import {ReactNode} from "react";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: ReactNode }) {
  // Establecer tema light por defecto si no hay preferencia guardada
  useEffect(() => {
    // Verificar ambas posibles claves de localStorage
    const herouiTheme = localStorage.getItem('heroui-theme');
    const nextuiTheme = localStorage.getItem('nextui-theme');
    const savedTheme = herouiTheme || nextuiTheme;
    
    if (!savedTheme) {
      // Si no hay tema guardado, establecer light por defecto
      localStorage.setItem('heroui-theme', 'light');
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <HeroUIProvider useHref={useHref}>
      {children}
    </HeroUIProvider>
  );
}
