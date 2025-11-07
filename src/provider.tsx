import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import {ReactNode} from "react";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: ReactNode }) {
  //const navigate = useNavigate();

  return (
    <HeroUIProvider  useHref={useHref}>
      {children}
    </HeroUIProvider>
  );
}
