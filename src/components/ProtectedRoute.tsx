import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRoles?: UserRole[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, currentUser } = useAuth();

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Si se especifican roles requeridos, verificar que el usuario tenga uno de ellos
    if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(currentUser.role)) {
            // Si no tiene el rol necesario, redirigir al home
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
