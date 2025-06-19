import { Link } from "@heroui/link";

import { Navbar } from "@/components/navbar";
import {useState} from "react";

export default function DefaultLayout({children,}: { children: React.ReactNode; }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

  return (
      <div className="relative flex flex-col h-screen">
          <Navbar setDrawerOpen={setDrawerOpen} />
          {/*<main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}
      </main>*/}
          <div
              className={`transition-all duration-300 ${
                  drawerOpen ? "translate-x-[250px]" : "translate-x-0"
              }`} // Aquí controlas el desplazamiento del contenido
          >
              {/*<DrawerCustom isOpen={drawerOpen}  setDrawerOpen={setDrawerOpen} />*/}
              <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">{children}</main>
          </div>
          <footer className="w-full flex items-center justify-center py-3">
              <Link
                  isExternal
                  className="flex items-center gap-1 text-current"
                  href="https://heroui.com"
                  title="heroui.com homepage"
              >
                  <span className="text-default-600">Powered by</span>
                  <p className="text-primary">VistonySAC</p>
              </Link>
          </footer>
      </div>
  );
}
