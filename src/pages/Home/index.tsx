import React from 'react';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import AdminHome from './AdminHome';
import ProveedorHome from './ProveedorHome';
import ComprasHome from './ComprasHome';
import FinanzasHome from './FinanzasHome';

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
        default:
            // Default to AdminHome if role is not recognized
            return <AdminHome />;
    }
};

export default Home;