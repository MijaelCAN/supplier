import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import AdminHome from './AdminHome';
import ProveedorHome from './ProveedorHome';
import ComprasHome from './ComprasHome';
import FinanzasHome from './FinanzasHome';
import UnauthorizedHome from "@/pages/Home/UnauthorizedHome.tsx";
import AlmacenHome from "@/pages/Home/AlmacenHome.tsx";
import SeguridadHome from "@/pages/Home/SeguridadHome.tsx";
import CalidadHome from "@/pages/Home/CalidadHome.tsx";
import PlaneamientoHome from "@/pages/Home/PlaneamientoHome.tsx";

const Home = () => {
    const { currentUser, isAuthenticated } = useAuth();

    // If not authenticated, this shouldn't render (protected by ProtectedRoute)
    if (!isAuthenticated || !currentUser) {
        return null;
    }

    // Decide which home component to render based on user role
    switch (currentUser.role) {
        case UserRole.ADMIN:
            return <AdminHome />;
        case UserRole.PROVEEDOR:
            return <ProveedorHome />;
        case UserRole.COMPRAS:
            return <ComprasHome />;
        case UserRole.FINANZAS:
            return <FinanzasHome />;
        case UserRole.ALMACEN:
            return <AlmacenHome />;
        case UserRole.SEGURIDAD:
            return <SeguridadHome />;
        case UserRole.CALIDAD:
            return <CalidadHome />;
        case UserRole.PLANEAMIENTO:
            return <PlaneamientoHome />;
        default:
            // Default to UnauthorizedHome if role is not recognized
            return <UnauthorizedHome />;
    }
};

export default Home;